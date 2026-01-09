import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SentimentResult } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface CurrentSentimentDonutProps {
  result: SentimentResult;
  className?: string;
}

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#8b5cf6',
};

export function CurrentSentimentDonut({ result, className }: CurrentSentimentDonutProps) {
  const data = [
    { name: 'Positive', value: result.scores.positive * 100, color: COLORS.positive },
    { name: 'Negative', value: result.scores.negative * 100, color: COLORS.negative },
    { name: 'Neutral', value: result.scores.neutral * 100, color: COLORS.neutral },
  ];

  return (
    <div className={cn('sentiment-card', className)}>
      <h3 className="text-lg font-semibold mb-2">Current Sentiment</h3>
      <p className="text-sm text-muted-foreground mb-4 truncate">{result.text.slice(0, 50)}...</p>
      
      <div className="h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.value.toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold capitalize">{result.sentiment}</p>
            <p className="text-sm text-muted-foreground">{Math.round(result.confidence * 100)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
        {data.map((item) => (
          <div key={item.name} className="text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
            <p className="font-semibold">{item.value.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
