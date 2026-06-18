import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Item } from '../types';
import { ItemTile } from './ItemTile';

const GAP = 10; // matches gap-2.5 / mb-2.5
const VIRTUALIZE_OVER = 80; // small libraries render whole — keeps the demo identical

interface Placed {
  item: Item;
  top: number;
  h: number;
}

/** Greedy shortest-column packing with exact per-tile offsets (tile height = colWidth/ratio). */
function layout(items: Item[], cols: number, colWidth: number) {
  const buckets: Placed[][] = Array.from({ length: cols }, () => []);
  const heights = new Array(cols).fill(0);
  for (const it of items) {
    let c = 0;
    for (let i = 1; i < cols; i++) if (heights[i] < heights[c]) c = i;
    const h = colWidth / it.ratio + GAP;
    buckets[c].push({ item: it, top: heights[c], h });
    heights[c] += h;
  }
  return { buckets, heights };
}

function nearestScrollParent(el: HTMLElement): HTMLElement | null {
  let n = el.parentElement;
  while (n) {
    const oy = getComputedStyle(n).overflowY;
    if (oy === 'auto' || oy === 'scroll') return n;
    n = n.parentElement;
  }
  return null;
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
  const scrollParent = useRef<HTMLElement | null>(null);
  const [cols, setCols] = useState(4);
  const [width, setWidth] = useState(0);
  const [scroll, setScroll] = useState({ top: 0, viewH: 0, gridTop: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setWidth(w);
      setCols(Math.max(2, Math.min(8, Math.round(w / targetWidth))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [targetWidth]);

  const virtualize = items.length > VIRTUALIZE_OVER;

  // Track the scroll position of the nearest scrollable ancestor (the main pane).
  useLayoutEffect(() => {
    if (!virtualize) return;
    const grid = ref.current;
    if (!grid) return;
    const sp = nearestScrollParent(grid);
    scrollParent.current = sp;
    const measure = () => {
      const top = sp ? sp.scrollTop : window.scrollY;
      const viewH = sp ? sp.clientHeight : window.innerHeight;
      const gridTop = sp
        ? grid.getBoundingClientRect().top - sp.getBoundingClientRect().top + sp.scrollTop
        : grid.getBoundingClientRect().top + window.scrollY;
      setScroll({ top, viewH, gridTop });
    };
    measure();
    const target: HTMLElement | Window = sp ?? window;
    target.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      target.removeEventListener('scroll', measure as EventListener);
      window.removeEventListener('resize', measure);
    };
  }, [virtualize, cols, width, items.length]);

  const colWidth = cols > 0 ? (width - GAP * (cols - 1)) / cols : 0;
  const { buckets, heights } = useMemo(
    () => layout(items, cols, colWidth || 1),
    [items, cols, colWidth],
  );

  // Visible band within the grid's own coordinate space, padded a screen each way.
  const start = scroll.top - scroll.gridTop - scroll.viewH;
  const end = scroll.top - scroll.gridTop + scroll.viewH * 2;

  return (
    <div ref={ref} className="flex gap-2.5">
      {buckets.map((bucket, i) => {
        if (!virtualize || width === 0) {
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col">
              {bucket.map((p) => (
                <ItemTile key={p.item.id} item={p.item} onOpen={onOpen} />
              ))}
            </div>
          );
        }
        const total = heights[i];
        const vis = bucket.filter((p) => p.top < end && p.top + p.h > start);
        const padTop = vis.length ? vis[0].top : total;
        const padBottom = vis.length ? total - (vis[vis.length - 1].top + vis[vis.length - 1].h) : 0;
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col">
            {padTop > 0 && <div style={{ height: padTop }} />}
            {vis.map((p) => (
              <ItemTile key={p.item.id} item={p.item} onOpen={onOpen} />
            ))}
            {padBottom > 0 && <div style={{ height: padBottom }} />}
          </div>
        );
      })}
    </div>
  );
}
