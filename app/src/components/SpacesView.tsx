import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, Space } from '../types';
import { Frame, Plus } from './icons';

const thumb = (i?: Item) => (i ? (i.type === 'video' ? i.poster : i.media) : undefined);

function SpaceCard({ space, onOpen }: { space: Space; onOpen: () => void }) {
  const { itemById } = useForage();
  const thumbs = space.elements
    .filter((e) => e.kind === 'item')
    .map((e) => thumb(itemById(e.itemId!)))
    .filter(Boolean)
    .slice(0, 4) as string[];

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="group text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-2">
        {thumbs.length > 0 ? (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[2px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden bg-surface-2">
                {thumbs[i % thumbs.length] && (
                  <img src={thumbs[i % thumbs.length]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid h-full place-items-center text-faint">
            <Frame size={28} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <p className="mt-2.5 truncate text-[14px] font-medium text-ink">{space.name}</p>
      <p className="tnum text-[12.5px] text-faint">{space.elements.length} items</p>
    </motion.button>
  );
}

export function SpacesView() {
  const { spaces, createSpace, setView } = useForage();

  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-40 text-center">
        <div className="mb-4 text-faint">
          <Frame size={36} strokeWidth={1.5} />
        </div>
        <p className="text-[17px] font-medium text-ink">No spaces yet</p>
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">
          Spaces are infinite canvases — drop saves in, arrange them freely, and add notes.
        </p>
        <button
          onClick={createSpace}
          className="mt-5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
          style={{ background: 'var(--ink)' }}
        >
          Create your first space
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-32 pt-1">
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <button
          onClick={createSpace}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
        >
          <Plus size={24} />
          <span className="text-[13px]">New space</span>
        </button>
        {spaces.map((s) => (
          <SpaceCard key={s.id} space={s} onOpen={() => setView({ kind: 'space', id: s.id })} />
        ))}
      </div>
    </div>
  );
}
