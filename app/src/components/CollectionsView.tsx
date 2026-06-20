import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, ItemType } from '../types';
import { CollectionCover } from './CollectionCover';
import { sourceLabel } from '../lib/util';
import { Plus } from './icons';

const thumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

const TYPE_LABEL: Record<string, string> = {
  image: 'Images',
  video: 'Video',
  link: 'Links',
  gif: 'GIFs',
  ai_asset: 'AI assets',
  vector: 'Vectors',
  code: 'Code',
};

function SmartCard({ label, items, onOpen }: { label: string; items: Item[]; onOpen: () => void }) {
  const thumbs = items.map(thumb).filter(Boolean).slice(0, 4) as string[];
  return (
    <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }} onClick={onOpen} className="group text-left">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-dashed border-border-strong bg-surface-2/40">
        {thumbs.length > 0 ? (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[2px] opacity-90">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden bg-surface-2">
                {thumbs[i % thumbs.length] && (
                  <img src={thumbs[i % thumbs.length]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="block h-full w-full" />
        )}
      </div>
      <p className="mt-2.5 truncate text-[14px] font-medium text-ink">{label}</p>
      <p className="tnum text-[12.5px] text-faint">{items.length} saves · smart</p>
    </motion.button>
  );
}

export function CollectionsView({ onCapture }: { onCapture: () => void }) {
  const { projects, items, setView, setTypeFilter, setSourceFilter, deleteProject } = useForage();
  const live = items.filter((i) => !i.deletedAt);

  const byType = Array.from(new Set(live.map((i) => i.type)))
    .map((t) => ({ type: t, items: live.filter((i) => i.type === t) }))
    .filter((g) => g.items.length >= 2)
    .sort((a, b) => b.items.length - a.items.length);

  const bySource = Array.from(new Set(live.map((i) => i.source).filter(Boolean) as string[]))
    .map((s) => ({ source: s, items: live.filter((i) => i.source === s) }))
    .filter((g) => g.items.length >= 2)
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 6);

  const openType = (t: ItemType) => {
    setSourceFilter('all');
    setTypeFilter(t);
    setView({ kind: 'library', tab: 'all' });
  };
  const openSource = (s: string) => {
    setTypeFilter('all');
    setSourceFilter(s);
    setView({ kind: 'library', tab: 'all' });
  };

  return (
    <div className="px-5 pb-32 pt-1">
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <button
          onClick={onCapture}
          className="flex h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
        >
          <Plus size={24} />
          <span className="text-[13px]">New collection</span>
        </button>
        {projects.map((p) => (
          <CollectionCover
            key={p.id}
            project={p}
            size="lg"
            onOpen={() => setView({ kind: 'collection', id: p.id })}
            onDelete={() => {
              if (confirm(`Delete “${p.name}”? Saves inside it are kept.`)) deleteProject(p.id);
            }}
          />
        ))}
      </div>

      {(byType.length > 0 || bySource.length > 0) && (
        <>
          <h3 className="mb-4 mt-12 text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
            Smart collections
          </h3>
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {byType.map((g) => (
              <SmartCard
                key={`t-${g.type}`}
                label={TYPE_LABEL[g.type] ?? g.type}
                items={g.items}
                onOpen={() => openType(g.type)}
              />
            ))}
            {bySource.map((g) => (
              <SmartCard
                key={`s-${g.source}`}
                label={sourceLabel(g.source)}
                items={g.items}
                onOpen={() => openSource(g.source)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
