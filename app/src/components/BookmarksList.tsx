import { motion } from 'framer-motion';
import type { Item } from '../types';
import { useForage } from '../lib/store';
import { sourceLabel } from '../lib/util';
import { toast } from '../lib/toast';
import { ExternalLink, Link as LinkIcon, Share2, Trash2 } from './icons';

/** A browser-bookmarks-style list: preview · title + description · actions. */
export function BookmarksList({ items, onOpen }: { items: Item[]; onOpen: (i: Item) => void }) {
  const { trashItem } = useForage();

  const share = async (item: Item) => {
    const url = item.url ?? '';
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
      {items.map((item) => {
        const desc = item.summary || item.note || item.url || '';
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center gap-4 rounded-xl border border-border bg-surface px-3 py-2.5 transition hover:bg-surface-2"
          >
            <button
              onClick={() => onOpen(item)}
              className="flex min-w-0 flex-1 items-center gap-4 text-left"
            >
              <div className="grid h-14 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-faint">
                {item.media ? (
                  <img src={item.media} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <LinkIcon size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">{item.title}</p>
                {desc && <p className="truncate text-[12.5px] text-muted">{desc}</p>}
                <p className="truncate text-[11.5px] text-faint">{sourceLabel(item.source)}</p>
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in browser"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
                >
                  <ExternalLink size={16} />
                </a>
              )}
              {item.url && (
                <button
                  onClick={() => share(item)}
                  title="Share / copy link"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
                >
                  <Share2 size={16} />
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
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
