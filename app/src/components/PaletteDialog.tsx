import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { extractPalette } from '../lib/color';
import { toast } from '../lib/toast';
import { Close, Image as ImageIcon, Loader, Palette, Plus } from './icons';

const STARTER = ['#2d3142', '#4f5d75', '#bfc0c0', '#ef8354', '#ffffff'];

export function PaletteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addItem, view } = useForage();
  const [name, setName] = useState('');
  const [colors, setColors] = useState<string[]>(STARTER);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setColors(STARTER);
      setBusy(false);
    }
  }, [open]);

  const setColor = (i: number, hex: string) =>
    setColors((cs) => cs.map((c, j) => (j === i ? hex : c)));
  const removeColor = (i: number) => setColors((cs) => cs.filter((_, j) => j !== i));
  const addColor = () => setColors((cs) => (cs.length >= 8 ? cs : [...cs, '#888888']));

  const fromImage = async (file: File) => {
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const p = await extractPalette(String(reader.result));
      if (p.length) setColors(p);
      else toast("Couldn't read colors from that image.");
      setBusy(false);
    };
    reader.onerror = () => setBusy(false);
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!colors.length) return;
    const projectIds = view.kind === 'collection' ? [view.id] : [];
    addItem({
      type: 'palette',
      title: name.trim() || 'Untitled palette',
      palette: colors,
      ratio: 1.2,
      projectIds,
    });
    toast('Palette saved');
    onClose();
  };

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
                <Palette size={15} /> New color palette
              </p>
              <button onClick={onClose} className="text-muted hover:text-ink">
                <Close size={16} />
              </button>
            </div>

            <div className="p-4">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Palette name…"
                className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              />

              {/* live swatch row */}
              <div className="mt-4 flex h-28 overflow-hidden rounded-xl border border-border">
                {colors.map((c, i) => (
                  <div key={i} className="group relative flex-1" style={{ background: c }}>
                    <input
                      type="color"
                      value={c}
                      onChange={(e) => setColor(i, e.target.value)}
                      title="Edit color"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    {colors.length > 1 && (
                      <button
                        onClick={() => removeColor(i)}
                        title="Remove"
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                      >
                        <Close size={11} />
                      </button>
                    )}
                    <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[9.5px] font-medium uppercase text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                      {c.replace('#', '')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={addColor}
                  disabled={colors.length >= 8}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-ink transition hover:bg-surface-2 disabled:opacity-40"
                >
                  <Plus size={13} /> Add color
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-ink transition hover:bg-surface-2 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader size={13} className="animate-spin" />
                  ) : (
                    <ImageIcon size={13} />
                  )}
                  {busy ? 'Reading…' : 'Extract from image'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) fromImage(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-border px-4 py-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={save}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-accent-ink"
                style={{ background: 'var(--ink)' }}
              >
                Save palette
                <span className="rounded bg-black/15 px-1 text-[10px] opacity-80">⌘↵</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
