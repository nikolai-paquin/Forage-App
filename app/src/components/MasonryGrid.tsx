import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item } from '../types';
import { ItemTile } from './ItemTile';

/** Greedy shortest-column packing — keeps columns balanced regardless of tile heights. */
function packColumns(items: Item[], cols: number): Item[][] {
  const buckets: Item[][] = Array.from({ length: cols }, () => []);
  const heights = new Array(cols).fill(0);
  for (const it of items) {
    let c = 0;
    for (let i = 1; i < cols; i++) if (heights[i] < heights[c]) c = i;
    buckets[c].push(it);
    heights[c] += 1 / it.ratio; // relative height for a fixed column width
  }
  return buckets;
}

export function MasonryGrid({
  items,
  onOpen,
  targetWidth = 235,
}: {
  items: Item[];
  onOpen: (item: Item) => void;
  targetWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setCols(Math.max(2, Math.min(8, Math.round(w / targetWidth))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [targetWidth]);

  const columns = useMemo(() => packColumns(items, cols), [items, cols]);

  return (
    <div ref={ref} className="flex gap-2.5">
      {columns.map((col, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col">
          {col.map((item) => (
            <ItemTile key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      ))}
    </div>
  );
}
