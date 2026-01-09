import { SentimentResult, SentimentType, Keyword, SentimentScore } from '@/types/sentiment';

// Sentiment lexicon for keyword extraction
const positiveWords = [
  'love', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
  'happy', 'joy', 'pleased', 'delighted', 'perfect', 'best', 'brilliant',
  'superb', 'outstanding', 'exceptional', 'impressive', 'beautiful', 'good',
  'nice', 'enjoy', 'appreciate', 'thankful', 'grateful', 'recommend', 'satisfied'
];

const negativeWords = [
  'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing',
  'poor', 'useless', 'waste', 'angry', 'frustrated', 'annoyed', 'upset',
  'sad', 'unhappy', 'regret', 'mistake', 'fail', 'broken', 'ugly', 'boring',
  'slow', 'expensive', 'overpriced', 'never', 'avoid', 'complaint', 'problem'
];

const neutralWords = [
  'okay', 'average', 'normal', 'standard', 'typical', 'common', 'regular',
  'moderate', 'fair', 'acceptable', 'adequate', 'sufficient', 'basic'
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractKeywords(text: string): Keyword[] {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const keywords: Keyword[] = [];

  words.forEach(word => {
    if (positiveWords.includes(word)) {
      keywords.push({ word, influence: 'positive', weight: 0.8 + Math.random() * 0.2 });
    } else if (negativeWords.includes(word)) {
      keywords.push({ word, influence: 'negative', weight: 0.8 + Math.random() * 0.2 });
    } else if (neutralWords.includes(word)) {
      keywords.push({ word, influence: 'neutral', weight: 0.5 + Math.random() * 0.3 });
    }
  });

  return keywords.slice(0, 8);
}

function calculateScores(text: string): SentimentScore {
  const words = text.toLowerCase().split(/\W+/);
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
    if (neutralWords.includes(word)) neutralCount++;
  });

  const total = positiveCount + negativeCount + neutralCount || 1;
  
  // Add some variance for more realistic scores
  const basePositive = positiveCount / total;
  const baseNegative = negativeCount / total;
  const baseNeutral = neutralCount / total || 0.3;

  const scores = {
    positive: Math.min(0.98, Math.max(0.01, basePositive + (Math.random() * 0.1 - 0.05))),
    negative: Math.min(0.98, Math.max(0.01, baseNegative + (Math.random() * 0.1 - 0.05))),
    neutral: Math.min(0.98, Math.max(0.01, baseNeutral + (Math.random() * 0.1 - 0.05))),
  };

  // Normalize scores to sum to 1
  const sum = scores.positive + scores.negative + scores.neutral;
  scores.positive /= sum;
  scores.negative /= sum;
  scores.neutral /= sum;

  return scores;
}

function generateExplanation(sentiment: SentimentType, keywords: Keyword[], confidence: number): string {
  const keywordList = keywords.filter(k => k.influence === sentiment).map(k => `"${k.word}"`);
  
  if (sentiment === 'positive') {
    return `The text expresses a ${confidence > 0.8 ? 'strongly' : 'moderately'} positive sentiment${keywordList.length > 0 ? `, indicated by words like ${keywordList.slice(0, 3).join(', ')}` : ''}. The overall tone suggests satisfaction or approval.`;
  } else if (sentiment === 'negative') {
    return `The text conveys a ${confidence > 0.8 ? 'strongly' : 'moderately'} negative sentiment${keywordList.length > 0 ? `, driven by expressions such as ${keywordList.slice(0, 3).join(', ')}` : ''}. The tone indicates dissatisfaction or criticism.`;
  } else {
    return `The text maintains a neutral stance${keywordList.length > 0 ? `, with balanced language including ${keywordList.slice(0, 3).join(', ')}` : ''}. No strong emotional bias is detected.`;
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  const scores = calculateScores(text);
  const keywords = extractKeywords(text);
  
  // Determine sentiment from highest score
  let sentiment: SentimentType = 'neutral';
  let confidence = scores.neutral;
  
  if (scores.positive > scores.negative && scores.positive > scores.neutral) {
    sentiment = 'positive';
    confidence = scores.positive;
  } else if (scores.negative > scores.positive && scores.negative > scores.neutral) {
    sentiment = 'negative';
    confidence = scores.negative;
  }

  const explanation = generateExplanation(sentiment, keywords, confidence);

  return {
    id: generateId(),
    text,
    sentiment,
    confidence,
    scores,
    keywords,
    explanation,
    timestamp: new Date(),
  };
}

export async function analyzeBatch(texts: string[], onProgress?: (progress: number) => void): Promise<SentimentResult[]> {
  const results: SentimentResult[] = [];
  
  for (let i = 0; i < texts.length; i++) {
    const result = await analyzeSentiment(texts[i]);
    results.push(result);
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
