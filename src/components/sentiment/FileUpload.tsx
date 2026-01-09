import { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onTextsLoaded: (texts: string[]) => void;
  className?: string;
}

export function FileUpload({ onTextsLoaded, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
      setError('Please upload a .txt or .csv file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      const content = await file.text();
      let texts: string[];

      if (file.name.endsWith('.csv')) {
        // Parse CSV - assume first column contains text
        const lines = content.split('\n').filter(line => line.trim());
        texts = lines.slice(1).map(line => {
          // Handle quoted CSV values
          const match = line.match(/^"([^"]*)"/) || line.match(/^([^,]*)/);
          return match ? match[1].trim() : line.split(',')[0].trim();
        }).filter(text => text.length > 0);
      } else {
        // Plain text - split by newlines
        texts = content.split('\n').filter(line => line.trim().length > 0);
      }

      if (texts.length === 0) {
        setError('No valid text entries found in file');
        return;
      }

      setFile(file);
      onTextsLoaded(texts);
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
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50',
          file && 'border-positive bg-positive/5'
        )}
      >
        <input
          type="file"
          accept=".txt,.csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-positive" />
            <div className="text-left">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.preventDefault(); clearFile(); }}
              className="ml-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className={cn(
              'w-10 h-10 mx-auto transition-colors',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div>
              <p className="font-medium">Drop file here or click to upload</p>
              <p className="text-sm text-muted-foreground">
                Supports .txt and .csv files (max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-negative">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
