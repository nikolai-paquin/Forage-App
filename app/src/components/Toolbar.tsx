import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Moon, Plus, Search, Sun } from './icons';

export function Toolbar({ onCapture }: { onCapture: () => void }) {
  const { query, setQuery } = useForage();
  const { dark, toggle } = useTheme();

  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 border-b border-border px-5 py-2.5 backdrop-blur-xl"
      style={{ background: 'var(--toolbar)' }}
    >
      <label className="group flex h-9 max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 transition focus-within:border-border-strong">
        <Search width={16} height={16} className="text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything…"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-[11px] text-faint hover:text-muted"
          >
            clear
          </button>
        )}
      </label>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface text-muted transition hover:text-ink"
        >
          <motion.span
            key={dark ? 'moon' : 'sun'}
            initial={{ rotate: -40, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            {dark ? <Moon width={17} height={17} /> : <Sun width={17} height={17} />}
          </motion.span>
        </button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onCapture}
          className="flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium text-accent-ink"
          style={{ background: 'var(--accent)' }}
        >
          <Plus width={16} height={16} />
          Add
          <span className="ml-0.5 rounded bg-black/15 px-1 text-[10px] opacity-80">⌘N</span>
        </motion.button>
      </div>
    </div>
  );
}
