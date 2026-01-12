import { SentimentResult, SentimentType, Keyword, SentimentScore } from '@/types/sentiment';
import { supabase } from '@/integrations/supabase/client';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

let rateLimitCooldownUntil = 0;

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const now = Date.now();
      if (rateLimitCooldownUntil > now) {
        await sleep(rateLimitCooldownUntil - now);
      }

      // Add delay between retries (exponential backoff + jitter)
      if (attempt > 0) {
        const backoffMs = Math.min(12_000, 2500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
        await sleep(backoffMs);
      }

      const { data, error } = await supabase.functions.invoke<AISentimentResponse>('analyze-sentiment', {
        body: { text }
      });

      if (error) {
        console.error('Edge function error:', error);
        // Check if it's a rate limit error
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          const cooldownMs = 8000;
          rateLimitCooldownUntil = Math.max(rateLimitCooldownUntil, Date.now() + cooldownMs);
          lastError = new Error('Rate limit exceeded. Please wait a few seconds and try again.');
          continue; // Retry
        }
        throw new Error(error.message || 'Analysis failed');
      }

      if (!data || data.error) {
        if (data?.error?.includes('Rate limit')) {
          const cooldownMs = 8000;
          rateLimitCooldownUntil = Math.max(rateLimitCooldownUntil, Date.now() + cooldownMs);
          lastError = new Error('Rate limit exceeded. Please wait a few seconds and try again.');
          continue; // Retry
        }
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
      console.error(`Sentiment analysis attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error('Analysis failed');
      
      // Don't retry on non-rate-limit errors
      if (!lastError.message.includes('Rate limit') && !lastError.message.includes('429')) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Analysis failed after retries');
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

    onProgress?.(((i + 1) / texts.length) * 100);

    // Gentle pacing to reduce 429s during batch runs
    if (i < texts.length - 1) {
      await sleep(400);
    }
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
