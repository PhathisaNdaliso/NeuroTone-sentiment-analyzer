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

    const systemPrompt = `You are an expert sentiment analysis system. Analyze the given text and provide a detailed sentiment analysis.

Your response MUST be a valid JSON object with this exact structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": number between 0 and 1,
  "scores": {
    "positive": number between 0 and 1,
    "negative": number between 0 and 1,
    "neutral": number between 0 and 1
  },
  "keywords": [
    {
      "word": "keyword",
      "influence": "positive" | "negative" | "neutral",
      "weight": number between 0 and 1,
      "percentageContribution": number between 0 and 100
    }
  ],
  "explanation": "A 2-3 sentence explanation of why this sentiment was detected"
}

Rules:
1. The scores must sum to approximately 1.0
2. Extract 3-8 keywords that most influence the sentiment
3. Each keyword's percentageContribution should reflect how much it contributes to the overall sentiment (all contributions should sum to approximately 100)
4. Be accurate and nuanced in your analysis
5. Consider context, sarcasm, and implicit meanings
6. ONLY respond with the JSON object, no additional text`;

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
          { role: "user", content: `Analyze the sentiment of this text:\n\n"${text}"` }
        ],
        temperature: 0.3,
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
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      throw new Error("Invalid AI response");
    }

    console.log("AI response:", content);

    // Parse the JSON response, handling potential markdown code blocks
    let parsedContent: SentimentResponse;
    try {
      let jsonString = content.trim();
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.slice(7);
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith('```')) {
        jsonString = jsonString.slice(0, -3);
      }
      parsedContent = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
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
