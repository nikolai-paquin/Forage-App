import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ForageProvider, useForage } from './lib/store';
import { TopBar } from './components/TopBar';
import { LibraryView } from './components/LibraryView';
import { CollectionsView } from './components/CollectionsView';
import { CollectionView } from './components/CollectionView';
import { SpacesView } from './components/SpacesView';
import { ItemDetail } from './components/ItemDetail';
import { CaptureDialog } from './components/CaptureDialog';
import { SearchOverlay } from './components/SearchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { Fab } from './components/Fab';
import type { Item } from './types';

function Workspace() {
  const { view, markSeen } = useForage();
  const [selected, setSelected] = useState<Item | null>(null);
  const [capture, setCapture] = useState(false);
  const [search, setSearch] = useState(false);
  const [settings, setSettings] = useState(false);

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

  const open = (item: Item) => {
    setSelected(item);
    markSeen(item.id);
  };

  const viewKey =
    view.kind + (view.kind === 'collection' ? view.id : view.kind === 'library' ? view.tab : '');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
      <TopBar onSearch={() => setSearch(true)} onSettings={() => setSettings(true)} />
      <main className="min-h-0 flex-1 overflow-y-auto">
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
        </motion.div>
      </main>

      <Fab onClick={() => setCapture(true)} />

      <ItemDetail item={selected} onClose={() => setSelected(null)} onOpen={open} />
      <CaptureDialog open={capture} onClose={() => setCapture(false)} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} onOpenItem={open} />
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
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
