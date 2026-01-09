import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SentimentResult } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface ComparisonPieChartProps {
  results: SentimentResult[];
  className?: string;
}

const COLORS = ['#22c55e', '#ef4444', '#8b5cf6'];

export function ComparisonPieChart({ results, className }: ComparisonPieChartProps) {
  if (results.length === 0) return null;

  const data = [
    { name: 'Positive', value: results.filter(r => r.sentiment === 'positive').length },
    { name: 'Negative', value: results.filter(r => r.sentiment === 'negative').length },
    { name: 'Neutral', value: results.filter(r => r.sentiment === 'neutral').length },
  ].filter(d => d.value > 0);

  const total = results.length;

  return (
    <div className={cn('sentiment-card h-full', className)}>
      <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percentage = ((data.value / total) * 100).toFixed(1);
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.value} texts ({percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
