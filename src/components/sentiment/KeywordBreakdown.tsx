import { Keyword } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface KeywordBreakdownProps {
  keywords: Keyword[];
  className?: string;
}

const colors = {
  positive: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  negative: { bg: 'bg-rose-500/20', text: 'text-rose-400', bar: 'bg-rose-500' },
  neutral: { bg: 'bg-violet-500/20', text: 'text-violet-400', bar: 'bg-violet-500' },
};

export function KeywordBreakdown({ keywords, className }: KeywordBreakdownProps) {
  if (keywords.length === 0) return null;

  // Group keywords by influence and calculate total percentages
  const positiveKeywords = keywords.filter(k => k.influence === 'positive');
  const negativeKeywords = keywords.filter(k => k.influence === 'negative');
  const neutralKeywords = keywords.filter(k => k.influence === 'neutral');

  const totalWeight = keywords.reduce((acc, k) => acc + k.weight, 0);
  
  const positivePercent = totalWeight > 0 
    ? (positiveKeywords.reduce((acc, k) => acc + k.weight, 0) / totalWeight) * 100 
    : 0;
  const negativePercent = totalWeight > 0 
    ? (negativeKeywords.reduce((acc, k) => acc + k.weight, 0) / totalWeight) * 100 
    : 0;
  const neutralPercent = totalWeight > 0 
    ? (neutralKeywords.reduce((acc, k) => acc + k.weight, 0) / totalWeight) * 100 
    : 0;

  const groups = [
    { type: 'positive' as const, keywords: positiveKeywords, percent: positivePercent },
    { type: 'negative' as const, keywords: negativeKeywords, percent: negativePercent },
    { type: 'neutral' as const, keywords: neutralKeywords, percent: neutralPercent },
  ].filter(g => g.keywords.length > 0);

  return (
    <div className={cn('sentiment-card', className)}>
      <h3 className="text-lg font-semibold mb-4">Keyword Contribution</h3>
      
      {/* Percentage bars */}
      <div className="space-y-4 mb-6">
        {groups.map(({ type, percent }) => (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={cn('font-medium capitalize', colors[type].text)}>{type}</span>
              <span className="text-muted-foreground">{percent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn('h-full rounded-full transition-all duration-500', colors[type].bar)}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Keywords grouped by type */}
      <div className="space-y-4">
        {groups.map(({ type, keywords: groupKeywords }) => (
          <div key={type}>
            <p className={cn('text-xs font-medium mb-2 uppercase tracking-wide', colors[type].text)}>
              {type} indicators
            </p>
            <div className="flex flex-wrap gap-2">
              {groupKeywords.map((keyword, index) => (
                <span
                  key={`${keyword.word}-${index}`}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
                    colors[type].bg, colors[type].text
                  )}
                >
                  {keyword.word}
                  <span className="opacity-70 font-mono">
                    {Math.round(keyword.weight * 100)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
