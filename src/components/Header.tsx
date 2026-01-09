import { Sparkles, Github, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SentimentLens</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Sentiment Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <a href="https://docs.lovable.dev" target="_blank" rel="noopener noreferrer">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Docs</span>
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
