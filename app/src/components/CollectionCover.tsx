import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, Project } from '../types';
import { itemInProject } from '../lib/util';
import { ensureFont, fontStack } from '../lib/fonts';
import { Trash2 } from './icons';

const imageThumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

/** A single fanned card — renders whatever preview suits the item's type. */
function CoverCard({ item }: { item: Item | undefined }) {
  useEffect(() => {
    if (item?.type === 'font') ensureFont(item);
  }, [item]);

  if (!item) return <span className="block h-full w-full bg-surface-2" />;

  const img = imageThumb(item);
  if (img) return <img src={img} alt="" className="h-full w-full object-cover" />;

  if (item.type === 'font') {
    return (
      <span
        className="grid h-full w-full place-items-center bg-surface text-[26px] leading-none text-ink"
        style={{ fontFamily: fontStack(item.fontFamily) }}
      >
        Ag
      </span>
    );
  }

  if (item.type === 'palette' && item.palette?.length) {
    return (
      <span className="flex h-full w-full flex-col">
        {item.palette.slice(0, 4).map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </span>
    );
  }

  // Links, code, notes, audio — no image. Show the title as a quiet placeholder.
  return (
    <span className="grid h-full w-full place-items-center bg-surface-2 px-1.5 text-center text-[9px] leading-tight text-faint">
      {item.title}
    </span>
  );
}

/** Stacked-card cover — GatherOS's signature collection thumbnail. */
export function CollectionCover({
  project,
  onOpen,
  onDelete,
  size = 'md',
}: {
  project: Project;
  onOpen: () => void;
  onDelete?: () => void;
  size?: 'md' | 'lg';
}) {
  const { items, projectItemCount } = useForage();
  const previews = items
    .filter((i) => !i.deletedAt && itemInProject(i, project))
    .slice(0, 3);
  const count = projectItemCount(project.id);

  const dims = size === 'lg' ? 'h-44' : 'h-36';
  // back-to-front offsets for the fanned pile
  const layout = [
    { r: -8, x: -14, y: 6, s: 0.9, z: 1 },
    { r: 5, x: 10, y: 3, s: 0.95, z: 2 },
    { r: 0, x: 0, y: 0, s: 1, z: 3 },
  ];

  return (
    <motion.button
      whileHover="hover"
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="group w-full text-left"
    >
      <div
        className={`relative ${dims} grid place-items-center rounded-2xl border border-border bg-surface-2/40`}
      >
        {onDelete && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete collection"
            className="absolute right-2 top-2 z-[5] grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition hover:bg-red-500 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </span>
        )}
        {[0, 1, 2].map((i) => {
          const l = layout[i];
          return (
            <motion.div
              key={i}
              variants={{
                hover: { rotate: l.r * 1.5, x: l.x * 1.35, y: l.y - 3 },
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="absolute h-[68%] w-[52%] overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]"
              style={{
                transform: `rotate(${l.r}deg) translate(${l.x}px, ${l.y}px) scale(${l.s})`,
                zIndex: l.z,
              }}
            >
              <CoverCard item={previews[i]} />
            </motion.div>
          );
        })}
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="truncate text-[14px] font-medium text-ink">{project.name}</p>
        <p className="tnum text-[12.5px] text-faint">{count} saves</p>
      </div>
    </motion.button>
  );
}
