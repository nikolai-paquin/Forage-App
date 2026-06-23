import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, LibraryTab } from '../types';
import { MasonryGrid } from './MasonryGrid';
import { BookmarksList } from './BookmarksList';
import { CollectionCover } from './CollectionCover';
import { FilterMenu, type Option } from './FilterMenu';
import type { ItemType, SortBy } from '../types';
import {
  Bookmark,
  Clock,
  Code,
  Compass,
  Grid,
  Hash,
  Image as ImageIcon,
  Layers,
  Link,
  Music,
  Play,
  Plus,
  Sparkle,
} from './icons';

const SORT_OPTIONS: Option[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'type', label: 'Type' },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  image: <ImageIcon size={14} />,
  video: <Play size={14} />,
  link: <Link size={14} />,
  gif: <ImageIcon size={14} />,
  ai_asset: <Sparkle size={14} />,
  vector: <Layers size={14} />,
  code: <Code size={14} />,
  audio: <Music size={14} />,
};

const TABS: { id: LibraryTab; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <ImageIcon size={15} /> },
  { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={15} /> },
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

export function LibraryView({
  onOpen,
  onCapture,
  onAddLink,
  onNewCollection,
}: {
  onOpen: (i: Item) => void;
  onCapture: () => void;
  onAddLink: () => void;
  onNewCollection: () => void;
}) {
  const {
    view,
    setView,
    visibleItems,
    projects,
    items,
    fileTypes,
    sources,
    typeFilter,
    setTypeFilter,
    sourceFilter,
    setSourceFilter,
    tagFilter,
    setTagFilter,
    sortBy,
    setSortBy,
  } = useForage();
  const [density, setDensity] = useState(235);
  if (view.kind !== 'library') return null;
  const tab = view.tab;

  const tagOptions: Option[] = [
    { value: 'all', label: 'All tags', icon: <Hash size={14} /> },
    ...Array.from(new Set(items.filter((i) => !i.deletedAt).flatMap((i) => i.tags)))
      .sort()
      .map((t) => ({ value: t, label: `#${t}` })),
  ];

  const typeOptions: Option[] = [
    { value: 'all', label: 'All types', icon: <ImageIcon size={14} /> },
    ...fileTypes
      .filter((t) => t.enabled)
      .map((t) => ({ value: t.value, label: t.label, icon: TYPE_ICON[t.value] ?? <Layers size={14} /> })),
  ];
  const sourceOptions: Option[] = [
    { value: 'all', label: 'All sources', icon: <Compass size={14} /> },
    ...sources.filter((s) => s.enabled).map((s) => ({ value: s.value, label: s.label })),
  ];

  return (
    <div className="px-5 pb-32">
      {/* sub-tabs + controls */}
      <div className="mb-6 flex flex-col gap-2 border-b border-border md:flex-row md:items-center md:justify-between">
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

        <div className="-mx-5 flex items-center gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0 md:pb-0 [&>*]:shrink-0">
          <div className="mr-1 hidden items-center gap-2 text-faint sm:flex">
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
          <FilterMenu
            icon={<ImageIcon size={14} className="text-faint" />}
            options={typeOptions}
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as ItemType | 'all')}
          />
          <FilterMenu
            icon={<Compass size={14} className="text-faint" />}
            options={sourceOptions}
            value={sourceFilter}
            onChange={setSourceFilter}
          />
          {tagOptions.length > 1 && (
            <FilterMenu
              icon={<Hash size={14} className="text-faint" />}
              options={tagOptions}
              value={tagFilter}
              onChange={setTagFilter}
            />
          )}
          <FilterMenu
            neutral
            icon={<Clock size={14} className="text-faint" />}
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(v) => setSortBy(v as SortBy)}
          />
        </div>
      </div>

      {/* body */}
      {tab === 'bookmarks' ? (
        visibleItems.length === 0 ? (
          <Empty
            icon={<Bookmark size={34} strokeWidth={1.5} />}
            title="No bookmarks yet"
            sub="Every web page or link you save lands here — like browser bookmarks, but better. Paste a URL or use the extension to add one."
          >
            <button
              onClick={onAddLink}
              className="mt-5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
              style={{ background: 'var(--ink)' }}
            >
              Add a link
            </button>
          </Empty>
        ) : (
          <div>
            <div className="mb-3 flex justify-start">
              <button
                onClick={onAddLink}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink transition hover:bg-surface-2"
              >
                <Plus size={15} /> Add a link
              </button>
            </div>
            <BookmarksList items={visibleItems} onOpen={onOpen} />
          </div>
        )
      ) : (
        <>
          {tab === 'all' && (
            <div className="mb-8 flex gap-4 overflow-x-auto pb-1">
              <button
                onClick={onNewCollection}
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
            >
              <button
                onClick={onCapture}
                className="mt-5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
                style={{ background: 'var(--ink)' }}
              >
                Add to library
              </button>
            </Empty>
          ) : (
            <MasonryGrid items={visibleItems} onOpen={onOpen} targetWidth={density} />
          )}
        </>
      )}
    </div>
  );
}
