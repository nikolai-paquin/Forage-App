import { useEffect, useRef, useState } from 'react';
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
import { extractPalette, imageRatio } from './lib/color';
import { consumeShareUrl } from './lib/ingest';
import { exportBackup } from './lib/backup';
import { aiEnabled } from './lib/ai';
import { indexItems } from './lib/semantic';
import { useTheme } from './lib/theme';
import { toast } from './lib/toast';
import { Toaster } from './components/Toaster';
import { Search } from './components/icons';
import type { Item } from './types';

function Workspace() {
  const {
    view,
    items,
    visibleItems,
    hydrated,
    focusedId,
    setFocusedId,
    toggleSelect,
    markSeen,
    addItem,
    updateItem,
    setView,
    createSpace,
    findDuplicate,
  } = useForage();
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
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      if (!isImage && !isAudio) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        if (findDuplicate({ media: dataUrl })) {
          toast('Already in your library');
          return;
        }
        const created = addItem({
          type: isAudio ? 'audio' : file.type === 'image/gif' ? 'gif' : 'image',
          title: file.name.replace(/\.[^.]+$/, ''),
          media: dataUrl,
          source: 'upload',
          ratio: isAudio ? 1.5 : undefined,
          projectIds: targetCollection,
        });
        if (isImage) {
          extractPalette(dataUrl).then((p) => p.length && updateItem(created.id, { palette: p }));
          imageRatio(dataUrl).then((r) => r && updateItem(created.id, { ratio: r }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Turn pasted/dropped text (a URL, snippet, or YouTube link) into a save.
  const captureFromText = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const d = detectFromInput(text);
    const code = d.type === 'code' ? text : undefined;
    if (findDuplicate({ url: d.url, media: d.media, code })) {
      toast('Already in your library');
      return;
    }
    const created = addItem({
      type: d.type,
      title: d.title,
      source: d.source,
      url: d.url,
      media: d.media,
      poster: d.poster,
      ratio: d.ratio,
      code,
      projectIds: targetCollection,
    });
    if (d.media && d.type !== 'audio') {
      extractPalette(d.media).then((p) => p.length && updateItem(created.id, { palette: p }));
      if (d.type === 'image' || d.type === 'gif')
        imageRatio(d.media).then((r) => r && updateItem(created.id, { ratio: r }));
    }
    toast(`Saved “${created.title}”`);
  };

  // Accept an image dragged from a browser (no File, just an <img> in the payload).
  const captureDrop = (dt: DataTransfer) => {
    if (dt.files.length) {
      addFiles(dt.files);
      return;
    }
    const html = dt.getData('text/html');
    const fromHtml = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const candidate = fromHtml || dt.getData('text/uri-list') || dt.getData('text/plain');
    if (candidate && /^https?:/i.test(candidate.trim())) captureFromText(candidate.trim());
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
      if (text) captureFromText(text);
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

  // In-grid keyboard navigation. A ref carries live state so the listener stays
  // stable (no re-subscribe churn from the grid re-rendering each keystroke).
  const navRef = useRef({
    list: visibleItems,
    focusedId,
    setFocusedId,
    toggleSelect,
    open,
    blocked: false,
    isGrid: false,
  });
  navRef.current = {
    list: visibleItems,
    focusedId,
    setFocusedId,
    toggleSelect,
    open,
    blocked: capture || search || settings || resurface || selected !== null,
    isGrid: view.kind === 'library' || view.kind === 'collection',
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = navRef.current;
      if (s.blocked || !s.isGrid || !s.list.length) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const idx = s.focusedId ? s.list.findIndex((i) => i.id === s.focusedId) : -1;
      const move = (d: number) => {
        e.preventDefault();
        const ni = idx < 0 ? 0 : Math.min(Math.max(idx + d, 0), s.list.length - 1);
        s.setFocusedId(s.list[ni].id);
      };
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'j':
        case 'l':
          move(1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'k':
        case 'h':
          move(-1);
          break;
        case 'Enter':
          if (idx >= 0) {
            e.preventDefault();
            s.open(s.list[idx]);
          }
          break;
        case 'x':
        case ' ':
          if (idx >= 0) {
            e.preventDefault();
            s.toggleSelect(s.list[idx].id);
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const viewKey =
    view.kind +
    (view.kind === 'collection' || view.kind === 'space'
      ? view.id
      : view.kind === 'library'
        ? view.tab
        : '');

  // Brief splash while the library loads from IndexedDB — avoids an empty-state flash.
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas text-faint">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2"
        >
          <Search size={18} />
          <span className="text-[14px]">Forage</span>
        </motion.div>
      </div>
    );
  }

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
          captureDrop(e.dataTransfer);
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
      <CaptureDialog open={capture} onClose={() => setCapture(false)} onFiles={addFiles} />
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
            exportBackup().then(() => toast('Backup downloaded'));
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
