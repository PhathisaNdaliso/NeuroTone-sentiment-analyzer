import { SentimentResult, SentimentType, Keyword, SentimentScore } from '@/types/sentiment';
import { supabase } from '@/integrations/supabase/client';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface AIKeyword {
  word: string;
  influence: 'positive' | 'negative' | 'neutral';
  weight: number;
  percentageContribution: number;
}

interface AISentimentResponse {
  sentiment: SentimentType;
  confidence: number;
  scores: SentimentScore;
  keywords: AIKeyword[];
  explanation: string;
  error?: string;
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const { data, error } = await supabase.functions.invoke<AISentimentResponse>('analyze-sentiment', {
      body: { text }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Analysis failed');
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Invalid response from analysis');
    }

    // Transform AI keywords to match our Keyword type
    const keywords: Keyword[] = data.keywords.map(k => ({
      word: k.word,
      influence: k.influence,
      weight: k.weight,
      percentageContribution: k.percentageContribution
    }));

    return {
      id: generateId(),
      text,
      sentiment: data.sentiment,
      confidence: data.confidence,
      scores: data.scores,
      keywords,
      explanation: data.explanation,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    throw error;
  }
}

export async function analyzeBatch(texts: string[], onProgress?: (progress: number) => void): Promise<SentimentResult[]> {
  const results: SentimentResult[] = [];
  
  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await analyzeSentiment(texts[i]);
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze text ${i + 1}:`, error);
      // Continue with other texts even if one fails
    }
    onProgress?.((i + 1) / texts.length * 100);
  }
  
  return results;
}

export function calculateBatchSummary(results: SentimentResult[]) {
  const summary = {
    total: results.length,
    positive: results.filter(r => r.sentiment === 'positive').length,
    negative: results.filter(r => r.sentiment === 'negative').length,
    neutral: results.filter(r => r.sentiment === 'neutral').length,
    averageConfidence: results.reduce((acc, r) => acc + r.confidence, 0) / results.length,
  };
  
  return summary;
}
