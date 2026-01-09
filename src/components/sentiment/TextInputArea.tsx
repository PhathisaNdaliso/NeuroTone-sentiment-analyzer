import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextInputAreaProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
  className?: string;
}

export function TextInputArea({ onAnalyze, isAnalyzing, className }: TextInputAreaProps) {
  const [text, setText] = useState('');
  const charCount = text.length;
  const maxChars = 5000;

  const handleSubmit = () => {
    if (text.trim() && !isAnalyzing) {
      onAnalyze(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          onKeyDown={handleKeyDown}
          placeholder="Enter text to analyze sentiment... (e.g., product reviews, social media posts, customer feedback)"
          className="min-h-[160px] resize-none text-base leading-relaxed pr-4"
          disabled={isAnalyzing}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={cn(
            'font-mono text-xs',
            charCount > maxChars * 0.9 ? 'text-negative' : 'text-muted-foreground'
          )}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd> to analyze
        </p>
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze Sentiment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
