import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TextInputArea } from '@/components/sentiment/TextInputArea';
import { FileUpload } from '@/components/sentiment/FileUpload';
import { SentimentResultCard } from '@/components/sentiment/SentimentResultCard';
import { SentimentChart } from '@/components/sentiment/SentimentChart';
import { ConfidenceHistogram } from '@/components/sentiment/ConfidenceHistogram';
import { ExportButtons } from '@/components/sentiment/ExportButtons';
import { BatchProgress } from '@/components/sentiment/BatchProgress';
import { ResultsList } from '@/components/sentiment/ResultsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { analyzeSentiment, analyzeBatch } from '@/lib/sentiment-analyzer';
import { SentimentResult } from '@/types/sentiment';
import { Type, Upload, Trash2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Understand the Emotion
            <br />
            <span className="text-primary">Behind Every Word</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze text sentiment with AI-powered precision. Get detailed insights, 
            keyword extraction, and visualizations for single texts or entire datasets.
          </p>
        </section>

        {/* Input Section */}
        <section className="mb-8">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="text" className="gap-2">
                <Type className="w-4 h-4" />
                Text Input
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-2">
                <Upload className="w-4 h-4" />
                File Upload
              </TabsTrigger>
            </TabsList>
            
            <div className="max-w-3xl mx-auto">
              <TabsContent value="text" className="mt-0">
                <div className="sentiment-card">
                  <TextInputArea onAnalyze={handleSingleAnalysis} isAnalyzing={isAnalyzing} />
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="mt-0">
                <div className="sentiment-card">
                  <FileUpload onTextsLoaded={handleBatchAnalysis} />
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Upload a CSV or TXT file with one text entry per line for batch analysis
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </section>

        {/* Batch Progress */}
        {isAnalyzing && batchProgress.total > 0 && (
          <section className="max-w-3xl mx-auto mb-8">
            <BatchProgress progress={batchProgress.current} total={batchProgress.total} />
          </section>
        )}

        {/* Latest Result */}
        {latestResult && !isAnalyzing && (
          <section className="max-w-3xl mx-auto mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Latest Analysis</h3>
            </div>
            <SentimentResultCard result={latestResult} showFullText />
          </section>
        )}

        {/* Results & Charts Section */}
        {results.length > 0 && (
          <section className="space-y-8">
            {/* Actions Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">
                  {results.length} {results.length === 1 ? 'result' : 'results'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <ExportButtons results={results} />
                <Button variant="outline" size="sm" onClick={clearResults} className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              </div>
            </div>

            {/* Charts */}
            {results.length > 1 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <SentimentChart results={results} />
                <ConfidenceHistogram results={results} />
              </div>
            )}

            {/* Results List */}
            <ResultsList results={results} />
          </section>
        )}

        {/* Empty State */}
        {results.length === 0 && !isAnalyzing && (
          <section className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Analysis Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter some text or upload a file to start analyzing sentiment. 
              Results will appear here with detailed insights and visualizations.
            </p>
          </section>
        )}

        {/* Model Info */}
        <section className="mt-16 pt-8 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <h4 className="font-semibold mb-2">About the Analysis</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This dashboard uses a lexicon-based sentiment analysis approach optimized for 
              real-time processing. For production use with advanced NLP capabilities, 
              connect to Hugging Face or AWS Comprehend APIs. The current implementation 
              provides confidence thresholds above 70% for reliable classifications.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
