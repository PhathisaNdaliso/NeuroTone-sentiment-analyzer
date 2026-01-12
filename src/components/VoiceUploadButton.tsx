import { useCallback, useRef, useState } from 'react';
import { Mic, FileAudio, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceSentimentResult {
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

interface VoiceUploadButtonProps {
  onAnalysisComplete: (result: VoiceSentimentResult) => void;
}

export function VoiceUploadButton({ onAnalysisComplete }: VoiceUploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processAudio = useCallback(async (file: File) => {
    setError(null);
    
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    const isValidType = validTypes.some(type => file.type.includes(type.split('/')[1])) || 
                        file.name.match(/\.(wav|mp3|webm|ogg|m4a)$/i);
    
    if (!isValidType) {
      setError('Please upload a valid audio file (WAV, MP3, WebM, OGG, M4A)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be less than 25MB');
      return;
    }

    setFile(file);
    setIsAnalyzing(true);

    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const { data, error: fnError } = await supabase.functions.invoke<VoiceSentimentResult>('analyze-voice-sentiment', {
        body: { 
          audio: base64,
          mimeType: file.type
        }
      });

      if (fnError) {
        console.error('Voice analysis error:', fnError);
        throw new Error(fnError.message || 'Analysis failed');
      }

      if (!data) {
        throw new Error('No response from analysis');
      }

      toast.success('Voice analysis complete!');
      onAnalysisComplete(data);
      setOpen(false);
      setFile(null);
    } catch (err) {
      console.error('Failed to analyze audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze audio');
      toast.error('Failed to analyze audio');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processAudio(droppedFile);
    }
  }, [processAudio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processAudio(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setIsAnalyzing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isAnalyzing) {
        setOpen(newOpen);
        if (!newOpen) {
          clearFile();
        }
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 h-full">
          <Mic className="w-4 h-4" />
          Voice Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Sentiment Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload an audio file to analyze sentiment from voice tone, pitch, and spoken content.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isAnalyzing && inputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
              isAnalyzing ? 'cursor-wait' : 'cursor-pointer',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50',
              file && !error && 'border-emerald-500 bg-emerald-500/5'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".wav,.mp3,.webm,.ogg,.m4a,audio/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isAnalyzing}
            />
            
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div>
                  <p className="font-medium">Analyzing voice...</p>
                  <p className="text-sm text-muted-foreground">
                    Transcribing and detecting sentiment
                  </p>
                </div>
              </div>
            ) : file ? (
              <div className="flex items-center justify-center gap-3">
                <FileAudio className="w-8 h-8 text-emerald-500" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Mic className={cn(
                  'w-10 h-10 mx-auto transition-colors',
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="font-medium">Drop audio file here or click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    Supports WAV, MP3, WebM, OGG, M4A (max 25MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-500">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Great for call center analysis:</strong> Upload customer service recordings to analyze both spoken content and emotional tone for comprehensive sentiment insights.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
