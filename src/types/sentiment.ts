export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
}

export interface Keyword {
  word: string;
  influence: SentimentType;
  weight: number;
  percentageContribution?: number;
}

export interface VoiceAnalysis {
  detectedTone: string;
  emotionalIndicators: string[];
  speakingStyle: string;
}

export interface SentimentResult {
  id: string;
  text: string;
  sentiment: SentimentType;
  confidence: number;
  scores: SentimentScore;
  keywords: Keyword[];
  explanation: string;
  timestamp: Date;
  isVoiceAnalysis?: boolean;
  voiceAnalysis?: VoiceAnalysis;
}

export interface BatchResult {
  results: SentimentResult[];
  summary: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    averageConfidence: number;
  };
}

export interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  error: string | null;
}
