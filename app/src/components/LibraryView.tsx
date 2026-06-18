import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, LibraryTab } from '../types';
import { MasonryGrid } from './MasonryGrid';
import { CollectionCover } from './CollectionCover';
import {
  Bookmark,
  Clock,
  Grid,
  Image as ImageIcon,
  Inbox,
  Plus,
  Trash2,
} from './icons';

const TABS: { id: LibraryTab; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <ImageIcon size={15} /> },
  { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={15} /> },
  { id: 'unsorted', label: 'Unsorted', icon: <Inbox size={15} /> },
  { id: 'trash', label: 'Trash', icon: <Trash2 size={15} /> },
];

function Empty({
  icon,
  title,
  sub,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
      <div className="mb-4 text-faint">{icon}</div>
      <p className="text-[17px] font-medium text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">{sub}</p>
      {children}
    </div>
  );
}

export function LibraryView({ onOpen, onCapture }: { onOpen: (i: Item) => void; onCapture: () => void }) {
  const { view, setView, visibleItems, projects } = useForage();
  const [density, setDensity] = useState(235);
  if (view.kind !== 'library') return null;
  const tab = view.tab;

  return (
    <div className="px-5 pb-32">
      {/* sub-tabs + controls */}
      <div className="mb-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView({ kind: 'library', tab: t.id })}
                className={`relative flex items-center gap-1.5 px-3 py-3 text-[14px] transition-colors ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {t.id !== 'all' && t.icon}
                {t.id === 'all' && isActive && t.icon}
                {t.label}
                {isActive && (
                  <motion.span
                    layoutId="lib-tab"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                    style={{ background: 'var(--ink)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-faint">
            <Grid size={15} />
            <input
              type="range"
              min={170}
              max={340}
              step={5}
              value={510 - density}
              onChange={(e) => setDensity(510 - Number(e.target.value))}
              className="h-1 w-20 cursor-pointer accent-[var(--ink)]"
            />
            <span className="h-3.5 w-3.5 rounded-[3px] border border-border-strong" />
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-muted transition hover:text-ink">
            <Clock size={14} />
            Most recent
          </button>
        </div>
      </div>

      {/* body */}
      {tab === 'trash' ? (
        <Empty
          icon={<Trash2 size={34} strokeWidth={1.5} />}
          title="Trash is empty"
          sub="Deleted saves land here. Empty Trash to remove for good."
        />
      ) : tab === 'bookmarks' && visibleItems.length === 0 ? (
        <Empty
          icon={<Bookmark size={34} strokeWidth={1.5} />}
          title="No bookmarks yet"
          sub="Sync your X bookmarks once the Forage extension is installed."
        >
          <button
            onClick={onCapture}
            className="mt-5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
            style={{ background: 'var(--ink)' }}
          >
            Get the extension
          </button>
        </Empty>
      ) : tab === 'unsorted' && visibleItems.length === 0 ? (
        <Empty
          icon={<Inbox size={34} strokeWidth={1.5} />}
          title="Nothing unsorted"
          sub="Every save belongs to at least one collection."
        />
      ) : (
        <>
          {tab === 'all' && (
            <div className="mb-8 flex gap-4 overflow-x-auto pb-1">
              <button
                onClick={onCapture}
                className="flex h-36 w-[200px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
              >
                <Plus size={22} />
                <span className="text-[13px]">New collection</span>
              </button>
              {projects.map((p) => (
                <div key={p.id} className="w-[200px] shrink-0">
                  <CollectionCover
                    project={p}
                    onOpen={() => setView({ kind: 'collection', id: p.id })}
                  />
                </div>
              ))}
            </div>
          )}
          {visibleItems.length === 0 ? (
            <Empty
              icon={<ImageIcon size={34} strokeWidth={1.5} />}
              title="Nothing here yet"
              sub="Drag images in or save URLs to start your library."
            />
          ) : (
            <MasonryGrid items={visibleItems} onOpen={onOpen} targetWidth={density} />
          )}
        </>
      )}
    </div>
  );
}
