import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ForageProvider, useForage } from './lib/store';
import { TopBar } from './components/TopBar';
import { LibraryView } from './components/LibraryView';
import { CollectionsView } from './components/CollectionsView';
import { CollectionView } from './components/CollectionView';
import { SpacesView } from './components/SpacesView';
import { SpaceCanvas } from './components/SpaceCanvas';
import { ItemDetail } from './components/ItemDetail';
import { CaptureDialog } from './components/CaptureDialog';
import { SearchOverlay } from './components/SearchOverlay';
import { ResurfacePanel } from './components/ResurfacePanel';
import { SettingsModal } from './components/SettingsModal';
import { Onboarding } from './components/Onboarding';
import { Fab } from './components/Fab';
import { BulkBar } from './components/BulkBar';
import { detectFromInput } from './lib/util';
import { extractPalette } from './lib/color';
import { consumeShareUrl } from './lib/ingest';
import { exportBackup } from './lib/backup';
import { aiEnabled } from './lib/ai';
import { indexItems } from './lib/semantic';
import { useTheme } from './lib/theme';
import { toast } from './lib/toast';
import { Toaster } from './components/Toaster';
import type { Item } from './types';

function Workspace() {
  const { view, items, markSeen, addItem, updateItem, setView, createSpace, findDuplicate } = useForage();
  const { dark, toggle } = useTheme();
  const [selected, setSelected] = useState<Item | null>(null);
  const [capture, setCapture] = useState(false);
  const [search, setSearch] = useState(false);
  const [settings, setSettings] = useState(false);
  const [resurface, setResurface] = useState(false);
  const [dragging, setDragging] = useState(false);

  const targetCollection = view.kind === 'collection' ? [view.id] : [];

  const addFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        if (findDuplicate({ media: dataUrl })) {
          toast('Already in your library');
          return;
        }
        const created = addItem({
          type: file.type === 'image/gif' ? 'gif' : 'image',
          title: file.name.replace(/\.[^.]+$/, ''),
          media: dataUrl,
          source: 'upload',
          projectIds: targetCollection,
        });
        extractPalette(dataUrl).then((p) => p.length && updateItem(created.id, { palette: p }));
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return; // don't hijack form fields
      const files = e.clipboardData?.files;
      if (files && files.length) {
        addFiles(files);
        return;
      }
      const text = e.clipboardData?.getData('text')?.trim();
      if (text) {
        const d = detectFromInput(text);
        const url = /^https?:/i.test(text) ? text : undefined;
        const media = d.type === 'image' || d.type === 'gif' ? text : undefined;
        const code = d.type === 'code' ? text : undefined;
        if (findDuplicate({ url, media, code })) {
          toast('Already in your library');
          return;
        }
        addItem({ type: d.type, title: d.title, source: d.source, url, media, code, projectIds: targetCollection });
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch((v) => !v);
      }
      if (meta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setCapture(true);
      }
      if (e.key === 'Escape') {
        setCapture(false);
        setSettings(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Ingest a capture handed off from the extension or mobile share sheet.
  useEffect(() => {
    const p = consumeShareUrl();
    if (p) {
      if (findDuplicate({ url: p.url, media: p.media })) {
        setView({ kind: 'library', tab: 'all' });
        toast(`“${p.title}” is already in your library`);
        return;
      }
      const created = addItem(p);
      setView({ kind: 'library', tab: 'all' });
      toast(`Saved “${created.title}” to Forage`);
      if (p.media) extractPalette(p.media).then((pal) => pal.length && updateItem(created.id, { palette: pal }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the semantic-search embedding index warm in the background (only when an
  // AI endpoint is configured). Embeds a few stale items at a time to avoid jank.
  useEffect(() => {
    if (!aiEnabled()) return;
    let stop = false;
    const run = async () => {
      if (stop) return;
      const n = await indexItems(items, 6);
      if (!stop && n > 0) setTimeout(run, 400);
    };
    const t = setTimeout(run, 1200);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [items]);

  const open = (item: Item) => {
    setSelected(item);
    markSeen(item.id);
  };

  const viewKey =
    view.kind +
    (view.kind === 'collection' || view.kind === 'space'
      ? view.id
      : view.kind === 'library'
        ? view.tab
        : '');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
      <TopBar
        onSearch={() => setSearch(true)}
        onSettings={() => setSettings(true)}
        onResurface={() => setResurface(true)}
      />
      <main
        className="relative min-h-0 flex-1 overflow-y-auto"
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.relatedTarget === null) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-3 z-50 grid place-items-center rounded-2xl border-2 border-dashed border-ink/40 bg-canvas/70 backdrop-blur-sm">
            <p className="text-[15px] font-medium text-ink">Drop to forage</p>
          </div>
        )}
        <motion.div
          key={viewKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {view.kind === 'library' && (
            <LibraryView onOpen={open} onCapture={() => setCapture(true)} />
          )}
          {view.kind === 'collections' && <CollectionsView onCapture={() => setCapture(true)} />}
          {view.kind === 'collection' && <CollectionView onOpen={open} />}
          {view.kind === 'spaces' && <SpacesView />}
          {view.kind === 'space' && <SpaceCanvas />}
        </motion.div>
      </main>

      <Fab onClick={() => setCapture(true)} />
      <BulkBar />
      <Toaster />

      <ItemDetail item={selected} onClose={() => setSelected(null)} onOpen={open} />
      <CaptureDialog open={capture} onClose={() => setCapture(false)} />
      <SearchOverlay
        open={search}
        onClose={() => setSearch(false)}
        onOpenItem={open}
        dark={dark}
        actions={{
          capture: () => setCapture(true),
          settings: () => setSettings(true),
          resurface: () => setResurface(true),
          exportBackup: () => {
            exportBackup();
            toast('Backup downloaded');
          },
          toggleTheme: toggle,
          newSpace: createSpace,
        }}
      />
      <ResurfacePanel open={resurface} onClose={() => setResurface(false)} onOpenItem={open} />
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
      <Onboarding onCapture={() => setCapture(true)} />
    </div>
  );
}

export function App() {
  return (
    <ForageProvider>
      <Workspace />
    </ForageProvider>
  );
}
