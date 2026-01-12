import { useCallback, useRef, useState } from 'react';
import { Mic, FileAudio, X, AlertCircle, Loader2, Play, Pause, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface VoiceAnalysisSectionProps {
  onAnalysisComplete: (result: VoiceSentimentResult) => void;
}

export function VoiceAnalysisSection({ onAnalysisComplete }: VoiceAnalysisSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const processAudio = useCallback(async (file: File) => {
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    const isValidType = validTypes.some(type => file.type.includes(type.split('/')[1])) || 
                        file.name.match(/\.(wav|mp3|webm|ogg|m4a)$/i);
    
    if (!isValidType) {
      setError('Please upload a valid audio file (WAV, MP3, WebM, OGG, M4A)');
      return false;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be less than 25MB');
      return false;
    }

    return true;
  }, []);

  const handleFilesAdded = useCallback(async (newFiles: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      if (await processAudio(file)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  }, [processAudio]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  }, [handleFilesAdded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(e.target.files);
    }
    e.target.value = '';
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    const audioUrl = audioRefs.current.get(fileName)?.src;
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    audioRefs.current.delete(fileName);
    if (currentlyPlaying === fileName) {
      setCurrentlyPlaying(null);
    }
  };

  const togglePlayback = (file: File) => {
    const fileName = file.name;
    
    if (currentlyPlaying === fileName) {
      audioRefs.current.get(fileName)?.pause();
      setCurrentlyPlaying(null);
      return;
    }

    // Pause any currently playing audio
    if (currentlyPlaying) {
      audioRefs.current.get(currentlyPlaying)?.pause();
    }

    // Create audio element if it doesn't exist
    if (!audioRefs.current.has(fileName)) {
      const audio = new Audio(URL.createObjectURL(file));
      audio.onended = () => setCurrentlyPlaying(null);
      audioRefs.current.set(fileName, audio);
    }

    audioRefs.current.get(fileName)?.play();
    setCurrentlyPlaying(fileName);
  };

  const analyzeFile = async (file: File) => {
    try {
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
        throw new Error(fnError.message || 'Analysis failed');
      }

      if (!data) {
        throw new Error('No response from analysis');
      }

      return data;
    } catch (err) {
      throw err;
    }
  };

  const handleTranscribeAll = async () => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      for (const file of files) {
        const result = await analyzeFile(file);
        onAnalysisComplete(result);
        toast.success(`Analyzed: ${file.name}`);
      }
      setFiles([]);
      audioRefs.current.forEach(audio => URL.revokeObjectURL(audio.src));
      audioRefs.current.clear();
    } catch (err) {
      console.error('Failed to analyze audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze audio');
      toast.error('Failed to analyze audio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeSingle = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeFile(file);
      onAnalysisComplete(result);
      toast.success('Voice analysis complete!');
      removeFile(file.name);
    } catch (err) {
      console.error('Failed to analyze audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze audio');
      toast.error('Failed to analyze audio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="sentiment-card space-y-4">
      <div className="flex items-center gap-2">
        <Mic className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Voice Analysis</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Upload audio files for transcription and sentiment analysis. Great for call center recordings.
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200',
          isAnalyzing ? 'cursor-wait opacity-50' : 'cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".wav,.mp3,.webm,.ogg,.m4a,audio/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isAnalyzing}
          multiple
        />
        
        <div className="space-y-2">
          <Upload className={cn(
            'w-8 h-8 mx-auto transition-colors',
            isDragging ? 'text-primary' : 'text-muted-foreground'
          )} />
          <div>
            <p className="font-medium text-sm">Click to upload audio files</p>
            <p className="text-xs text-muted-foreground">
              MP3, WAV, M4A, WEBM supported
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-500">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div 
              key={file.name}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => togglePlayback(file)}
                disabled={isAnalyzing}
              >
                {currentlyPlaying === file.name ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAnalyzeSingle(file)}
                disabled={isAnalyzing}
                className="shrink-0"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Transcribe'
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeFile(file.name)}
                disabled={isAnalyzing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleTranscribeAll}
            disabled={isAnalyzing}
          >
            <Mic className="w-4 h-4" />
            Transcribe All ({files.length})
          </Button>
          <Button
            className="flex-1"
            onClick={handleTranscribeAll}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze & Get Sentiments'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
