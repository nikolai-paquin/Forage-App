import { useState } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Frame, Item, Storyboard } from '../types';
import { Close, Layers, Play, Plus, Sparkle } from './icons';

function Thumb({ item }: { item: Item | undefined }) {
  if (!item)
    return <div className="h-full w-full bg-surface-2" />;
  const src = item.type === 'video' ? item.poster : item.media;
  if (src) return <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />;
  return (
    <span
      className="block h-full w-full"
      style={{ background: `linear-gradient(140deg, ${item.palette[0]}, ${item.palette[1]})` }}
    />
  );
}

function FrameCard({
  frame,
  index,
  storyboardId,
}: {
  frame: Frame;
  index: number;
  storyboardId: string;
}) {
  const { itemById, updateFrameBeat, removeFrame } = useForage();
  const item = itemById(frame.itemId);

  return (
    <Reorder.Item
      value={frame}
      whileDrag={{ scale: 1.04, boxShadow: 'var(--shadow-pop)', cursor: 'grabbing' }}
      className="group relative flex w-[200px] shrink-0 cursor-grab flex-col"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-surface" style={{ boxShadow: 'var(--shadow-tile)' }}>
        <div className="relative aspect-video w-full overflow-hidden">
          <Thumb item={item} />
          <span className="absolute left-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-black/55 px-1.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-md">
            {String(index + 1).padStart(2, '0')}
          </span>
          {item?.type === 'video' && (
            <span className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md">
              <Play width={11} height={11} />
            </span>
          )}
          {item?.type === 'ai_asset' && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white backdrop-blur-md">
              <Sparkle width={10} height={10} /> AI
            </span>
          )}
          <button
            onClick={() => removeFrame(storyboardId, frame.id)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100"
          >
            <Close width={12} height={12} />
          </button>
        </div>
        <div className="p-2.5">
          <input
            value={frame.beat}
            onChange={(e) => updateFrameBeat(storyboardId, frame.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Describe the shot…"
            className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
          />
          {item?.ai && (
            <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-faint" title={item.ai.prompt}>
              prompt: {item.ai.prompt}
            </p>
          )}
        </div>
      </div>
      {frame.transition && (
        <p className="mt-1.5 px-1 text-center text-[10.5px] uppercase tracking-wide text-faint">
          {frame.transition} ↓
        </p>
      )}
    </Reorder.Item>
  );
}

function FramePicker({
  storyboard,
  onClose,
}: {
  storyboard: Storyboard;
  onClose: () => void;
}) {
  const { items, addFrame } = useForage();
  const used = new Set(storyboard.frames.map((f) => f.itemId));
  const candidates = items.filter(
    (i) =>
      i.projectIds.includes(storyboard.projectId) &&
      ['image', 'video', 'ai_asset', 'gif'].includes(i.type),
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="relative max-h-[70vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border-strong bg-elevated"
        style={{ boxShadow: 'var(--shadow-pop)' }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-[14px] font-semibold">Add a frame</p>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <Close width={16} height={16} />
          </button>
        </div>
        <div className="grid max-h-[56vh] grid-cols-3 gap-2.5 overflow-auto p-4 sm:grid-cols-4">
          {candidates.map((i) => (
            <button
              key={i.id}
              onClick={() => {
                addFrame(storyboard.id, i.id);
                onClose();
              }}
              title={i.title}
              className={`relative aspect-video overflow-hidden rounded-lg border border-border transition hover:-translate-y-0.5 ${
                used.has(i.id) ? 'opacity-40' : ''
              }`}
            >
              <Thumb item={i} />
              {used.has(i.id) && (
                <span className="absolute inset-0 grid place-items-center bg-black/40 text-[10px] font-medium uppercase text-white">
                  in use
                </span>
              )}
            </button>
          ))}
          {candidates.length === 0 && (
            <p className="col-span-full py-8 text-center text-[13px] text-muted">
              No visual items in this project yet.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StoryboardView({ storyboard }: { storyboard: Storyboard }) {
  const { reorderFrames, projectById, itemById } = useForage();
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const project = projectById(storyboard.projectId);

  const exportShotList = () => {
    const lines = storyboard.frames.map((f, idx) => {
      const it = itemById(f.itemId);
      return `${String(idx + 1).padStart(2, '0')}. ${f.beat || it?.title || 'Untitled'}${
        f.transition ? `  ·  ${f.transition}` : ''
      }`;
    });
    const text = `${storyboard.title}\n\n${lines.join('\n')}`;
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  };

  return (
    <div className="relative isolate px-5 pb-24 pt-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Layers width={20} height={20} className="text-accent" />
        <h1 className="text-[22px] font-semibold tracking-tight">{storyboard.title}</h1>
        {project && (
          <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[12px]">
            <span className="h-2 w-2 rounded-full" style={{ background: project.color }} />
            {project.name}
          </span>
        )}
        <span className="text-[13px] text-faint">· {storyboard.frames.length} frames</span>

        <button
          onClick={exportShotList}
          className="ml-auto rounded-lg border border-border bg-surface px-3 py-1.5 text-[12.5px] text-muted transition hover:text-ink"
        >
          {copied ? 'Copied ✓' : 'Export shot list'}
        </button>
      </div>

      <p className="mt-1.5 text-[13px] text-muted">
        Drag frames to re-sequence. Click a shot description to edit it.
      </p>

      <Reorder.Group
        axis="x"
        values={storyboard.frames}
        onReorder={(f) => reorderFrames(storyboard.id, f)}
        className="mt-6 flex items-start gap-4 overflow-x-auto pb-6"
      >
        {storyboard.frames.map((frame, i) => (
          <FrameCard key={frame.id} frame={frame} index={i} storyboardId={storyboard.id} />
        ))}

        <button
          onClick={() => setPicking(true)}
          className="flex aspect-video w-[200px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong text-muted transition hover:border-accent hover:text-accent"
        >
          <Plus width={20} height={20} />
          <span className="text-[12.5px]">Add frame</span>
        </button>
      </Reorder.Group>

      <AnimatePresence>
        {picking && <FramePicker storyboard={storyboard} onClose={() => setPicking(false)} />}
      </AnimatePresence>
    </div>
  );
}
