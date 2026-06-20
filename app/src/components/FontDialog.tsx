import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { ensureFont, fontStack } from '../lib/fonts';
import { toast } from '../lib/toast';
import { Close, FontIcon, Upload } from './icons';

const DEFAULT_SAMPLE = 'The quick brown fox jumps over the lazy dog';

export function FontDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addItem, view } = useForage();
  const [mode, setMode] = useState<'google' | 'upload'>('google');
  const [name, setName] = useState('');
  const [sample, setSample] = useState(DEFAULT_SAMPLE);
  const [fontData, setFontData] = useState<string | undefined>();
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode('google');
      setName('');
      setSample(DEFAULT_SAMPLE);
      setFontData(undefined);
      setFileName('');
    }
  }, [open]);

  const family = name.trim();

  // Live-preview the typed/uploaded font as you go.
  useEffect(() => {
    if (!family) return;
    if (mode === 'upload' && fontData) ensureFont({ type: 'font', fontFamily: family, fontData });
    else if (mode === 'google') ensureFont({ type: 'font', fontFamily: family, fontUrl: '' });
  }, [family, mode, fontData]);

  const pickFile = (file: File) => {
    setFileName(file.name);
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => setFontData(String(reader.result));
    reader.readAsDataURL(file);
  };

  const canSave = !!family && (mode === 'google' || !!fontData);

  const save = () => {
    if (!canSave) return;
    const projectIds = view.kind === 'collection' ? [view.id] : [];
    addItem({
      type: 'font',
      title: family,
      fontFamily: family,
      fontData: mode === 'upload' ? fontData : undefined,
      fontUrl: mode === 'google' ? '' : undefined,
      source: mode === 'google' ? 'Google Fonts' : 'upload',
      sample: sample.trim() || DEFAULT_SAMPLE,
      ratio: 1.1,
      projectIds,
    });
    toast('Font saved');
    onClose();
  };

  const tab = (id: 'google' | 'upload', label: string) => (
    <button
      onClick={() => setMode(id)}
      className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition ${
        mode === id ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
              if (e.key === 'Escape') onClose();
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <FontIcon size={15} /> Save a font
              </p>
              <button onClick={onClose} className="text-muted hover:text-ink">
                <Close size={16} />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3 inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
                {tab('google', 'Google Font')}
                {tab('upload', 'Upload file')}
              </div>

              {mode === 'google' ? (
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Font family, e.g. Inter, Playfair Display…"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                />
              ) : (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong px-4 py-6 text-center transition hover:bg-surface-2/50"
                  >
                    <Upload size={18} className="text-faint" />
                    <p className="text-[12.5px] text-muted">
                      {fileName || 'Click to choose a .ttf, .otf, .woff or .woff2 file'}
                    </p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2,font/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) pickFile(f);
                      e.target.value = '';
                    }}
                  />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Display name"
                    className="mt-2.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                  />
                </>
              )}

              {/* preview */}
              <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                <p
                  className="text-[40px] leading-none text-ink"
                  style={{ fontFamily: family ? fontStack(family) : 'inherit' }}
                >
                  Ag
                </p>
                <p
                  className="mt-3 text-[16px] text-muted"
                  style={{ fontFamily: family ? fontStack(family) : 'inherit' }}
                >
                  {sample || DEFAULT_SAMPLE}
                </p>
              </div>

              <input
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                placeholder="Sample text…"
                className="mt-2.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
              />
              {mode === 'google' && (
                <p className="mt-2 text-[11.5px] text-faint">
                  Loaded from Google Fonts — needs a connection the first time.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-border px-4 py-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={save}
                disabled={!canSave}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-accent-ink disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                Save font
                <span className="rounded bg-black/15 px-1 text-[10px] opacity-80">⌘↵</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
