import { useCallback, useRef, useState } from 'react';
import { Mic, FileAudio, X, AlertCircle, Loader2, Play, Pause, Volume2 } from 'lucide-react';
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

const SAMPLE_AUDIO_DEMOS = [
  {
    name: 'Happy Customer Call',
    description: 'Satisfied customer feedback',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    name: 'Neutral Inquiry',
    description: 'Standard support question',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    name: 'Frustrated Caller',
    description: 'Complaint scenario',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSampleIndex, setPlayingSampleIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sampleAudioRef = useRef<HTMLAudioElement>(null);

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
    setAudioUrl(URL.createObjectURL(file));
    setIsPlaying(false);
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
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setFile(null);
    setAudioUrl(null);
    setError(null);
    setIsAnalyzing(false);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleSamplePlayback = (index: number) => {
    if (!sampleAudioRef.current) return;
    
    if (playingSampleIndex === index) {
      sampleAudioRef.current.pause();
      setPlayingSampleIndex(null);
    } else {
      sampleAudioRef.current.src = SAMPLE_AUDIO_DEMOS[index].url;
      sampleAudioRef.current.play();
      setPlayingSampleIndex(index);
    }
  };

  const handleSampleAnalysis = async (sample: typeof SAMPLE_AUDIO_DEMOS[0]) => {
    setError(null);
    setIsAnalyzing(true);
    setPlayingSampleIndex(null);
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
    }

    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const { data, error: fnError } = await supabase.functions.invoke<VoiceSentimentResult>('analyze-voice-sentiment', {
        body: { 
          audio: base64,
          mimeType: 'audio/mpeg'
        }
      });

      if (fnError) {
        console.error('Voice analysis error:', fnError);
        throw new Error(fnError.message || 'Analysis failed');
      }

      if (!data) {
        throw new Error('No response from analysis');
      }

      toast.success('Sample voice analysis complete!');
      onAnalysisComplete(data);
      setOpen(false);
    } catch (err) {
      console.error('Failed to analyze sample audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze sample audio');
      toast.error('Failed to analyze sample audio');
    } finally {
      setIsAnalyzing(false);
    }
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
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
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
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {audioUrl && (
                  <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                      className="gap-2"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  </div>
                )}
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

          {/* Sample Audio Demos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sample Audio Demos</span>
            </div>
            <div className="grid gap-2">
              {SAMPLE_AUDIO_DEMOS.map((sample, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleSamplePlayback(index)}
                      disabled={isAnalyzing}
                    >
                      {playingSampleIndex === index ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <p className="text-sm font-medium">{sample.name}</p>
                      <p className="text-xs text-muted-foreground">{sample.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSampleAnalysis(sample)}
                    disabled={isAnalyzing}
                  >
                    Analyze
                  </Button>
                </div>
              ))}
            </div>
            <audio
              ref={sampleAudioRef}
              onEnded={() => setPlayingSampleIndex(null)}
              className="hidden"
            />
          </div>
          
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
