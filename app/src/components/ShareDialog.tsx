import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Item } from '../types';
import {
  getShareEndpoint,
  setShareEndpoint,
  shareConfigured,
  publishShare,
  shareUrl,
  toSharedItem,
  type SharePayload,
} from '../lib/share';
import { copyText } from '../lib/util';
import { toast } from '../lib/toast';
import { Check, Close, Copy, Loader2, Share2 } from './icons';

const MAX_BYTES = 8 * 1024 * 1024;

export function ShareDialog({
  title,
  brief,
  items,
  onClose,
}: {
  title: string;
  brief?: string;
  items: Item[];
  onClose: () => void;
}) {
  const [endpoint, setEndpoint] = useState(getShareEndpoint());
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const payload: SharePayload = {
    v: 1,
    kind: 'collection',
    title,
    brief,
    exportedAt: Date.now(),
    items: items.map(toSharedItem),
  };
  const bytes = JSON.stringify(payload).length;
  const tooBig = bytes > MAX_BYTES;

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 1800);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const publish = async () => {
    setShareEndpoint(endpoint);
    if (!shareConfigured()) {
      toast('Add a share endpoint first.');
      return;
    }
    setBusy(true);
    try {
      const id = await publishShare(payload);
      const link = shareUrl(id);
      setUrl(link);
      await copyText(link);
      setCopied(true);
      toast('Link copied — anyone with it can view');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border-strong bg-elevated"
          style={{ boxShadow: 'var(--shadow-pop)' }}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
              <Share2 size={15} /> Share “{title}”
            </p>
            <button onClick={onClose} className="text-muted hover:text-ink">
              <Close size={16} />
            </button>
          </div>

          <div className="p-4">
            <p className="mb-4 text-[13px] leading-relaxed text-muted">
              Publish a read-only snapshot of this collection ({items.length} saves). Anyone with
              the link can view it — no account needed. It’s a copy: later changes won’t sync.
            </p>

            <label className="mb-1.5 block text-[12px] font-medium text-ink">Share endpoint</label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://your-share-worker.workers.dev"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
            />
            <p className="mt-1.5 text-[11.5px] text-faint">
              One-time setup — deploy <code>server/share-worker.js</code> (see its header) and paste
              the URL. Stored on this device.
            </p>

            {tooBig && (
              <p className="mt-3 rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-500">
                This collection is {(bytes / 1024 / 1024).toFixed(1)} MB — over the 8 MB limit.
                Uploaded images are heavy; share a smaller selection.
              </p>
            )}

            {url && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none"
                />
                <button
                  onClick={() => {
                    copyText(url);
                    setCopied(true);
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[12px] text-ink transition hover:bg-border"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-[13px] text-muted transition hover:text-ink"
            >
              Done
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={publish}
              disabled={busy || tooBig || !endpoint.trim()}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-accent-ink disabled:opacity-40"
              style={{ background: 'var(--ink)' }}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              {busy ? 'Publishing…' : url ? 'Re-publish' : 'Publish & copy link'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
