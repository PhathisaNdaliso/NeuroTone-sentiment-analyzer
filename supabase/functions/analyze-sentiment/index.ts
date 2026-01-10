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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Analyzing sentiment for text:", text.substring(0, 100) + "...");

    const systemPrompt = `You are an expert sentiment analysis system. Analyze the given text accurately, considering context, sarcasm, and implicit meanings.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze the sentiment of this text: "${text}"` }
        ],
        temperature: 0.2,
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_sentiment",
              description: "Return the sentiment analysis results for the given text",
              parameters: {
                type: "object",
                properties: {
                  sentiment: {
                    type: "string",
                    enum: ["positive", "negative", "neutral"],
                    description: "The overall sentiment of the text"
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
                    description: "2-3 sentence explanation of the sentiment"
                  }
                },
                required: ["sentiment", "confidence", "scores", "keywords", "explanation"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_sentiment" } }
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
      throw new Error("AI analysis failed");
    }

    const aiResponse = await response.json();
    console.log("AI response:", JSON.stringify(aiResponse, null, 2));

    // Extract tool call arguments
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'analyze_sentiment') {
      console.error("No tool call in AI response:", aiResponse);
      throw new Error("Invalid AI response format");
    }

    let parsedContent: SentimentResponse;
    try {
      parsedContent = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool arguments:", parseError, toolCall.function.arguments);
      throw new Error("Failed to parse sentiment analysis");
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
      explanation: parsedContent.explanation || 'Sentiment analysis completed.',
    };

    console.log("Sentiment analysis result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
