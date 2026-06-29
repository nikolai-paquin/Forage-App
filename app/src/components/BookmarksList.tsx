import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../types';
import { useForage } from '../lib/store';
import { sourceLabel } from '../lib/util';
import { toast } from '../lib/toast';
import { openExternal } from '../lib/openExternal';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Folder,
  Link as LinkIcon,
  Maximize2,
  Plus,
  Share2,
  Trash2,
} from './icons';

const PER_PAGE = 20;
const PER_COL = 10;

function faviconOf(url?: string): string {
  if (!url) return '';
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch {
    return '';
  }
}

/** A dropdown to file a link into one or more groups (collections). */
function GroupMenu({ item, onClose }: { item: Item; onClose: () => void }) {
  const { projects, assignToProject, removeFromProject, createProject } = useForage();
  const ref = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  const create = () => {
    const n = name.trim();
    if (!n) return;
    const id = createProject(n, undefined, false);
    assignToProject(item.id, id);
    setName('');
    toast(`Added to ${n}`);
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
    >
      <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-faint">
        Add to group
      </p>
      <div className="max-h-52 overflow-y-auto">
        {projects.map((p) => {
          const inIt = item.projectIds.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => (inIt ? removeFromProject(item.id, p.id) : assignToProject(item.id, p.id))}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-ink transition hover:bg-surface-2"
            >
              <span
                className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border"
                style={{
                  borderColor: inIt ? p.color : 'var(--border-strong)',
                  background: inIt ? p.color : 'transparent',
                }}
              >
                {inIt && <Check size={11} className="text-white" />}
              </span>
              <span className="truncate">{p.name}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex items-center gap-1 border-t border-border px-1 pt-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="New group…"
          className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[13px] text-ink placeholder:text-faint focus:outline-none"
        />
        <button
          onClick={create}
          title="Create group"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

/** A browser-bookmarks-style list: preview · title + description · actions.
 *  Fills a left column to 10, overflows into a right column, paginates at 20. */
export function BookmarksList({ items, onOpen }: { items: Item[]; onOpen: (i: Item) => void }) {
  const { deleteForever, reinsertItem } = useForage();
  const [page, setPage] = useState(0);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1);
  }, [page, totalPages]);

  const share = async (item: Item) => {
    const url = item.url ?? '';
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      /* ignore */
    }
  };

  const pageItems = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const columns = [pageItems.slice(0, PER_COL), pageItems.slice(PER_COL)];

  const row = (item: Item) => {
    const desc = item.summary || item.note || item.url || '';
    const fav = faviconOf(item.url);
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative flex items-center gap-3.5 rounded-lg border border-border bg-surface px-3 py-2.5 transition hover:bg-surface-2"
      >
        <button
          onClick={() => (item.url ? openExternal(item.url) : onOpen(item))}
          className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
        >
          <div className="grid h-12 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-2 text-faint">
            {item.media ? (
              <img src={item.media} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : fav ? (
              <img src={fav} alt="" className="h-6 w-6" loading="lazy" />
            ) : (
              <LinkIcon size={16} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-ink">{item.title}</p>
            {desc && <p className="truncate text-[12px] text-muted">{desc}</p>}
            <p className="truncate text-[11px] text-faint">{sourceLabel(item.source)}</p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <div className="relative">
            <button
              onClick={() => setMenuFor((m) => (m === item.id ? null : item.id))}
              title="Add to group"
              className={`grid h-8 w-8 place-items-center rounded-full transition hover:bg-surface hover:text-ink ${
                item.projectIds.length ? 'text-ink' : 'text-muted'
              }`}
            >
              <Folder size={15} />
            </button>
            {menuFor === item.id && <GroupMenu item={item} onClose={() => setMenuFor(null)} />}
          </div>
          <button
            onClick={() => onOpen(item)}
            title="Details"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
          >
            <Maximize2 size={15} />
          </button>
          {item.url && (
            <button
              onClick={() => share(item)}
              title="Share / copy link"
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
            >
              <Share2 size={15} />
            </button>
          )}
          <button
            onClick={() => {
              deleteForever(item.id);
              toast('Deleted', { undo: () => reinsertItem(item), sound: 'trash' });
            }}
            title="Delete"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-red-500"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">{columns[0].map(row)}</div>
        {columns[1].length > 0 && <div className="flex flex-col gap-1.5">{columns[1].map(row)}</div>}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center gap-3 text-[13px] text-muted">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="grid h-8 w-8 place-items-center rounded-full border border-border transition hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="tnum">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="grid h-8 w-8 place-items-center rounded-full border border-border transition hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
