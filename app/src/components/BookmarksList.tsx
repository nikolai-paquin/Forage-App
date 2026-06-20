import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../types';
import { useForage } from '../lib/store';
import { sourceLabel } from '../lib/util';
import { toast } from '../lib/toast';
import { ChevronLeft, ChevronRight, Link as LinkIcon, Maximize2, Share2, Trash2 } from './icons';

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

/** A browser-bookmarks-style list: preview · title + description · actions.
 *  Fills a left column to 10, overflows into a right column, paginates at 20. */
export function BookmarksList({ items, onOpen }: { items: Item[]; onOpen: (i: Item) => void }) {
  const { trashItem } = useForage();
  const [page, setPage] = useState(0);

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
        className="group flex items-center gap-3.5 rounded-lg border border-border bg-surface px-3 py-2.5 transition hover:bg-surface-2"
      >
        <a
          href={item.url || '#'}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            if (!item.url) {
              e.preventDefault();
              onOpen(item);
            }
          }}
          className="flex min-w-0 flex-1 items-center gap-3.5"
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
        </a>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
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
              trashItem(item.id);
              toast('Moved to Trash');
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
