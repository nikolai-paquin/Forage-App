import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../types';
import { useForage } from '../lib/store';
import { toast } from '../lib/toast';
import { ensureFont, fontStack } from '../lib/fonts';
import { copyHex, itemInProject } from '../lib/util';
import {
  CheckCircle2,
  Circle,
  Code as CodeIcon,
  FontIcon,
  Inbox,
  Link as LinkIcon,
  Maximize2,
  Music,
  Palette,
  Pause,
  Play,
  Trash2,
} from './icons';

/** Deterministic equalizer bar heights so a tile looks stable across renders. */
const BARS = [0.4, 0.7, 0.55, 0.9, 0.65, 0.35, 0.8, 0.5, 0.7, 0.45, 0.85, 0.6, 0.3, 0.75, 0.5];

function AudioArt({ item }: { item: Item }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      a.pause();
      setPlaying(false);
    }
  };
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-[#26262f] to-[#383844]">
      <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden">
        <div className="flex h-9 items-end gap-[3px]">
          {BARS.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full bg-white/35 ${playing ? 'animate-pulse' : ''}`}
              style={{ height: `${h * 100}%`, animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        <span
          onClick={toggle}
          className="absolute grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
        >
          {playing ? <Pause size={17} fill="currentColor" stroke="none" /> : <Play size={17} fill="currentColor" stroke="none" className="ml-0.5" />}
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Music size={15} className="shrink-0 text-muted" />
        <span className="truncate text-[12.5px] font-medium text-ink">{item.title}</span>
      </div>
      <audio ref={ref} src={item.media} preload="none" onEnded={() => setPlaying(false)} />
    </div>
  );
}

const isYouTube = (item: Item) =>
  item.type === 'video' && (item.source === 'youtube.com' || /youtu\.?be/.test(item.url ?? ''));

/** The YouTube glyph — a red rounded rectangle with a white play triangle. */
function YouTubeLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden>
      <path
        fill="#FF0000"
        d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5C.1 8.4.1 12 .1 12s0 3.6.4 5.5a3 3 0 0 0 2.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1c.4-1.9.4-5.5.4-5.5s0-3.6-.4-5.5Z"
      />
      <path fill="#fff" d="M9.6 15.6 15.8 12 9.6 8.4v7.2Z" />
    </svg>
  );
}

function PaletteArt({ item }: { item: Item }) {
  const colors = item.palette.length ? item.palette : ['#e6e6e6'];
  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div className="flex min-h-0 flex-1">
        {colors.map((c, i) => (
          <span
            key={`${c}-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              copyHex(c);
            }}
            title={`${c.toUpperCase()} — click to copy`}
            className="group/sw relative flex-1 cursor-pointer transition-[flex] duration-200 hover:flex-[1.6]"
            style={{ background: c }}
          >
            <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[9.5px] font-medium uppercase tracking-wide text-white opacity-0 transition group-hover/sw:opacity-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
              {c.replace('#', '')}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Palette size={13} className="shrink-0 text-faint" />
        <span className="truncate text-[12.5px] font-medium text-ink">{item.title}</span>
      </div>
    </div>
  );
}

function FontArt({ item }: { item: Item }) {
  useEffect(() => {
    ensureFont(item);
  }, [item.fontFamily, item.fontData, item.fontUrl]);
  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div className="grid min-h-0 flex-1 place-items-center overflow-hidden px-3 py-4">
        <span
          className="text-[clamp(34px,9vw,64px)] leading-none text-ink"
          style={{ fontFamily: fontStack(item.fontFamily) }}
        >
          Ag
        </span>
      </div>
      <div className="border-t border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <FontIcon size={13} className="shrink-0 text-faint" />
          <span className="truncate text-[12.5px] font-medium text-ink">{item.title}</span>
        </div>
        <p
          className="mt-1 truncate text-[13px] text-muted"
          style={{ fontFamily: fontStack(item.fontFamily) }}
        >
          {item.sample || 'The quick brown fox'}
        </p>
      </div>
    </div>
  );
}

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

function YouTubeArt({ item }: { item: Item }) {
  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        {item.poster && (
          <img src={item.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition group-hover:bg-[#FF0000]">
            <Play size={17} fill="currentColor" stroke="none" className="ml-0.5" />
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
        <YouTubeLogo size={16} />
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium leading-tight text-ink">{item.title}</p>
          {item.author && (
            <p className="truncate text-[11px] leading-tight text-muted">{item.author}</p>
          )}
        </div>
      </div>
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
  const { selectedIds, focusedId, projects, toggleSelect, deleteForever, reinsertItem } = useForage();
  const [hover, setHover] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Not yet filed into any collection — surfaced with a small corner badge.
  const unfiled = !projects.some((p) => itemInProject(item, p));
  const selected = selectedIds.includes(item.id);
  const focused = focusedId === item.id;
  const anySelected = selectedIds.length > 0;
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

  const youtube = isYouTube(item);
  const isCard =
    item.type === 'link' ||
    item.type === 'code' ||
    item.type === 'audio' ||
    item.type === 'palette' ||
    item.type === 'font' ||
    youtube;

  return (
    <motion.button
      layout
      onClick={() => onOpen(item)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34, mass: 0.6 }}
      className={`group relative mb-2.5 block w-full overflow-hidden rounded-lg bg-surface-2 text-left outline-none transition-shadow duration-300 hover:shadow-[var(--shadow-tile)] ${
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
        ) : item.type === 'audio' ? (
          <AudioArt item={item} />
        ) : item.type === 'palette' ? (
          <PaletteArt item={item} />
        ) : item.type === 'font' ? (
          <FontArt item={item} />
        ) : youtube ? (
          <YouTubeArt item={item} />
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
      <span
        onClick={(e) => {
          stop(e);
          toggleSelect(item.id);
        }}
        className={`absolute left-2.5 top-2.5 z-[3] grid h-6 w-6 cursor-pointer place-items-center rounded-full backdrop-blur-md transition ${
          selected
            ? 'bg-white text-[#16171b] opacity-100'
            : `bg-black/35 text-white ${anySelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100'}`
        }`}
      >
        {selected ? <CheckCircle2 size={15} /> : <Circle size={14} />}
      </span>

      {/* "not in a collection yet" badge */}
      {unfiled && (
        <span
          title="Not in a collection yet"
          className="absolute right-2.5 top-2.5 z-[3] grid h-6 w-6 place-items-center rounded-full bg-black/40 text-white/90 backdrop-blur-md"
        >
          <Inbox size={13} />
        </span>
      )}

      {/* bottom-right controls */}
      {
        <div className="absolute bottom-2.5 right-2.5 z-[3] flex gap-1.5 opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <span
            onClick={(e) => {
              stop(e);
              deleteForever(item.id);
              toast('Deleted', { undo: () => reinsertItem(item), sound: 'trash' });
            }}
            title="Delete"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-red-500"
          >
            <Trash2 size={13} />
          </span>
          {!isCard && (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md">
              <Maximize2 size={13} />
            </span>
          )}
        </div>
      }

      {item.type === 'code' && (
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white/80 opacity-0 transition group-hover:opacity-100">
          <CodeIcon size={11} /> {item.language}
        </span>
      )}
    </motion.button>
  );
}
