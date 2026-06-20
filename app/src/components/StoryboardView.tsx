import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { uid } from '../lib/util';
import { toast } from '../lib/toast';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Close,
  Image as ImageIcon,
  Plus,
  Trash2,
} from './icons';

const thumb = (i?: Item) => (i ? (i.type === 'video' ? i.poster : i.media) : undefined);

export function StoryboardView() {
  const {
    view,
    storyboardById,
    itemById,
    items,
    renameStoryboard,
    deleteStoryboard,
    addFrame,
    updateFrame,
    removeFrame,
    moveFrame,
    setView,
  } = useForage();

  const [picker, setPicker] = useState<string | null>(null); // frameId we're choosing an image for
  const [confirm, setConfirm] = useState(false);

  const boardId = view.kind === 'storyboard' ? view.id : '';
  const board = storyboardById(boardId);
  if (!board) return null;

  const addEmpty = () => addFrame(board.id, { id: uid(), caption: '' });

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* header */}
      <div className="flex items-center gap-3 px-5 pb-3">
        <button
          onClick={() => setView({ kind: 'storyboards' })}
          className="flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
        >
          <ArrowLeft size={15} /> Storyboards
        </button>
        <input
          value={board.name}
          onChange={(e) => renameStoryboard(board.id, e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[17px] font-semibold tracking-tight text-ink outline-none"
        />
        <button
          onClick={addEmpty}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-muted transition hover:text-ink"
        >
          <Plus size={14} /> Add frame
        </button>
        {confirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                deleteStoryboard(board.id);
                toast('Storyboard deleted');
              }}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-red-500"
            title="Delete storyboard"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* frames */}
      <div className="min-h-0 flex-1 overflow-x-auto border-t border-border bg-surface-2/40 px-5 py-6">
        {board.frames.length === 0 ? (
          <div className="grid h-full place-items-center">
            <button
              onClick={addEmpty}
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong px-12 py-9 text-muted transition hover:border-ink hover:text-ink"
            >
              <Plus size={22} />
              <span className="text-[13px]">Add your first frame</span>
            </button>
          </div>
        ) : (
          <div className="flex h-full items-stretch gap-4">
            {board.frames.map((f, i) => {
              const src = thumb(itemById(f.itemId ?? ''));
              return (
                <div
                  key={f.id}
                  className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <button
                    onClick={() => setPicker(f.id)}
                    className="relative aspect-video w-full overflow-hidden bg-surface-2"
                    title={src ? 'Change image' : 'Add image'}
                  >
                    {src ? (
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-faint">
                        <ImageIcon size={20} />
                      </span>
                    )}
                    <span className="absolute left-2 top-2 grid h-6 min-w-[24px] place-items-center rounded-full bg-black/55 px-1.5 text-[11px] font-medium tabular-nums text-white">
                      {i + 1}
                    </span>
                  </button>
                  <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
                    <input
                      value={f.caption}
                      onChange={(e) => updateFrame(board.id, f.id, { caption: e.target.value })}
                      placeholder="Caption"
                      className="bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-faint"
                    />
                    <textarea
                      value={f.notes ?? ''}
                      onChange={(e) => updateFrame(board.id, f.id, { notes: e.target.value })}
                      placeholder="Notes…"
                      className="min-h-[60px] flex-1 resize-none bg-transparent text-[12.5px] leading-relaxed text-muted outline-none placeholder:text-faint"
                    />
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => moveFrame(board.id, f.id, -1)}
                          disabled={i === 0}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                          title="Move left"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => moveFrame(board.id, f.id, 1)}
                          disabled={i === board.frames.length - 1}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                          title="Move right"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFrame(board.id, f.id)}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-red-500"
                        title="Remove frame"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={addEmpty}
              className="grid w-40 shrink-0 place-items-center rounded-xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
            >
              <span className="flex flex-col items-center gap-1.5">
                <Plus size={20} />
                <span className="text-[12px]">Add frame</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {/* image picker */}
      <AnimatePresence>
        {picker && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setPicker(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative max-h-[72vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-elevated"
              style={{ boxShadow: 'var(--shadow-pop)' }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-[14px] font-semibold">Choose a frame image</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      updateFrame(board.id, picker, { itemId: undefined });
                      setPicker(null);
                    }}
                    className="text-[12.5px] text-muted transition hover:text-ink"
                  >
                    Clear image
                  </button>
                  <button onClick={() => setPicker(null)} className="text-muted hover:text-ink">
                    <Close size={16} />
                  </button>
                </div>
              </div>
              <div className="grid max-h-[60vh] grid-cols-3 gap-2.5 overflow-auto p-4 sm:grid-cols-4">
                {items
                  .filter((i) => !i.deletedAt && (i.media || i.poster))
                  .map((i) => (
                    <button
                      key={i.id}
                      onClick={() => {
                        updateFrame(board.id, picker, { itemId: i.id });
                        setPicker(null);
                      }}
                      title={i.title}
                      className="aspect-square overflow-hidden rounded-lg border border-border bg-surface-2 transition hover:-translate-y-0.5"
                    >
                      {thumb(i) ? (
                        <img src={thumb(i)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full place-items-center text-[10px] text-faint">
                          {i.title}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
