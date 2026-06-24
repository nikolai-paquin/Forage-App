import { useForage } from '../lib/store';
import type { Item } from '../types';
import { CollectionCover } from './CollectionCover';
import { COLOR_SWATCHES, matchColor } from '../lib/color';
import { Plus } from './icons';

export function CollectionsView({ onNewCollection }: { onNewCollection: () => void }) {
  const { projects, items, setView, deleteProject } = useForage();
  const live = items.filter((i: Item) => !i.deletedAt);

  // Colors that actually appear in the library, with a count, for the color row.
  const colorRow = COLOR_SWATCHES.map((c) => ({
    ...c,
    count: live.filter((i) => matchColor(i.palette, c.word)).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="px-5 pb-32 pt-1">
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <button
          onClick={onNewCollection}
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

      {colorRow.length > 0 && (
        <>
          <h3 className="mb-4 mt-12 text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
            Browse by color
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {colorRow.map((c) => (
              <button
                key={c.word}
                onClick={() => setView({ kind: 'smart', field: 'color', value: c.word })}
                className="flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3 text-[12.5px] text-ink transition hover:bg-surface-2"
              >
                <span
                  className="h-5 w-5 rounded-full ring-1 ring-border"
                  style={{ background: c.hex }}
                />
                <span className="capitalize">{c.word}</span>
                <span className="tnum text-faint">{c.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
