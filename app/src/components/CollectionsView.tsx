import { useForage } from '../lib/store';
import { CollectionCover } from './CollectionCover';
import { Plus } from './icons';

export function CollectionsView({ onCapture }: { onCapture: () => void }) {
  const { projects, setView } = useForage();
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
          />
        ))}
      </div>
    </div>
  );
}
