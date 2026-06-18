import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, TypeFilter } from '../types';
import { Clock, Layers } from './icons';
import { DitherGlow } from './DitherGlow';
import { timeAgo } from '../lib/util';

const FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'ai_asset', label: 'AI' },
  { id: 'link', label: 'Links' },
  { id: 'gif', label: 'GIFs' },
  { id: 'vector', label: 'Vectors' },
  { id: 'code', label: 'Code' },
];

function FilterChips() {
  const { typeFilter, setTypeFilter } = useForage();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FILTERS.map((f) => {
        const active = typeFilter === f.id;
        return (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className={`relative rounded-full px-3 py-1 text-[12.5px] transition-colors ${
              active ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId="filter-active"
                className="absolute inset-0 z-0 rounded-full border border-border bg-surface"
                style={{ boxShadow: 'var(--shadow-tile)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-[1]">{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ResurfacedStrip({
  items,
  onOpen,
}: {
  items: Item[];
  onOpen: (i: Item) => void;
}) {
  const picks = [...items].sort((a, b) => a.lastSeenAt - b.lastSeenAt).slice(0, 3);
  if (picks.length < 2) return null;
  return (
    <div className="glass mt-4 flex items-center gap-3 rounded-xl px-3.5 py-2.5">
      <Clock width={16} height={16} className="shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-ink">Resurfaced for you</p>
        <p className="truncate text-[11.5px] text-muted">
          {picks.length} things you saved here — last seen {timeAgo(picks[0].lastSeenAt)}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        {picks.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            title={p.title}
            className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border transition hover:-translate-y-0.5"
            style={{ background: p.palette[1] }}
          >
            {p.media && p.type !== 'video' ? (
              <img src={p.media} alt="" className="h-full w-full object-cover" />
            ) : p.poster ? (
              <img src={p.poster} alt="" className="h-full w-full object-cover" />
            ) : (
              <span
                className="block h-full w-full"
                style={{ background: `linear-gradient(140deg, ${p.palette[0]}, ${p.palette[1]})` }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ContextHeader({ onOpen }: { onOpen: (i: Item) => void }) {
  const { view, projectById, visibleItems, items, storyboards, setView } = useForage();
  const projectStoryboard =
    view.kind === 'project' ? storyboards.find((s) => s.projectId === view.projectId) : undefined;

  let title = 'Library';
  let subtitle = `${visibleItems.length} items — everything you've foraged`;
  let brief: string | null = null;
  let accent: string | undefined;

  if (view.kind === 'basket') {
    title = 'Basket';
    subtitle = 'Unsorted finds — capture now, organize later';
  } else if (view.kind === 'project') {
    const p = projectById(view.projectId);
    title = p?.name ?? 'Project';
    brief = p?.brief ?? null;
    accent = p?.color;
    subtitle = `${visibleItems.length} items`;
  }

  const projectItems =
    view.kind === 'project'
      ? items.filter((i) => i.projectIds.includes(view.projectId))
      : [];

  return (
    <div className="relative isolate px-5 pb-3 pt-5">
      <DitherGlow className="-left-10 -top-8 h-44 w-72 opacity-25" />
      <div className="flex items-center gap-2.5">
        {accent && (
          <span className="h-3 w-3 rounded-full" style={{ background: accent }} />
        )}
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        <span className="text-[13px] text-faint">· {subtitle}</span>
        {projectStoryboard && (
          <button
            onClick={() => setView({ kind: 'storyboard', storyboardId: projectStoryboard.id })}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-muted transition hover:text-ink"
          >
            <Layers width={15} height={15} />
            Storyboard
          </button>
        )}
      </div>

      {brief && (
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-muted">{brief}</p>
      )}

      {view.kind === 'project' && (
        <ResurfacedStrip items={projectItems} onOpen={onOpen} />
      )}

      <div className="mt-4">
        <FilterChips />
      </div>
    </div>
  );
}
