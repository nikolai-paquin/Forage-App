import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, Project } from '../types';
import { itemInProject } from '../lib/util';
import { Trash2 } from './icons';

const thumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

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
  const thumbs = items
    .filter((i) => !i.deletedAt && itemInProject(i, project) && thumb(i))
    .slice(0, 3)
    .map(thumb) as string[];
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
          const src = thumbs[i];
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
              {src ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="block h-full w-full bg-surface-2" />
              )}
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
