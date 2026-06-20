import { useState } from 'react';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { MasonryGrid } from './MasonryGrid';
import { ArrowLeft, Trash2 } from './icons';
import { toast } from '../lib/toast';

export function CollectionView({ onOpen }: { onOpen: (i: Item) => void }) {
  const { view, projectById, visibleItems, setView, deleteProject } = useForage();
  const [confirm, setConfirm] = useState(false);
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

        <div className="ml-auto">
          {confirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-muted">Delete collection?</span>
              <button
                onClick={() => {
                  deleteProject(view.id);
                  toast('Collection deleted');
                }}
                className="rounded-full bg-red-500 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="rounded-full border border-border px-3 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] text-muted transition hover:border-red-300 hover:text-red-500"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>
      {p?.brief && <p className="-mt-4 mb-7 max-w-2xl text-[14px] text-muted">{p.brief}</p>}
      {confirm && (
        <p className="-mt-3 mb-6 text-[12.5px] text-faint">
          The collection is removed; the saves inside it stay in your library.
        </p>
      )}
      <MasonryGrid items={visibleItems} onOpen={onOpen} />
    </div>
  );
}
