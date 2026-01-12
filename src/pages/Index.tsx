import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Dashboard } from '@/pages/Dashboard';
import { ComparativeAnalysis } from '@/pages/ComparativeAnalysis';
import { analyzeSentiment, analyzeBatch } from '@/lib/sentiment-analyzer';
import { SentimentResult } from '@/types/sentiment';
import { useToast } from '@/hooks/use-toast';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function Index() {
  const [results, setResults] = useState<SentimentResult[]>([]);
  const [latestResult, setLatestResult] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const handleSingleAnalysis = useCallback(async (text: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeSentiment(text);
      setLatestResult(result);
      setResults(prev => [result, ...prev]);
      toast({
        title: 'Analysis Complete',
        description: `Detected ${result.sentiment} sentiment with ${Math.round(result.confidence * 100)}% confidence`,
      });
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        toast({
          title: 'Rate Limit Reached',
          description: 'Too many requests. Please wait a few seconds and try again.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('402') || errorMessage.includes('credits')) {
        toast({
          title: 'Credits Exhausted',
          description: 'AI credits have been used up.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Analysis Failed',
          description: 'Please try again later',
          variant: 'destructive',
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const handleBatchAnalysis = useCallback(async (texts: string[]) => {
    setIsAnalyzing(true);
    setBatchProgress({ current: 0, total: texts.length });
    
    try {
      const batchResults = await analyzeBatch(texts, (progress) => {
        setBatchProgress({ current: (progress / 100) * texts.length, total: texts.length });
      });
      
      setResults(prev => [...batchResults, ...prev]);
      if (batchResults.length > 0) {
        setLatestResult(batchResults[0]);
      }
      toast({
        title: 'Batch Analysis Complete',
        description: `Successfully analyzed ${texts.length} texts`,
      });
    } catch (error) {
      toast({
        title: 'Batch Analysis Failed',
        description: 'Some texts could not be analyzed',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  }, [toast]);

  const clearResults = () => {
    setResults([]);
    setLatestResult(null);
  };

  const deleteResult = useCallback((id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
    if (latestResult?.id === id) {
      setLatestResult(null);
    }
    toast({
      title: 'Result Deleted',
      description: 'The analysis result has been removed',
    });
  }, [latestResult, toast]);

  const handleVoiceAnalysis = useCallback((voiceResult: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    scores: { positive: number; negative: number; neutral: number };
    keywords: Array<{ word: string; influence: 'positive' | 'negative' | 'neutral'; weight: number; percentageContribution: number }>;
    explanation: string;
    transcription: string;
    voiceAnalysis: { detectedTone: string; emotionalIndicators: string[]; speakingStyle: string };
  }) => {
    const result: SentimentResult = {
      id: generateId(),
      text: voiceResult.transcription || '[Audio transcription]',
      sentiment: voiceResult.sentiment,
      confidence: voiceResult.confidence,
      scores: voiceResult.scores,
      keywords: voiceResult.keywords,
      explanation: voiceResult.explanation,
      timestamp: new Date(),
      isVoiceAnalysis: true,
      voiceAnalysis: voiceResult.voiceAnalysis,
    };
    setLatestResult(result);
    setResults(prev => [result, ...prev]);
    toast({
      title: 'Voice Analysis Complete',
      description: `Detected ${result.sentiment} sentiment with ${Math.round(result.confidence * 100)}% confidence`,
    });
  }, [toast]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 sticky top-0 z-40">
            <SidebarTrigger />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard
                    results={results}
                    latestResult={latestResult}
                    isAnalyzing={isAnalyzing}
                    batchProgress={batchProgress}
                    onSingleAnalysis={handleSingleAnalysis}
                    onBatchAnalysis={handleBatchAnalysis}
                    onVoiceAnalysis={handleVoiceAnalysis}
                    onDeleteResult={deleteResult}
                    onClearResults={clearResults}
                  />
                }
              />
              <Route 
                path="/comparative" 
                element={<ComparativeAnalysis results={results} />} 
              />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
