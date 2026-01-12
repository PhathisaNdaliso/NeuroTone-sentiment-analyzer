import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadButtonProps {
  onTextsLoaded: (texts: string[]) => void;
}

export function FileUploadButton({ onTextsLoaded }: FileUploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      setError('Please upload a .txt, .csv, or .json file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      const content = await file.text();
      let texts: string[];

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        texts = Array.isArray(data) ? data.map(item => typeof item === 'string' ? item : item.text || JSON.stringify(item)) : [content];
      } else if (file.name.endsWith('.csv')) {
        const lines = content.split('\n').filter(line => line.trim());
        texts = lines.slice(1).map(line => {
          const match = line.match(/^"([^"]*)"/) || line.match(/^([^,]*)/);
          return match ? match[1].trim() : line.split(',')[0].trim();
        }).filter(text => text.length > 0);
      } else {
        texts = content.split('\n').filter(line => line.trim().length > 0);
      }

      if (texts.length === 0) {
        setError('No valid text entries found in file');
        return;
      }

      setFile(file);
      onTextsLoaded(texts);
      setFile(null);
    } catch (err) {
      setError('Failed to read file');
    }
  }, [onTextsLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
    e.target.value = '';
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        Batch Upload
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a file with multiple texts for batch processing
      </p>
      
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex-1 relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[120px]',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50',
          file && 'border-emerald-500 bg-emerald-500/5'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.csv,.json"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-emerald-500" />
            <div className="text-left">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
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
            <Upload className={cn(
              'w-8 h-8 mx-auto transition-colors',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div>
              <p className="font-medium text-sm">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">
                TXT, CSV, JSON supported
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-500 mt-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
