import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../types';
import { Code, Heart, Link, Play, Sparkle } from './icons';
import { useForage } from '../lib/store';

function TypeBadge({ item }: { item: Item }) {
  const map: Partial<Record<Item['type'], { label: string; icon?: React.ReactNode }>> = {
    video: { label: 'Video', icon: <Play width={11} height={11} /> },
    gif: { label: 'GIF' },
    ai_asset: { label: 'AI', icon: <Sparkle width={11} height={11} /> },
    vector: { label: 'SVG' },
    code: { label: 'Code', icon: <Code width={11} height={11} /> },
  };
  const b = map[item.type];
  if (!b) return null;
  return (
    <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/95 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
      {b.icon}
      {b.label}
    </span>
  );
}

function VectorArt({ palette }: { palette: string[] }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: `linear-gradient(145deg, ${palette[1]}, ${palette[0]}22)` }}
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
    <div className="h-full w-full overflow-hidden bg-[#14150f] p-3.5">
      <pre className="font-mono text-[10.5px] leading-[1.5] text-[#cdd4b8]">
        <code>{item.code?.split('\n').slice(0, 9).join('\n')}</code>
      </pre>
    </div>
  );
}

function LinkArt({ item }: { item: Item }) {
  return (
    <div className="flex h-full w-full flex-col">
      {item.media ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <img src={item.media} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div
          className="min-h-0 flex-1"
          style={{ background: `linear-gradient(150deg, ${item.palette[1]}, ${item.palette[0]})` }}
        />
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Link width={13} height={13} className="shrink-0 text-muted" />
        <span className="truncate text-[12px] text-muted">{item.source}</span>
      </div>
    </div>
  );
}

export function ItemTile({ item, onOpen }: { item: Item; onOpen: (item: Item) => void }) {
  const { toggleFavorite } = useForage();
  const [hover, setHover] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onEnter = () => {
    setHover(true);
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };
  const onLeave = () => {
    setHover(false);
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.button
      layout
      onClick={() => onOpen(item)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.7 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className="group relative mb-3 block w-full overflow-hidden rounded-xl bg-surface-2 text-left outline-none transition-shadow duration-300 hover:shadow-[var(--shadow-tile)]"
    >
      {/* subtle neutral ring on hover (Cosmos-clean, no colour glow) */}
      <span className="pointer-events-none absolute inset-0 z-[2] rounded-xl opacity-0 ring-1 ring-inset ring-white/15 transition-opacity duration-300 group-hover:opacity-100" />
      <TypeBadge item={item} />

      <div
        className="relative z-[1] w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: String(item.ratio) }}
      >
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
              <span className="absolute bottom-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md">
                <Play width={14} height={14} />
              </span>
            )}
          </>
        ) : (
          <img
            src={item.media}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        )}
        {/* filmic grain over the media */}
        <div className="noise pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-soft-light" />
      </div>

      {/* caption: title slides up on hover for image-like tiles */}
      {item.type !== 'link' && item.type !== 'code' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/70 via-black/10 to-transparent px-3 pb-2.5 pt-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="truncate text-[12.5px] font-medium text-white">{item.title}</p>
        </div>
      )}

      <span
        role="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(item.id);
        }}
        className={`absolute right-2.5 top-2.5 z-[3] grid h-7 w-7 place-items-center rounded-full backdrop-blur-md transition ${
          item.favorite
            ? 'bg-white/90 text-accent'
            : 'bg-black/35 text-white opacity-0 group-hover:opacity-100'
        }`}
      >
        <Heart
          width={14}
          height={14}
          fill={item.favorite ? 'currentColor' : 'none'}
        />
      </span>
    </motion.button>
  );
}
