import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../types';
import { useForage } from '../lib/store';
import {
  CheckCircle2,
  Circle,
  Code as CodeIcon,
  Link as LinkIcon,
  Maximize2,
  Play,
  RotateCcw,
  Trash2,
} from './icons';

function VectorArt({ palette }: { palette: string[] }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: palette[2] ?? '#eee' }}
    >
      <svg viewBox="0 0 100 100" className="h-2/5 w-2/5" style={{ color: palette[0] }}>
        <path
          d="M50 8C50 32 38 44 20 50c18 6 30 18 30 42 0-24 12-36 30-42-18-6-30-18-30-42Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function CodeArt({ item }: { item: Item }) {
  return (
    <div className="h-full w-full overflow-hidden bg-[#0e0f12] p-3.5">
      <pre className="font-mono text-[10.5px] leading-[1.5] text-[#c9cdd6]">
        <code>{item.code?.split('\n').slice(0, 9).join('\n')}</code>
      </pre>
    </div>
  );
}

function LinkArt({ item }: { item: Item }) {
  return (
    <div className="flex h-full w-full flex-col bg-surface">
      {item.media ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <img src={item.media} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 place-items-center bg-surface-2 text-faint">
          <LinkIcon size={22} />
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <LinkIcon size={13} className="shrink-0 text-faint" />
        <span className="truncate text-[12px] text-muted">{item.source}</span>
      </div>
    </div>
  );
}

export function ItemTile({ item, onOpen }: { item: Item; onOpen: (item: Item) => void }) {
  const { selectedIds, focusedId, toggleSelect, view, restoreItem, deleteForever } = useForage();
  const [hover, setHover] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selected = selectedIds.includes(item.id);
  const focused = focusedId === item.id;
  const anySelected = selectedIds.length > 0;
  const isTrash = view.kind === 'library' && view.tab === 'trash';
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const onEnter = () => {
    setHover(true);
    if (item.type === 'video') videoRef.current?.play().catch(() => {});
  };
  const onLeave = () => {
    setHover(false);
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const isCard = item.type === 'link' || item.type === 'code';

  return (
    <motion.button
      layout
      onClick={() => onOpen(item)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34, mass: 0.6 }}
      className={`group relative mb-2.5 block w-full overflow-hidden rounded-xl bg-surface-2 text-left outline-none transition-shadow duration-300 hover:shadow-[var(--shadow-tile)] ${
        selected
          ? 'ring-2 ring-offset-2 ring-offset-canvas ring-[var(--ink)]'
          : focused
            ? 'ring-2 ring-offset-2 ring-offset-canvas ring-[var(--accent)]'
            : ''
      }`}
    >
      <div className="w-full overflow-hidden" style={{ aspectRatio: String(item.ratio) }}>
        {item.type === 'vector' ? (
          <VectorArt palette={item.palette} />
        ) : item.type === 'code' ? (
          <CodeArt item={item} />
        ) : item.type === 'link' ? (
          <LinkArt item={item} />
        ) : item.type === 'video' ? (
          <>
            <img
              src={item.poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <video
              ref={videoRef}
              src={item.media}
              poster={item.poster}
              muted
              loop
              playsInline
              preload="none"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                hover ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {!hover && (
              <span className="absolute bottom-2.5 left-2.5 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md">
                <Play size={13} fill="currentColor" stroke="none" />
              </span>
            )}
          </>
        ) : (
          <img
            src={item.media}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}
      </div>

      {/* select toggle */}
      {!isTrash && (
        <span
          onClick={(e) => {
            stop(e);
            toggleSelect(item.id);
          }}
          className={`absolute left-2.5 top-2.5 z-[3] grid h-6 w-6 cursor-pointer place-items-center rounded-full backdrop-blur-md transition ${
            selected
              ? 'bg-white text-[#16171b] opacity-100'
              : `bg-black/35 text-white ${anySelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`
          }`}
        >
          {selected ? <CheckCircle2 size={15} /> : <Circle size={14} />}
        </span>
      )}

      {/* bottom-right controls */}
      {isTrash ? (
        <div className="absolute bottom-2.5 right-2.5 z-[3] flex gap-1.5 opacity-0 transition group-hover:opacity-100">
          <span
            onClick={(e) => {
              stop(e);
              restoreItem(item.id);
            }}
            title="Restore"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75"
          >
            <RotateCcw size={13} />
          </span>
          <span
            onClick={(e) => {
              stop(e);
              deleteForever(item.id);
            }}
            title="Delete forever"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-red-500"
          >
            <Trash2 size={13} />
          </span>
        </div>
      ) : !isCard ? (
        <span className="absolute bottom-2.5 right-2.5 z-[2] grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
          <Maximize2 size={13} />
        </span>
      ) : null}

      {item.type === 'code' && (
        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white/80 opacity-0 transition group-hover:opacity-100">
          <CodeIcon size={11} /> {item.language}
        </span>
      )}
    </motion.button>
  );
}
