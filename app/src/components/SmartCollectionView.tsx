import { useForage } from '../lib/store';
import type { Item } from '../types';
import { MasonryGrid } from './MasonryGrid';
import { ArrowLeft, Sparkle } from './icons';
import { sourceLabel } from '../lib/util';
import { COLOR_SWATCHES } from '../lib/color';

const TYPE_LABEL: Record<string, string> = {
  image: 'Images',
  video: 'Video',
  link: 'Links',
  gif: 'GIFs',
  ai_asset: 'AI assets',
  vector: 'Vectors',
  code: 'Code',
  audio: 'Audio',
  palette: 'Palettes',
  font: 'Fonts',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A read-only, auto-gathered collection (by type, source, or color) — opened
 *  from the "Smart collections" cards or a color search. */
export function SmartCollectionView({ onOpen }: { onOpen: (i: Item) => void }) {
  const { view, visibleItems, setView } = useForage();
  if (view.kind !== 'smart') return null;
  const swatch = view.field === 'color' ? COLOR_SWATCHES.find((c) => c.word === view.value) : null;
  const label =
    view.field === 'type'
      ? (TYPE_LABEL[view.value] ?? view.value)
      : view.field === 'color'
        ? `${cap(view.value)} saves`
        : sourceLabel(view.value);

  return (
    <div className="px-5 pb-32">
      <button
        onClick={() => setView({ kind: 'collections' })}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
      >
        <ArrowLeft size={15} /> Collections
      </button>
      <div className="mb-7 flex items-center gap-2.5">
        {swatch && (
          <span
            className="h-4 w-4 rounded-full ring-1 ring-border"
            style={{ background: swatch.hex }}
          />
        )}
        <h1 className="text-[26px] font-semibold tracking-tight">{label}</h1>
        <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
          <Sparkle size={11} /> smart
        </span>
        <span className="text-[14px] text-faint">· {visibleItems.length} saves</span>
      </div>
      <p className="-mt-4 mb-7 max-w-2xl text-[13.5px] text-muted">
        Everything in your library that matches automatically — this collection updates itself.
      </p>
      <MasonryGrid items={visibleItems} onOpen={onOpen} />
    </div>
  );
}
