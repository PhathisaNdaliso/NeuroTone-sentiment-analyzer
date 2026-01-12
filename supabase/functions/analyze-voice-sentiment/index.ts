import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentimentResponse {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keywords: Array<{
    word: string;
    influence: 'positive' | 'negative' | 'neutral';
    weight: number;
    percentageContribution: number;
  }>;
  explanation: string;
  transcription: string;
  voiceAnalysis: {
    detectedTone: string;
    emotionalIndicators: string[];
    speakingStyle: string;
  };
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      return new Response(
        JSON.stringify({ error: 'Audio data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Processing audio for voice sentiment analysis, mimeType:", mimeType);

    // Use Gemini's multimodal capabilities for audio analysis
    const systemPrompt = `You are an expert voice and sentiment analysis system. Analyze the given audio to:
1. Transcribe the spoken content
2. Analyze the sentiment of the spoken words
3. Detect emotional indicators from voice tone (e.g., pitch, pace, emphasis)
4. Identify the overall speaking style and emotional state

Consider both the content (what is said) and the delivery (how it is said) for comprehensive sentiment analysis.`;

    // Create the audio content for Gemini
    const audioContent = {
      type: "input_audio",
      input_audio: {
        data: audio,
        format: mimeType?.includes('wav') ? 'wav' : mimeType?.includes('mp3') ? 'mp3' : 'wav'
      }
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              audioContent,
              { type: "text", text: "Analyze this audio recording. Transcribe what is being said and analyze the sentiment considering both the words and the tone of voice." }
            ]
          }
        ],
        temperature: 0.2,
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_voice_sentiment",
              description: "Return the voice sentiment analysis results including transcription and tone analysis",
              parameters: {
                type: "object",
                properties: {
                  transcription: {
                    type: "string",
                    description: "The transcribed text from the audio"
                  },
                  sentiment: {
                    type: "string",
                    enum: ["positive", "negative", "neutral"],
                    description: "The overall sentiment considering both content and tone"
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score between 0 and 1"
                  },
                  scores: {
                    type: "object",
                    properties: {
                      positive: { type: "number", description: "Positive score 0-1" },
                      negative: { type: "number", description: "Negative score 0-1" },
                      neutral: { type: "number", description: "Neutral score 0-1" }
                    },
                    required: ["positive", "negative", "neutral"]
                  },
                  keywords: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        word: { type: "string", description: "The keyword or phrase" },
                        influence: { type: "string", enum: ["positive", "negative", "neutral"] },
                        weight: { type: "number", description: "Weight 0-1" },
                        percentageContribution: { type: "number", description: "Percentage contribution 0-100" }
                      },
                      required: ["word", "influence", "weight", "percentageContribution"]
                    },
                    description: "3-8 keywords that influence the sentiment"
                  },
                  explanation: {
                    type: "string",
                    description: "2-3 sentence explanation of the sentiment considering both words and tone"
                  },
                  voiceAnalysis: {
                    type: "object",
                    properties: {
                      detectedTone: {
                        type: "string",
                        description: "The detected emotional tone (e.g., happy, frustrated, calm, anxious)"
                      },
                      emotionalIndicators: {
                        type: "array",
                        items: { type: "string" },
                        description: "List of emotional indicators detected in the voice"
                      },
                      speakingStyle: {
                        type: "string",
                        description: "Description of the speaking style (e.g., fast-paced, measured, emphatic)"
                      }
                    },
                    required: ["detectedTone", "emotionalIndicators", "speakingStyle"]
                  }
                },
                required: ["transcription", "sentiment", "confidence", "scores", "keywords", "explanation", "voiceAnalysis"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_voice_sentiment" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed: " + errorText);
    }

    const aiResponse = await response.json();
    console.log("AI response:", JSON.stringify(aiResponse, null, 2));

    // Extract tool call arguments
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'analyze_voice_sentiment') {
      console.error("No tool call in AI response:", aiResponse);
      throw new Error("Invalid AI response format");
    }

    let parsedContent: SentimentResponse;
    try {
      parsedContent = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool arguments:", parseError, toolCall.function.arguments);
      throw new Error("Failed to parse voice sentiment analysis");
    }

    // Validate and normalize the response
    const result: SentimentResponse = {
      sentiment: parsedContent.sentiment || 'neutral',
      confidence: Math.min(1, Math.max(0, parsedContent.confidence || 0.5)),
      scores: {
        positive: Math.min(1, Math.max(0, parsedContent.scores?.positive || 0.33)),
        negative: Math.min(1, Math.max(0, parsedContent.scores?.negative || 0.33)),
        neutral: Math.min(1, Math.max(0, parsedContent.scores?.neutral || 0.34)),
      },
      keywords: (parsedContent.keywords || []).slice(0, 8).map(k => ({
        word: k.word || '',
        influence: k.influence || 'neutral',
        weight: Math.min(1, Math.max(0, k.weight || 0.5)),
        percentageContribution: Math.min(100, Math.max(0, k.percentageContribution || 0)),
      })),
      explanation: parsedContent.explanation || 'Voice sentiment analysis completed.',
      transcription: parsedContent.transcription || '',
      voiceAnalysis: {
        detectedTone: parsedContent.voiceAnalysis?.detectedTone || 'neutral',
        emotionalIndicators: parsedContent.voiceAnalysis?.emotionalIndicators || [],
        speakingStyle: parsedContent.voiceAnalysis?.speakingStyle || 'normal',
      },
    };

    console.log("Voice sentiment analysis result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Voice sentiment analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
