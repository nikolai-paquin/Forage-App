import { useState } from 'react';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { MasonryGrid } from './MasonryGrid';
import { ArrowLeft, Frame, ImageDown, Plus, Share2, Trash2 } from './icons';
import { toast } from '../lib/toast';
import { exportCollectionImage } from '../lib/snapshot';
import { ShareDialog } from './ShareDialog';
import { AddToCollectionDialog } from './AddToCollectionDialog';

export function CollectionView({
  onOpen,
  onAdd,
}: {
  onOpen: (i: Item) => void;
  onAdd: () => void;
}) {
  const { view, projectById, visibleItems, setView, deleteProject, createSpaceFromItems } =
    useForage();
  const [confirm, setConfirm] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [picking, setPicking] = useState(false);
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
      <div className="mb-7 flex flex-wrap items-center gap-2.5">
        <span className="h-3 w-3 rounded-full" style={{ background: p?.color }} />
        <h1 className="text-[26px] font-semibold tracking-tight">{p?.name}</h1>
        <span className="text-[14px] text-faint">· {visibleItems.length} saves</span>

        <button
          onClick={() => setPicking(true)}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
        >
          <Plus size={14} /> Add
        </button>
        <button
          onClick={() => {
            if (!visibleItems.length) return toast('Add some saves first.');
            createSpaceFromItems(`${p?.name ?? 'Collection'} moodboard`, visibleItems.map((i) => i.id));
            toast('Moodboard created');
          }}
          title="Lay every save out on a new moodboard"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
        >
          <Frame size={14} /> Moodboard
        </button>
        <button
          onClick={() =>
            exportCollectionImage({
              title: p?.name ?? 'Collection',
              subtitle: `${visibleItems.length} saves`,
              items: visibleItems,
            })
          }
          title="Export as image"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
        >
          <ImageDown size={14} /> Image
        </button>
        <button
          onClick={() => setSharing(true)}
          title="Share a read-only link"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
        >
          <Share2 size={14} /> Share
        </button>
        <div>
          {confirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-muted">Delete collection?</span>
              <button
                onClick={() => {
                  deleteProject(view.id);
                  toast('Collection deleted', { sound: 'trash' });
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
      {visibleItems.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-border text-faint">
            <Plus size={22} />
          </div>
          <p className="mt-4 text-[15px] font-medium text-ink">This collection is empty</p>
          <p className="mt-1 max-w-xs text-[13px] text-muted">
            Add images, links, audio, or notes — everything you save here is tagged to this
            collection.
          </p>
          <button
            onClick={() => setPicking(true)}
            className="mt-5 flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-accent-ink transition hover:opacity-90"
          >
            <Plus size={15} /> Add to this collection
          </button>
        </div>
      ) : (
        <MasonryGrid items={visibleItems} onOpen={onOpen} />
      )}

      {sharing && p && (
        <ShareDialog
          title={p.name}
          brief={p.brief}
          items={visibleItems}
          onClose={() => setSharing(false)}
        />
      )}

      {picking && (
        <AddToCollectionDialog
          projectId={view.id}
          onClose={() => setPicking(false)}
          onCapture={() => {
            setPicking(false);
            onAdd();
          }}
        />
      )}
    </div>
  );
}
