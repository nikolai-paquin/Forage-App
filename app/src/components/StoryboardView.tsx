import { useEffect, useState } from 'react';
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
  Pencil,
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
  const [enlarged, setEnlarged] = useState<string | null>(null); // image src shown in the lightbox

  useEffect(() => {
    if (!enlarged) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setEnlarged(null);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [enlarged]);

  const boardId = view.kind === 'storyboard' ? view.id : '';
  const board = storyboardById(boardId);
  if (!board) return null;

  const addEmpty = () => addFrame(board.id, { id: uid(), caption: '' });

  return (
    <div className="flex h-[calc(100dvh-64px-56px)] flex-col md:h-[calc(100vh-64px)]">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3">
        <button
          onClick={() => setView({ kind: 'storyboards' })}
          className="flex shrink-0 items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
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
                toast('Storyboard deleted', { sound: 'trash' });
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
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-border bg-surface-2/40 px-5 py-6">
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
          <div className="flex flex-wrap content-start gap-4">
            {board.frames.map((f, i) => {
              const src = thumb(itemById(f.itemId ?? ''));
              return (
                <div
                  key={f.id}
                  className="group flex w-64 flex-col self-start overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                    {src ? (
                      <button
                        onClick={() => setEnlarged(src)}
                        className="block h-full w-full cursor-zoom-in"
                        title="Click to enlarge"
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setPicker(f.id)}
                        className="grid h-full w-full place-items-center text-faint transition hover:text-ink"
                        title="Add image"
                      >
                        <ImageIcon size={20} />
                      </button>
                    )}
                    <span className="pointer-events-none absolute left-2 top-2 grid h-6 min-w-[24px] place-items-center rounded-full bg-black/55 px-1.5 text-[11px] font-medium tabular-nums text-white">
                      {i + 1}
                    </span>
                    {src && (
                      <button
                        onClick={() => setPicker(f.id)}
                        title="Change image"
                        className="absolute right-2 top-2 hidden h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75 group-hover:grid [@media(hover:none)]:grid"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
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
              className="grid h-44 w-40 place-items-center self-start rounded-xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
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

      {/* enlarged image lightbox */}
      <AnimatePresence>
        {enlarged && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnlarged(null)}
          >
            <motion.img
              src={enlarged}
              alt=""
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.97 }}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setEnlarged(null)}
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              title="Close (Esc)"
            >
              <Close size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
