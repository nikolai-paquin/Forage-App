import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../lib/theme';
import { useForage } from '../lib/store';
import { exportBackup, storageStats, formatBytes } from '../lib/backup';
import { exportLibraryZip, importLibraryFile } from '../lib/exportLibrary';
import { getUnfurlEndpoint, setUnfurlEndpoint } from '../lib/unfurl';
import { COLOR_THEMES, getColorTheme, setColorTheme, applyColorTheme } from '../lib/colorTheme';
import {
  SOUNDS,
  TRASH_SOUNDS,
  getSoundEnabled,
  setSoundEnabled,
  getSoundId,
  setSoundId,
  getTrashId,
  setTrashId,
  playSound,
  playTrashSound,
  playVarietyPreview,
} from '../lib/sound';
import {
  getDefaultCollection,
  setDefaultCollection,
} from '../lib/capture';
import { generateSyncKey } from '../lib/sync';
import { usePwaInstall } from '../lib/pwa';
import { toast } from '../lib/toast';
import { ForageMark } from './ForageMark';
import { timeAgo } from '../lib/util';
import type { FilterEntry } from '../types';
import {
  ArrowLeft,
  BarChart,
  Camera,
  Check,
  ChevronRight,
  Close,
  Database,
  Download,
  ExternalLink,
  FileDown,
  FileUp,
  Filter,
  Hash,
  Info,
  LibraryIcon,
  Link,
  Palette,
  Plus,
  Sparkle,
  Share2,
  Trash2,
  Volume2,
  Wand,
} from './icons';

const NAV = [
  { id: 'stats', label: 'Stats', icon: <BarChart size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'filters', label: 'Filters', icon: <Filter size={16} /> },
  { id: 'libraries', label: 'Libraries', icon: <LibraryIcon size={16} /> },
  { id: 'ai', label: 'Links', icon: <Link size={16} /> },
  { id: 'tags', label: 'Tags', icon: <Hash size={16} /> },
  { id: 'capture', label: 'Capture', icon: <Camera size={16} /> },
  { id: 'sound', label: 'Sound', icon: <Volume2 size={16} /> },
  { id: 'updates', label: 'Install', icon: <Download size={16} /> },
  { id: 'sync', label: 'Sync', icon: <Share2 size={16} /> },
  { id: 'data', label: 'Data', icon: <Database size={16} /> },
  { id: 'about', label: 'About', icon: <Info size={16} /> },
];

const VERSION = '1.0.0';
const REPO = 'https://github.com/nikolai-paquin/Forage-App';
const ABOUT_LINKS = [
  { label: 'GitHub repository', href: REPO },
  { label: 'Live site', href: 'https://nikolai-paquin.github.io/Forage-App/' },
  { label: 'Report an issue', href: `${REPO}/issues` },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? 'var(--ink)' : 'var(--border-strong)' }}
    >
      <motion.span
        className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white"
        animate={{ left: on ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

function ManagedList({
  title,
  hint,
  entries,
  onToggle,
  onRemove,
  onAdd,
  placeholder,
}: {
  title: string;
  hint: string;
  entries: FilterEntry[];
  onToggle: (v: string) => void;
  onRemove: (v: string) => void;
  onAdd: (label: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    if (draft.trim()) {
      onAdd(draft);
      setDraft('');
    }
  };
  return (
    <section className="mb-8">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        <span className="text-[12px] text-faint">{entries.filter((e) => e.enabled).length} shown</span>
      </div>
      <p className="mb-3 text-[12.5px] text-muted">{hint}</p>
      <div className="overflow-hidden rounded-xl border border-border">
        {entries.length === 0 && (
          <p className="px-3 py-4 text-[13px] text-faint">None yet — add one below.</p>
        )}
        {entries.map((e, i) => (
          <div
            key={e.value}
            className={`flex items-center gap-3 px-3 py-2 ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <span className={`flex-1 text-[13.5px] ${e.enabled ? 'text-ink' : 'text-faint line-through'}`}>
              {e.label}
            </span>
            <Toggle on={e.enabled} onClick={() => onToggle(e.value)} />
            <button
              onClick={() => onRemove(e.value)}
              className="grid h-7 w-7 place-items-center rounded-md text-faint transition hover:bg-surface-2 hover:text-ink"
              title="Remove"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
        />
        <button
          onClick={submit}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium text-accent-ink"
          style={{ background: 'var(--ink)' }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </section>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState('stats');
  // On phones, Settings is a master-detail list: show the section list first,
  // tap in to a section. `mobileList` true = showing the list.
  const [mobileList, setMobileList] = useState(true);
  const { dark, toggle } = useTheme();
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const fileRef = useRef<HTMLInputElement>(null);
  const [unfurlEp, setUnfurlEp] = useState(getUnfurlEndpoint());
  const [savedUnfurl, setSavedUnfurl] = useState(false);
  const [colorChoice, setColorChoice] = useState(getColorTheme());
  const [stats, setStats] = useState({ items: 0, bytes: 0 });
  const [confirmReset, setConfirmReset] = useState(false);
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [soundChoice, setSoundChoice] = useState(getSoundId());
  const [trashChoice, setTrashChoice] = useState(getTrashId());
  const [defColl, setDefColl] = useState(getDefaultCollection());
  const [newLib, setNewLib] = useState('');

  useEffect(() => {
    if (open && active === 'data') storageStats().then(setStats);
  }, [open, active]);

  // Reopen Settings to the section list on phones.
  useEffect(() => {
    if (open) setMobileList(true);
  }, [open]);

  const activeLabel = NAV.find((n) => n.id === active)?.label ?? 'Settings';

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const { items: n } = await importLibraryFile(file);
      toast(`Restored ${n} saves — reloading…`);
      setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Import failed');
    }
  };

  const [zipping, setZipping] = useState(false);
  const [zipPct, setZipPct] = useState(0);
  const exportFolders = async () => {
    setZipping(true);
    setZipPct(0);
    try {
      await exportLibraryZip((pct) => setZipPct(Math.round(pct)));
      toast('Library exported');
    } catch {
      toast('Export failed');
    } finally {
      setZipping(false);
    }
  };

  const saveUnfurl = () => {
    setUnfurlEndpoint(unfurlEp);
    setSavedUnfurl(true);
    setTimeout(() => setSavedUnfurl(false), 1600);
  };
  const {
    items,
    projects,
    spaces,
    storyboards,
    kits,
    libraries,
    activeLibrary,
    createLibrary,
    switchLibrary,
    renameLibrary,
    deleteLibrary,
    fileTypes,
    sources,
    addFileType,
    removeFileType,
    toggleFileType,
    addSource,
    removeSource,
    toggleSource,
    removeTagEverywhere,
    setTagFilter,
    setView,
    syncCfg,
    syncBusy,
    lastSyncedAt,
    updateSyncCfg,
    syncNow,
    clearLibrary,
  } = useForage();

  const tagCounts = new Map<string, number>();
  items
    .filter((i) => !i.deletedAt)
    .forEach((i) => i.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)));
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex items-center justify-center p-0 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative flex h-full w-full max-w-none flex-col overflow-hidden rounded-none border border-border bg-elevated md:grid md:h-[560px] md:max-w-3xl md:grid-cols-[220px_1fr] md:rounded-2xl"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            {/* Desktop sidebar */}
            <div className="hidden border-r border-border bg-surface p-3 md:block">
              <p className="px-2.5 pb-2 pt-1 text-[12px] font-semibold uppercase tracking-wider text-faint">
                Settings
              </p>
              <div className="flex flex-col gap-0.5">
                {NAV.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setActive(n.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] transition ${
                      active === n.id ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {n.icon}
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile top bar — back (in a section) / title / close */}
            <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-3 md:hidden">
              {!mobileList && (
                <button
                  onClick={() => setMobileList(true)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-ink"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <span className="text-[15px] font-semibold text-ink">
                {mobileList ? 'Settings' : activeLabel}
              </span>
              <button
                onClick={onClose}
                className="ml-auto grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <Close size={18} />
              </button>
            </div>

            {/* content */}
            <div className="relative min-w-0 flex-1 overflow-auto p-5 md:p-7">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 hidden h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink md:grid"
              >
                <Close size={16} />
              </button>

              {/* Mobile section list */}
              {mobileList && (
                <div className="-m-1 flex flex-col md:hidden">
                  {NAV.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setActive(n.id);
                        setMobileList(false);
                      }}
                      className="flex items-center gap-3 border-b border-border px-1 py-3.5 text-left text-[15px] text-ink"
                    >
                      <span className="text-muted">{n.icon}</span>
                      <span className="flex-1">{n.label}</span>
                      <ChevronRight size={16} className="text-faint" />
                    </button>
                  ))}
                </div>
              )}

              {/* Section content — hidden on phones while the list is showing */}
              <div className={mobileList ? 'hidden md:block' : 'block'}>
              {active === 'tags' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Tags</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Every tag across your library. Click one to filter, or remove it everywhere.
                  </p>
                  {tags.length === 0 ? (
                    <p className="text-[13.5px] text-faint">No tags yet — add some from a save's detail panel.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border">
                      {tags.map(([tag, count], i) => (
                        <div
                          key={tag}
                          className={`flex items-center gap-3 px-3 py-2 ${i > 0 ? 'border-t border-border' : ''}`}
                        >
                          <button
                            onClick={() => {
                              setTagFilter(tag);
                              setView({ kind: 'library', tab: 'all' });
                              onClose();
                            }}
                            className="flex-1 text-left text-[13.5px] text-ink hover:text-accent"
                          >
                            #{tag}
                          </button>
                          <span className="tnum text-[12.5px] text-faint">{count}</span>
                          <button
                            onClick={() => removeTagEverywhere(tag)}
                            className="grid h-7 w-7 place-items-center rounded-md text-faint transition hover:bg-surface-2 hover:text-red-500"
                            title="Remove from all saves"
                          >
                            <Close size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : active === 'filters' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Filters</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Choose which file types and sources appear in the Library filter menus. Toggle to
                    hide, remove to delete, or add your own.
                  </p>
                  <ManagedList
                    title="File types"
                    hint="The asset types you collect."
                    entries={fileTypes}
                    onToggle={toggleFileType}
                    onRemove={removeFileType}
                    onAdd={addFileType}
                    placeholder="Add a file type (e.g. Audio)"
                  />
                  <ManagedList
                    title="Sources"
                    hint="Where your saves come from. New sources are added automatically as you forage."
                    entries={sources}
                    onToggle={toggleSource}
                    onRemove={removeSource}
                    onAdd={addSource}
                    placeholder="Add a source (e.g. behance.net)"
                  />
                </>
              ) : active === 'appearance' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Appearance</h2>
                  <div className="mt-6 flex items-center justify-between border-b border-border py-3 text-[14px]">
                    <span className="text-muted">Theme</span>
                    <button
                      onClick={toggle}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-ink"
                    >
                      {dark ? 'Dark' : 'Light'}
                    </button>
                  </div>

                  <p className="mb-3 mt-7 text-[12px] font-medium uppercase tracking-[0.16em] text-faint">
                    Color theme
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {COLOR_THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setColorChoice(t.id);
                          setColorTheme(t.id);
                          applyColorTheme(t.id, dark);
                        }}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] transition ${
                          colorChoice === t.id
                            ? 'border-ink bg-surface-2 text-ink'
                            : 'border-border bg-surface text-muted hover:text-ink'
                        }`}
                      >
                        <span
                          className="h-5 w-5 shrink-0 rounded-full ring-1 ring-border"
                          style={{ background: t.swatch }}
                        />
                        <span className="flex-1 text-left">{t.name}</span>
                        {colorChoice === t.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] text-faint">
                    Tints the background and accent — works in both light and dark.
                  </p>
                </>
              ) : active === 'stats' ? (
                (() => {
                  const live = items.filter((i) => !i.deletedAt);
                  const byType = Array.from(
                    live.reduce((m, i) => m.set(i.type, (m.get(i.type) ?? 0) + 1), new Map<string, number>()),
                  ).sort((a, b) => b[1] - a[1]);
                  const tagCount = new Set(live.flatMap((i) => i.tags)).size;
                  const favs = live.filter((i) => i.favorite).length;
                  const oldest = live.reduce((min, i) => Math.min(min, i.createdAt), Date.now());
                  const TYPE_LABEL: Record<string, string> = {
                    image: 'Images', video: 'Video', link: 'Links', gif: 'GIFs', ai_asset: 'AI assets',
                    vector: 'Vectors', code: 'Code', audio: 'Audio', palette: 'Palettes', font: 'Fonts',
                  };
                  const stat = (n: number, label: string) => (
                    <div className="rounded-xl border border-border bg-surface px-4 py-3.5">
                      <p className="tnum text-[26px] font-semibold leading-none text-ink">{n}</p>
                      <p className="mt-1.5 text-[12.5px] text-muted">{label}</p>
                    </div>
                  );
                  return (
                    <>
                      <h2 className="text-[24px] font-semibold tracking-tight">Stats</h2>
                      <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                        What you’ve gathered{live.length ? ` since ${new Date(oldest).toLocaleDateString()}` : ''}.
                      </p>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {stat(live.length, 'Total saves')}
                        {stat(projects.length, 'Collections')}
                        {stat(spaces.length, 'Moodboards')}
                        {stat(storyboards.length, 'Storyboards')}
                        {stat(kits.length, 'Kits')}
                        {stat(tagCount, 'Tags')}
                        {stat(favs, 'Favorites')}
                      </div>

                      {byType.length > 0 && (
                        <>
                          <p className="mb-3 mt-8 text-[12px] font-medium uppercase tracking-[0.16em] text-faint">
                            By type
                          </p>
                          <div className="flex flex-col gap-2">
                            {byType.map(([t, n]) => (
                              <div key={t} className="flex items-center gap-3">
                                <span className="w-24 shrink-0 text-[13px] text-muted">
                                  {TYPE_LABEL[t] ?? t}
                                </span>
                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                                  <span
                                    className="block h-full rounded-full"
                                    style={{ width: `${(n / live.length) * 100}%`, background: 'var(--ink)' }}
                                  />
                                </span>
                                <span className="tnum w-8 shrink-0 text-right text-[12.5px] text-muted">{n}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()
              ) : active === 'sync' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Sync</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Keep your library in step across devices. Deploy the sync Worker (see{' '}
                    <code className="rounded bg-surface-2 px-1 py-0.5 text-[11.5px]">/server</code>),
                    then use the same endpoint and sync key on each device. Merges are
                    last-write-wins per item, so edits and deletes both survive.
                  </p>

                  <label className="mb-1.5 block text-[13px] font-medium text-ink">Sync endpoint URL</label>
                  <input
                    value={syncCfg.endpoint}
                    onChange={(e) => updateSyncCfg({ endpoint: e.target.value })}
                    placeholder="https://forage-sync.you.workers.dev"
                    className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                  />

                  <label className="mb-1.5 block text-[13px] font-medium text-ink">Sync key</label>
                  <div className="flex gap-2">
                    <input
                      value={syncCfg.key}
                      onChange={(e) => updateSyncCfg({ key: e.target.value })}
                      placeholder="Paste your key, or generate one"
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                    />
                    <button
                      onClick={() => updateSyncCfg({ key: generateSyncKey() })}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-ink transition hover:bg-surface-2"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-2 flex items-start gap-2 text-[12px] text-faint">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    <span>This key is the password to your library on the server. Keep it private.</span>
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-border py-3.5">
                    <div>
                      <p className="text-[13.5px] font-medium text-ink">Auto-sync</p>
                      <p className="text-[12.5px] text-muted">Push changes and pull updates automatically.</p>
                    </div>
                    <Toggle
                      on={syncCfg.auto}
                      onClick={() => updateSyncCfg({ auto: !syncCfg.auto })}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      disabled={!syncCfg.endpoint.trim() || !syncCfg.key.trim() || syncBusy}
                      onClick={() => syncNow()}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink disabled:opacity-40"
                      style={{ background: 'var(--ink)' }}
                    >
                      <Share2 size={15} /> {syncBusy ? 'Syncing…' : 'Sync now'}
                    </button>
                    <span className="text-[12.5px] text-faint">
                      {lastSyncedAt ? `Last synced ${timeAgo(lastSyncedAt)}` : 'Not synced yet'}
                    </span>
                  </div>
                </>
              ) : active === 'data' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Data</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Your library lives in this browser. Export a backup regularly — clearing your
                    browser data would otherwise wipe it.
                  </p>

                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <p className="text-[22px] font-semibold tracking-tight text-ink">{stats.items}</p>
                      <p className="text-[12.5px] text-muted">saves stored</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <p className="text-[22px] font-semibold tracking-tight text-ink">
                        {formatBytes(stats.bytes)}
                      </p>
                      <p className="text-[12.5px] text-muted">on this device</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={exportFolders}
                      disabled={zipping}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink disabled:opacity-50"
                      style={{ background: 'var(--ink)' }}
                    >
                      <Download size={15} /> {zipping ? `Exporting… ${zipPct}%` : 'Export library (.zip)'}
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-surface-2"
                    >
                      <FileUp size={15} /> Import library
                    </button>
                    <button
                      onClick={() => exportBackup().then(() => toast('Backup downloaded'))}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-surface-2"
                    >
                      <FileDown size={15} /> Backup (.json)
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".zip,application/json,.json,application/zip"
                      className="hidden"
                      onChange={(e) => {
                        handleImport(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-[12.5px] text-faint">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-muted">Export library</strong> downloads a folder
                      (.zip) with one sub-folder per collection — your assets stay organized, and the
                      same file re-imports losslessly. Importing replaces your current library.
                    </span>
                  </p>

                  <div className="mt-8 border-t border-border pt-5">
                    <p className="text-[13.5px] font-medium text-ink">Start over</p>
                    <p className="mt-1 mb-3 max-w-md text-[12.5px] text-muted">
                      Remove every save and space from this device. Handy for a clean slate — your
                      filters, theme, and sync settings are kept.
                    </p>
                    {confirmReset ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            clearLibrary();
                            setConfirmReset(false);
                            storageStats().then(setStats);
                            toast('Library cleared', { sound: 'trash' });
                          }}
                          className="rounded-full bg-red-500 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-red-600"
                        >
                          Yes, clear everything
                        </button>
                        <button
                          onClick={() => setConfirmReset(false)}
                          className="rounded-full border border-border px-4 py-2 text-[13px] text-ink transition hover:bg-surface-2"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmReset(true)}
                        className="flex items-center gap-1.5 rounded-full border border-red-300 px-4 py-2 text-[13px] font-medium text-red-500 transition hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={15} /> Clear library
                      </button>
                    )}
                  </div>
                </>
              ) : active === 'ai' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Links</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Turn saved links into rich bookmarks — real page titles, descriptions, and
                    preview images, plus reliable YouTube titles.
                  </p>

                  <label className="mb-1.5 block text-[13px] font-medium text-ink">
                    Link previews endpoint URL
                  </label>
                  <p className="mb-2.5 max-w-md text-[12.5px] text-muted">
                    Optional. Without it, links are saved as plain URLs.
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={unfurlEp}
                      onChange={(e) => setUnfurlEp(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveUnfurl()}
                      placeholder="https://forage-unfurl.you.workers.dev"
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                    />
                    <button
                      onClick={saveUnfurl}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-accent-ink"
                      style={{ background: 'var(--ink)' }}
                    >
                      {savedUnfurl ? <Check size={14} /> : <Wand size={14} />}
                      {savedUnfurl ? 'Saved' : 'Save'}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[12.5px]">
                    <span
                      className={`h-2 w-2 rounded-full ${unfurlEp.trim() ? 'bg-emerald-500' : 'bg-faint'}`}
                    />
                    <span className="text-muted">
                      {unfurlEp.trim() ? 'Rich link previews on' : 'Links saved as plain URLs'}
                    </span>
                  </div>
                  <p className="mt-4 flex items-start gap-2 text-[12.5px] text-faint">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Deploy{' '}
                      <code className="rounded bg-surface-2 px-1 py-0.5 text-[11.5px]">
                        server/unfurl-worker.js
                      </code>{' '}
                      with{' '}
                      <code className="rounded bg-surface-2 px-1 py-0.5 text-[11.5px]">
                        wrangler deploy -c wrangler.unfurl.toml
                      </code>{' '}
                      (no API key needed), then paste its URL here.
                    </span>
                  </p>
                </>
              ) : active === 'updates' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Install</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Install Forage as an app for its own window, a home-screen or taskbar icon, and
                    the system share sheet.
                  </p>
                  {installed ? (
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-[13.5px] text-ink">
                      <Check size={16} className="text-emerald-500" /> Forage is installed on this device.
                    </div>
                  ) : canInstall ? (
                    <button
                      onClick={promptInstall}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
                      style={{ background: 'var(--ink)' }}
                    >
                      <Download size={15} /> Install Forage
                    </button>
                  ) : (
                    <p className="flex items-start gap-2 text-[13px] text-muted">
                      <Info size={15} className="mt-0.5 shrink-0" />
                      <span>
                        Install isn’t available right now. On desktop Chrome/Edge, look for the install
                        icon in the address bar; on iOS Safari, use Share → Add to Home Screen.
                      </span>
                    </p>
                  )}
                </>
              ) : active === 'libraries' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Libraries</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Separate workspaces — each with its own saves, collections, moodboards, and
                    storyboards. Switch between them without anything mixing.
                  </p>
                  <div className="flex flex-col gap-2">
                    {libraries.map((l) => (
                      <div
                        key={l.id}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                          l.id === activeLibrary ? 'border-ink bg-surface-2' : 'border-border bg-surface'
                        }`}
                      >
                        <input
                          value={l.name}
                          onChange={(e) => renameLibrary(l.id, e.target.value)}
                          className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium text-ink outline-none"
                        />
                        {l.id === activeLibrary ? (
                          <span className="flex items-center gap-1 text-[12px] font-medium text-emerald-500">
                            <Check size={13} /> Active
                          </span>
                        ) : (
                          <button
                            onClick={() => switchLibrary(l.id)}
                            className="rounded-lg border border-border px-2.5 py-1 text-[12.5px] text-muted transition hover:text-ink"
                          >
                            Switch
                          </button>
                        )}
                        {l.id !== 'default' && l.id !== activeLibrary && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete the library “${l.name}” and everything in it?`)) {
                                deleteLibrary(l.id);
                                toast('Library deleted', { sound: 'trash' });
                              }
                            }}
                            title="Delete library"
                            className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <input
                      value={newLib}
                      onChange={(e) => setNewLib(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newLib.trim()) {
                          createLibrary(newLib);
                          setNewLib('');
                        }
                      }}
                      placeholder="New library name…"
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                    />
                    <button
                      onClick={() => {
                        if (!newLib.trim()) return;
                        createLibrary(newLib);
                        setNewLib('');
                      }}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-accent-ink"
                      style={{ background: 'var(--ink)' }}
                    >
                      <Plus size={15} /> Create
                    </button>
                  </div>
                  <p className="mt-4 flex items-start gap-2 text-[12px] text-faint">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Switching reloads that library’s data. Export (Settings → Data) backs up the
                      library you’re currently in.
                    </span>
                  </p>
                </>
              ) : active === 'capture' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Capture</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Defaults applied to every new save — however you capture it (paste, drop,
                    extension, share).
                  </p>
                  <label className="mb-1.5 block text-[13px] font-medium text-ink">
                    Default collection
                  </label>
                  <p className="mb-2 text-[12.5px] text-muted">
                    New saves with no collection chosen go here.
                  </p>
                  <select
                    value={defColl}
                    onChange={(e) => {
                      setDefColl(e.target.value);
                      setDefaultCollection(e.target.value);
                    }}
                    className="mb-6 w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none"
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : active === 'sound' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Sound</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    A subtle pop when a save lands or an action completes. Off by default.
                  </p>
                  <div className="flex items-center justify-between border-t border-border py-3.5">
                    <div>
                      <p className="text-[13.5px] font-medium text-ink">Sound effects</p>
                      <p className="text-[12.5px] text-muted">
                        Play a soft cue on saves and confirmations.
                      </p>
                    </div>
                    <Toggle
                      on={soundOn}
                      onClick={() => {
                        const next = !soundOn;
                        setSoundOn(next);
                        setSoundEnabled(next);
                        if (next) {
                          if (soundChoice === 'variety') playVarietyPreview();
                          else playSound(soundChoice);
                        }
                      }}
                    />
                  </div>

                  <p className="mb-2.5 mt-6 text-[12px] font-medium uppercase tracking-[0.16em] text-faint">
                    Choose a sound
                  </p>
                  <button
                    onClick={() => {
                      setSoundChoice('variety');
                      setSoundId('variety');
                      playVarietyPreview();
                    }}
                    className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-[13px] transition ${
                      soundChoice === 'variety'
                        ? 'border-ink bg-surface-2 text-ink'
                        : 'border-border bg-surface text-muted hover:text-ink'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkle size={14} />
                      Variety — cycle through all
                    </span>
                    {soundChoice === 'variety' && <Check size={14} />}
                  </button>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SOUNDS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSoundChoice(s.id);
                          setSoundId(s.id);
                          playSound(s.id);
                        }}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-[13px] transition ${
                          soundChoice === s.id
                            ? 'border-ink bg-surface-2 text-ink'
                            : 'border-border bg-surface text-muted hover:text-ink'
                        }`}
                      >
                        {s.name}
                        {soundChoice === s.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] text-faint">Click any sound to preview it.</p>

                  <p className="mb-2.5 mt-7 text-[12px] font-medium uppercase tracking-[0.16em] text-faint">
                    Delete sound
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TRASH_SOUNDS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setTrashChoice(s.id);
                          setTrashId(s.id);
                          playTrashSound(s.id);
                        }}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-[13px] transition ${
                          trashChoice === s.id
                            ? 'border-ink bg-surface-2 text-ink'
                            : 'border-border bg-surface text-muted hover:text-ink'
                        }`}
                      >
                        {s.name}
                        {trashChoice === s.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] text-faint">
                    Plays when you delete something. Click any to preview it.
                  </p>
                </>
              ) : active === 'about' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">About</h2>
                  <div className="mt-4 flex items-center gap-3">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl text-accent-ink"
                      style={{ background: 'var(--ink)' }}
                    >
                      <ForageMark size={24} />
                    </span>
                    <div>
                      <p className="text-[16px] font-semibold text-ink">Forage</p>
                      <p className="text-[12.5px] text-muted">Version {VERSION}</p>
                    </div>
                  </div>
                  <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-muted">
                    A fast, local-first home for everything you save — images, links, video, audio,
                    and AI work — organized into collections, moodboards, and storyboards.
                  </p>
                  <div className="mt-6 flex flex-col gap-1.5">
                    {ABOUT_LINKS.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13.5px] text-ink transition hover:bg-surface-2"
                      >
                        {l.label}
                        <ExternalLink size={15} className="text-faint" />
                      </a>
                    ))}
                  </div>
                  <p className="mt-6 text-[12px] text-faint">
                    Your library lives in this browser — back it up from Settings → Data.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight capitalize">{active}</h2>
                  <p className="mt-3 text-[14px] text-muted">Coming soon.</p>
                </>
              )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
