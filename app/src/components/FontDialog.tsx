import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { ensureFont, fontStack } from '../lib/fonts';
import { toast } from '../lib/toast';
import { Close, FontIcon, Upload } from './icons';

const DEFAULT_SAMPLE = 'The quick brown fox jumps over the lazy dog';
type Mode = 'system' | 'google' | 'upload';

// The Local Font Access API (Chromium, HTTPS, permission-gated).
const queryLocalFonts = (
  window as unknown as { queryLocalFonts?: () => Promise<{ family: string }[]> }
).queryLocalFonts;

export function FontDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addItem, view } = useForage();
  const [mode, setMode] = useState<Mode>('system');
  const [name, setName] = useState('');
  const [sample, setSample] = useState(DEFAULT_SAMPLE);
  const [fontData, setFontData] = useState<string | undefined>();
  const [fileName, setFileName] = useState('');
  const [localFonts, setLocalFonts] = useState<string[] | null>(null);
  const [localQuery, setLocalQuery] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode('system');
      setName('');
      setSample(DEFAULT_SAMPLE);
      setFontData(undefined);
      setFileName('');
      setLocalFonts(null);
      setLocalQuery('');
    }
  }, [open]);

  const family = name.trim();

  // Live-preview the font. System fonts render natively (no load); Google/upload load.
  useEffect(() => {
    if (!family) return;
    if (mode === 'upload' && fontData) ensureFont({ type: 'font', fontFamily: family, fontData });
    else if (mode === 'google') ensureFont({ type: 'font', fontFamily: family, fontUrl: '' });
  }, [family, mode, fontData]);

  const loadLocalFonts = async () => {
    if (!queryLocalFonts) {
      toast('Your browser can’t list installed fonts — try Chrome, or type the name.');
      setLocalFonts([]);
      return;
    }
    try {
      const fonts = await queryLocalFonts();
      const families = [...new Set(fonts.map((f) => f.family))].sort((a, b) => a.localeCompare(b));
      setLocalFonts(families);
    } catch {
      toast('Couldn’t read installed fonts (permission denied).');
      setLocalFonts([]);
    }
  };

  const filteredLocal = useMemo(() => {
    if (!localFonts) return [];
    const q = localQuery.trim().toLowerCase();
    return (q ? localFonts.filter((f) => f.toLowerCase().includes(q)) : localFonts).slice(0, 300);
  }, [localFonts, localQuery]);

  const pickFile = (file: File) => {
    setFileName(file.name);
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => setFontData(String(reader.result));
    reader.readAsDataURL(file);
  };

  const canSave = !!family && (mode !== 'upload' || !!fontData);

  const save = () => {
    if (!canSave) return;
    const projectIds = view.kind === 'collection' ? [view.id] : [];
    addItem({
      type: 'font',
      title: family,
      fontFamily: family,
      fontData: mode === 'upload' ? fontData : undefined,
      fontUrl: mode === 'google' ? '' : undefined,
      source: mode === 'google' ? 'Google Fonts' : mode === 'system' ? 'Installed' : 'upload',
      sample: sample.trim() || DEFAULT_SAMPLE,
      ratio: 1.1,
      projectIds,
    });
    toast('Font saved');
    onClose();
  };

  const tab = (id: Mode, label: string) => (
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
                {tab('system', 'From your computer')}
                {tab('google', 'Google Font')}
                {tab('upload', 'Upload file')}
              </div>

              {mode === 'system' ? (
                <>
                  {localFonts === null ? (
                    <button
                      onClick={loadLocalFonts}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-6 text-[13px] text-muted transition hover:bg-surface-2/50"
                    >
                      Browse fonts installed on this computer
                    </button>
                  ) : localFonts.length === 0 ? (
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Type an installed font name, e.g. Helvetica Neue…"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                    />
                  ) : (
                    <>
                      <input
                        autoFocus
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        placeholder={`Search ${localFonts.length} installed fonts…`}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                      />
                      <div className="mt-2 max-h-44 overflow-auto rounded-lg border border-border">
                        {filteredLocal.map((f) => (
                          <button
                            key={f}
                            onClick={() => setName(f)}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-[14px] transition hover:bg-surface-2 ${
                              family === f ? 'bg-surface-2 text-ink' : 'text-ink'
                            }`}
                            style={{ fontFamily: fontStack(f) }}
                          >
                            <span className="truncate">{f}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : mode === 'google' ? (
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
              <p className="mt-2 text-[11.5px] text-faint">
                {mode === 'system'
                  ? 'Renders with the font installed on this computer.'
                  : mode === 'google'
                    ? 'Loaded from Google Fonts — needs a connection the first time.'
                    : 'Embedded in your library — works on any device.'}
              </p>
            </div>

            <div className="flex items-center justify-end border-t border-border px-4 py-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={save}
                disabled={!canSave}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-accent-ink disabled:opacity-40"
                style={{ background: 'var(--ink)' }}
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
