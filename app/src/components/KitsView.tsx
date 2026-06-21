import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Kit } from '../types';
import { fontStack } from '../lib/fonts';
import { Palette, Plus } from './icons';

function KitCard({ kit, onOpen }: { kit: Kit; onOpen: () => void }) {
  const { itemById } = useForage();
  const colors = kit.colors.length ? kit.colors : ['#e6e6e6', '#cfcfcf', '#b6b6b6'];
  const firstFont = kit.fontItemIds.map((id) => itemById(id)).find(Boolean);
  const fontCount = kit.fontItemIds.length;
  const imgCount = kit.imageItemIds.length;

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="group text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex h-2/3">
          {colors.slice(0, 6).map((c, i) => (
            <span key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="flex h-1/3 items-center px-3">
          <span
            className="truncate text-[26px] leading-none text-ink"
            style={{ fontFamily: fontStack(firstFont?.fontFamily) }}
          >
            {firstFont ? 'Ag' : 'Aa'}
          </span>
        </div>
      </div>
      <p className="mt-2.5 truncate text-[14px] font-medium text-ink">{kit.name}</p>
      <p className="tnum text-[12.5px] text-faint">
        {kit.colors.length} colors · {fontCount} {fontCount === 1 ? 'font' : 'fonts'} · {imgCount} ref
      </p>
    </motion.button>
  );
}

export function KitsView() {
  const { kits, createKit, setView } = useForage();
  const openNew = () => setView({ kind: 'kit', id: createKit() });

  if (kits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-40 text-center">
        <div className="mb-4 text-faint">
          <Palette size={36} strokeWidth={1.5} />
        </div>
        <p className="text-[17px] font-medium text-ink">No style kits yet</p>
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">
          A kit bundles a palette, fonts, and key reference images for a project — your
          brand or game's look in one place, ready to export.
        </p>
        <button
          onClick={openNew}
          className="mt-5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
          style={{ background: 'var(--ink)' }}
        >
          Create your first kit
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-32 pt-1">
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <button
          onClick={openNew}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
        >
          <Plus size={24} />
          <span className="text-[13px]">New kit</span>
        </button>
        {kits.map((k) => (
          <KitCard key={k.id} kit={k} onOpen={() => setView({ kind: 'kit', id: k.id })} />
        ))}
      </div>
    </div>
  );
}
