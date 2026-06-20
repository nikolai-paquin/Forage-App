import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { detectFromInput } from '../lib/util';
import { toast } from '../lib/toast';
import { Code, Image, Link, Music, Play, Sparkle, Upload } from './icons';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  link: { label: 'Link', icon: <Link width={13} height={13} /> },
  image: { label: 'Image', icon: <Image width={13} height={13} /> },
  gif: { label: 'GIF', icon: <Image width={13} height={13} /> },
  video: { label: 'Video', icon: <Play width={13} height={13} /> },
  code: { label: 'Code', icon: <Code width={13} height={13} /> },
  audio: { label: 'Audio', icon: <Music width={13} height={13} /> },
  ai_asset: { label: 'AI asset', icon: <Sparkle width={13} height={13} /> },
};

export function CaptureDialog({
  open,
  onClose,
  onFiles,
  linksOnly = false,
}: {
  open: boolean;
  onClose: () => void;
  onFiles?: (files: FileList | File[]) => void;
  /** Bookmarks "Add a link": paste links only, no image/audio upload zone. */
  linksOnly?: boolean;
}) {
  const { addItem, projects, findDuplicate } = useForage();
  const [text, setText] = useState('');
  const [projectId, setProjectId] = useState('');
  const [tags, setTags] = useState('');
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFiles = (files: FileList | File[] | null) => {
    if (files && files.length && onFiles) {
      onFiles(files);
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      setText('');
      setTags('');
      setProjectId('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // Multiple links pasted at once (newline/space separated) → save them all.
  const urls = useMemo(() => text.trim().match(/https?:\/\/\S+/g) ?? [], [text]);
  const multi = urls.length > 1;
  const detected = useMemo(
    () => (text.trim() && !multi ? detectFromInput(text) : null),
    [text, multi],
  );
  const previewSrc = detected?.media ?? detected?.poster;

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const projectIds = projectId ? [projectId] : [];
    // Bookmarks mode: everything becomes a plain link (even image URLs).
    const linkify = (d: ReturnType<typeof detectFromInput>) =>
      linksOnly ? { ...d, type: 'link' as const } : d;

    // Multiple links → one save each.
    if (multi) {
      let n = 0;
      for (const u of urls) {
        const d = linkify(detectFromInput(u));
        if (findDuplicate({ url: d.url, media: d.media })) continue;
        addItem({
          type: d.type,
          title: d.title,
          source: d.source,
          url: d.url,
          media: d.media,
          poster: d.poster,
          ratio: d.ratio,
          tags: tagList,
          projectIds,
        });
        n++;
      }
      toast(n ? `Saved ${n} item${n === 1 ? '' : 's'}` : 'All already in your library');
      onClose();
      return;
    }

    const d = linkify(detected!);
    const code = d.type === 'code' ? trimmed : undefined;
    if (findDuplicate({ url: d.url, media: d.media, code })) {
      toast('Already in your library');
      onClose();
      return;
    }
    addItem({
      type: d.type,
      title: d.title,
      source: d.source,
      url: d.url,
      media: d.media,
      poster: d.poster,
      ratio: d.ratio,
      code,
      tags: tagList,
      projectIds,
    });
    toast('Saved to Forage');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border-strong bg-elevated"
            style={{ boxShadow: 'var(--shadow-pop)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
              if (e.key === 'Escape') onClose();
            }}
          >
            <div className="p-4">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  linksOnly ? 'Paste a link — or several…' : 'Paste a link, image URL, or a snippet…'
                }
                className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              />
            </div>

            {onFiles && !linksOnly && !text.trim() && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(false);
                  pickFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
                className={`mx-4 mb-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-7 text-center transition ${
                  over ? 'border-ink bg-surface-2' : 'border-border-strong hover:bg-surface-2/50'
                }`}
              >
                <Upload size={18} className="text-faint" />
                <p className="text-[12.5px] text-muted">
                  Drag &amp; drop images or audio here, or click to browse
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,audio/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    pickFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>
            )}

            <AnimatePresence>
              {(detected || multi) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-muted">
                      {multi ? (
                        <Link width={18} height={18} />
                      ) : previewSrc ? (
                        <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                      ) : (
                        TYPE_META[detected!.type]?.icon
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-accent">
                        {multi ? <Link width={13} height={13} /> : TYPE_META[detected!.type]?.icon}
                        {multi
                          ? `${urls.length} links detected`
                          : `detected: ${TYPE_META[detected!.type]?.label ?? detected!.type}`}
                      </p>
                      <p className="truncate text-[13px] text-ink">
                        {multi ? 'They’ll be saved together' : detected!.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 pb-2">
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none"
                    >
                      <option value="">No collection</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="# tags…"
                      className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-faint"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-end border-t border-border px-4 py-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={submit}
                disabled={!text.trim()}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-accent-ink disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                Add
                <span className="rounded bg-black/15 px-1 text-[10px] opacity-80">⌘↵</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
