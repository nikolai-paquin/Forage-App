import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ForageProvider, useForage } from './lib/store';
import { TopBar } from './components/TopBar';
import { LibraryView } from './components/LibraryView';
import { CollectionsView } from './components/CollectionsView';
import { CollectionView } from './components/CollectionView';
import { SmartCollectionView } from './components/SmartCollectionView';
import { SpacesView } from './components/SpacesView';
import { SpaceCanvas } from './components/SpaceCanvas';
import { StoryboardsView } from './components/StoryboardsView';
import { StoryboardView } from './components/StoryboardView';
import { KitsView } from './components/KitsView';
import { KitView } from './components/KitView';
import { ItemDetail } from './components/ItemDetail';
import { CaptureDialog } from './components/CaptureDialog';
import { CollectionDialog } from './components/CollectionDialog';
import { PaletteDialog } from './components/PaletteDialog';
import { FontDialog } from './components/FontDialog';
import { SearchOverlay } from './components/SearchOverlay';
import { ResurfacePanel } from './components/ResurfacePanel';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { Onboarding } from './components/Onboarding';
import { ShareViewer } from './components/ShareViewer';
import { shareUrlFromHash } from './lib/share';
import { Fab } from './components/Fab';
import { BulkBar } from './components/BulkBar';
import { detectFromInput, fetchYouTubeMeta } from './lib/util';
import { unfurl, unfurlEnabled } from './lib/unfurl';
import { extractPalette, imageRatio } from './lib/color';
import { ensureFonts } from './lib/fonts';
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
  const [captureLinksOnly, setCaptureLinksOnly] = useState(false);
  const [newCollection, setNewCollection] = useState(false);
  const [newPalette, setNewPalette] = useState(false);
  const [newFont, setNewFont] = useState(false);
  const openCapture = () => {
    setCaptureLinksOnly(false);
    setCapture(true);
  };
  const openAddLink = () => {
    setCaptureLinksOnly(true);
    setCapture(true);
  };
  const [search, setSearch] = useState(false);
  const [settings, setSettings] = useState(false);
  const [resurface, setResurface] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Lock the page behind full-screen overlays so touch gestures don't scroll the
  // library underneath them (an iOS quirk that made the search/capture sheets
  // unusable on phones).
  const overlayOpen =
    capture || search || settings || resurface || shortcuts || newCollection || newPalette ||
    newFont || selected !== null;
  useEffect(() => {
    if (!overlayOpen) return;
    // Touch devices only — desktop modals don't have the scroll-through issue
    // and locking there would shift the layout when the scrollbar hides.
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;
    const main = document.querySelector('main');
    const prevMain = main?.style.overflow ?? '';
    const prevBody = document.body.style.overflow;
    if (main) main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      if (main) main.style.overflow = prevMain;
      document.body.style.overflow = prevBody;
    };
  }, [overlayOpen]);

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

  // Register every saved typeface so font tiles render in the real font.
  useEffect(() => {
    ensureFonts(items);
  }, [items]);

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
        openCapture();
      }
      // "?" opens the shortcuts cheat sheet (ignore while typing in a field).
      if (e.key === '?' && !meta) {
        const t = e.target as HTMLElement | null;
        if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
          e.preventDefault();
          setShortcuts((v) => !v);
        }
      }
      if (e.key === 'Escape') {
        setCapture(false);
        setSettings(false);
        setShortcuts(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // One-time backfill: older YouTube saves predate title/creator enrichment —
  // fetch their real title + channel once the library has hydrated.
  useEffect(() => {
    if (!hydrated) return;
    const stale = items.filter(
      (i) =>
        i.type === 'video' &&
        i.source === 'youtube.com' &&
        i.url &&
        (i.title === 'YouTube video' || !i.author),
    );
    if (!stale.length) return;
    let cancelled = false;
    (async () => {
      for (const it of stale) {
        if (cancelled) return;
        const meta = await fetchYouTubeMeta(it.url!);
        if (meta?.title && !cancelled)
          updateItem(it.id, { title: meta.title, author: meta.author ?? it.author });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Backfill rich previews for older link saves once an unfurl endpoint is set.
  useEffect(() => {
    if (!hydrated || !unfurlEnabled()) return;
    const stale = items.filter((i) => i.type === 'link' && i.url && !i.summary && !i.media);
    if (!stale.length) return;
    let cancelled = false;
    (async () => {
      for (const it of stale) {
        if (cancelled) return;
        const m = await unfurl(it.url!);
        if (!m || cancelled) continue;
        updateItem(it.id, {
          title: m.title?.trim() || it.title,
          summary: m.description?.trim() || it.summary,
          media: m.image || it.media,
          author: m.author || it.author,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Re-measure images that arrived without real dimensions/colors — e.g. saved
  // silently by the extension via sync (ratio 1 + default gray palette). Fixes
  // the aspect ratio and palette in place once the image loads.
  const measuredRef = useRef(new Set<string>());
  useEffect(() => {
    if (!hydrated) return;
    const DEFAULT = '["#3b3b3b","#9a9a9a","#e6e6e6"]';
    const pending = items.filter(
      (i) =>
        (i.type === 'image' || i.type === 'gif') &&
        i.media &&
        i.ratio === 1 &&
        JSON.stringify(i.palette) === DEFAULT &&
        !measuredRef.current.has(i.id),
    );
    pending.forEach(async (it) => {
      measuredRef.current.add(it.id);
      const r = await imageRatio(it.media!);
      if (r && r !== 1) updateItem(it.id, { ratio: r });
      const p = await extractPalette(it.media!);
      if (p.length) updateItem(it.id, { palette: p });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items]);

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
    blocked: capture || search || settings || resurface || shortcuts || selected !== null,
    isGrid: view.kind === 'library' || view.kind === 'collection' || view.kind === 'smart',
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
    (view.kind === 'collection' ||
    view.kind === 'space' ||
    view.kind === 'storyboard' ||
    view.kind === 'kit'
      ? view.id
      : view.kind === 'library'
        ? view.tab
        : view.kind === 'smart'
          ? `${view.field}:${view.value}`
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
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
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
            <LibraryView
              onOpen={open}
              onCapture={openCapture}
              onAddLink={openAddLink}
              onNewCollection={() => setNewCollection(true)}
            />
          )}
          {view.kind === 'collections' && (
            <CollectionsView onNewCollection={() => setNewCollection(true)} />
          )}
          {view.kind === 'collection' && <CollectionView onOpen={open} onAdd={openCapture} />}
          {view.kind === 'smart' && <SmartCollectionView onOpen={open} />}
          {view.kind === 'spaces' && <SpacesView />}
          {view.kind === 'space' && <SpaceCanvas />}
          {view.kind === 'storyboards' && <StoryboardsView />}
          {view.kind === 'storyboard' && <StoryboardView />}
          {view.kind === 'kits' && <KitsView />}
          {view.kind === 'kit' && <KitView />}
        </motion.div>
      </main>

      <Fab
        onClick={openCapture}
        onNewPalette={() => setNewPalette(true)}
        onNewFont={() => setNewFont(true)}
      />
      <BulkBar />
      <Toaster />

      <ItemDetail item={selected} onClose={() => setSelected(null)} onOpen={open} />
      <CaptureDialog
        open={capture}
        onClose={() => setCapture(false)}
        onFiles={addFiles}
        linksOnly={captureLinksOnly}
      />
      <CollectionDialog open={newCollection} onClose={() => setNewCollection(false)} />
      <PaletteDialog open={newPalette} onClose={() => setNewPalette(false)} />
      <FontDialog open={newFont} onClose={() => setNewFont(false)} />
      <SearchOverlay
        open={search}
        onClose={() => setSearch(false)}
        onOpenItem={open}
        dark={dark}
        actions={{
          capture: openCapture,
          settings: () => setSettings(true),
          resurface: () => setResurface(true),
          exportBackup: () => {
            exportBackup().then(() => toast('Backup downloaded'));
          },
          toggleTheme: toggle,
          newSpace: createSpace,
          shortcuts: () => setShortcuts(true),
        }}
      />
      <ResurfacePanel open={resurface} onClose={() => setResurface(false)} onOpenItem={open} />
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
      <ShortcutsModal open={shortcuts} onClose={() => setShortcuts(false)} />
      <Onboarding onCapture={openCapture} />
    </div>
  );
}

export function App() {
  // A read-only share link (`#share=…`) renders a standalone viewer — no store,
  // no private library — so anyone can open it without setup.
  const shareUrl = shareUrlFromHash();
  if (shareUrl) return <ShareViewer url={shareUrl} />;

  return (
    <ForageProvider>
      <Workspace />
    </ForageProvider>
  );
}
