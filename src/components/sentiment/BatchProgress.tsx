import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface BatchProgressProps {
  progress: number;
  total: number;
  className?: string;
}

export function BatchProgress({ progress, total, className }: BatchProgressProps) {
  const percentage = Math.round((progress / total) * 100);
  const completed = Math.floor(progress);

  return (
    <div className={cn('sentiment-card', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <div>
          <p className="font-medium">Processing Batch</p>
          <p className="text-sm text-muted-foreground">
            {completed} of {total} texts analyzed
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono font-medium">{percentage}%</span>
        </div>
        <div className="progress-bar h-3">
          <div
            className="progress-bar-fill bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
