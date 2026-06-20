import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, Storyboard } from '../types';
import { Film, Plus } from './icons';

const thumb = (i?: Item) => (i ? (i.type === 'video' ? i.poster : i.media) : undefined);

function BoardCard({ board, onOpen }: { board: Storyboard; onOpen: () => void }) {
  const { itemById } = useForage();
  const thumbs = board.frames
    .map((f) => thumb(itemById(f.itemId ?? '')))
    .filter(Boolean)
    .slice(0, 3) as string[];

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="group text-left"
    >
      <div className="relative flex aspect-[4/3] gap-[3px] overflow-hidden rounded-2xl border border-border bg-surface-2 p-2">
        {thumbs.length > 0 ? (
          thumbs.map((src, i) => (
            <div key={i} className="min-w-0 flex-1 overflow-hidden rounded-md bg-surface">
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))
        ) : (
          <div className="grid h-full w-full place-items-center text-faint">
            <Film size={28} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <p className="mt-2.5 truncate text-[14px] font-medium text-ink">{board.name}</p>
      <p className="tnum text-[12.5px] text-faint">
        {board.frames.length} {board.frames.length === 1 ? 'frame' : 'frames'}
      </p>
    </motion.button>
  );
}

export function StoryboardsView() {
  const { storyboards, createStoryboard, setView } = useForage();

  if (storyboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-40 text-center">
        <div className="mb-4 text-faint">
          <Film size={36} strokeWidth={1.5} />
        </div>
        <p className="text-[17px] font-medium text-ink">No storyboards yet</p>
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">
          Storyboards are ordered sequences of frames — sketch a flow, a scene, or a
          product narrative with a caption and notes on each beat.
        </p>
        <button
          onClick={createStoryboard}
          className="mt-5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
          style={{ background: 'var(--ink)' }}
        >
          Create your first storyboard
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-32 pt-1">
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <button
          onClick={createStoryboard}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
        >
          <Plus size={24} />
          <span className="text-[13px]">New storyboard</span>
        </button>
        {storyboards.map((b) => (
          <BoardCard key={b.id} board={b} onOpen={() => setView({ kind: 'storyboard', id: b.id })} />
        ))}
      </div>
    </div>
  );
}
