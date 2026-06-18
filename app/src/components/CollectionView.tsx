import { useForage } from '../lib/store';
import type { Item } from '../types';
import { MasonryGrid } from './MasonryGrid';
import { ArrowLeft } from './icons';

export function CollectionView({ onOpen }: { onOpen: (i: Item) => void }) {
  const { view, projectById, visibleItems, setView } = useForage();
  if (view.kind !== 'collection') return null;
  const p = projectById(view.id);

  return (
    <div className="px-5 pb-32">
      <button
        onClick={() => setView({ kind: 'collections' })}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
      >
        <ArrowLeft size={15} /> Collections
      </button>
      <div className="mb-7 flex items-center gap-2.5">
        <span className="h-3 w-3 rounded-full" style={{ background: p?.color }} />
        <h1 className="text-[26px] font-semibold tracking-tight">{p?.name}</h1>
        <span className="text-[14px] text-faint">· {visibleItems.length} saves</span>
      </div>
      {p?.brief && <p className="-mt-4 mb-7 max-w-2xl text-[14px] text-muted">{p.brief}</p>}
      <MasonryGrid items={visibleItems} onOpen={onOpen} />
    </div>
  );
}
