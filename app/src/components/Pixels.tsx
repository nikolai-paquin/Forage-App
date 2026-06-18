import type { Item } from '../types';

/** Dithered pixel bar chart — bars built from small squares. */
export function PixelBars({
  data,
  rows = 6,
  className = '',
}: {
  data: number[]; // values normalized 0..1
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-end gap-[3px] ${className}`}>
      {data.map((v, i) => (
        <div key={i} className="flex flex-col-reverse gap-[3px]">
          {Array.from({ length: rows }).map((_, r) => {
            const on = v >= (r + 0.5) / rows;
            return (
              <span
                key={r}
                className={`h-[5px] w-[5px] rounded-[1px] ${on ? 'bg-accent' : 'bg-surface-2'}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

const DAY = 86_400_000;

/** Count items per day for the last `days` days (index 0 = oldest). */
export function dailyCounts(items: Item[], days: number): number[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = start.getTime();
  const counts = new Array(days).fill(0);
  for (const it of items) {
    const d = new Date(it.createdAt);
    d.setHours(0, 0, 0, 0);
    const offset = Math.round((today - d.getTime()) / DAY); // 0 = today
    const idx = days - 1 - offset;
    if (idx >= 0 && idx < days) counts[idx] += 1;
  }
  return counts;
}

/** GitHub-style foraging-activity heatmap, rendered as dithered squares. */
export function ActivityGrid({
  items,
  weeks = 14,
  className = '',
}: {
  items: Item[];
  weeks?: number;
  className?: string;
}) {
  const days = weeks * 7;
  const counts = dailyCounts(items, days);
  const max = Math.max(1, ...counts);

  const level = (c: number) => {
    if (c <= 0) return 'bg-surface-2';
    const r = c / max;
    if (r > 0.75) return 'bg-accent';
    if (r > 0.5) return 'bg-accent/70';
    if (r > 0.25) return 'bg-accent/45';
    return 'bg-accent/25';
  };

  // columns = weeks, rows = 7 days
  return (
    <div className={`flex gap-[3px] ${className}`}>
      {Array.from({ length: weeks }).map((_, w) => (
        <div key={w} className="flex flex-col gap-[3px]">
          {Array.from({ length: 7 }).map((_, d) => {
            const idx = w * 7 + d;
            return (
              <span
                key={d}
                className={`h-[10px] w-[10px] rounded-[2px] ${level(counts[idx] ?? 0)}`}
                title={`${counts[idx] ?? 0} foraged`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
