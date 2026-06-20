import { useForage } from '../lib/store';
import type { Item } from '../types';
import { MasonryGrid } from './MasonryGrid';
import { ArrowLeft, Sparkle } from './icons';
import { sourceLabel } from '../lib/util';

const TYPE_LABEL: Record<string, string> = {
  image: 'Images',
  video: 'Video',
  link: 'Links',
  gif: 'GIFs',
  ai_asset: 'AI assets',
  vector: 'Vectors',
  code: 'Code',
  audio: 'Audio',
};

/** A read-only, auto-gathered collection (by type or source) — opened from the
 *  "Smart collections" cards so they land on a collection page, not the library. */
export function SmartCollectionView({ onOpen }: { onOpen: (i: Item) => void }) {
  const { view, visibleItems, setView } = useForage();
  if (view.kind !== 'smart') return null;
  const label =
    view.field === 'type' ? (TYPE_LABEL[view.value] ?? view.value) : sourceLabel(view.value);

  return (
    <div className="px-5 pb-32">
      <button
        onClick={() => setView({ kind: 'collections' })}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
      >
        <ArrowLeft size={15} /> Collections
      </button>
      <div className="mb-7 flex items-center gap-2.5">
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
