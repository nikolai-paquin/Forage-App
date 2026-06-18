import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ForageProvider, useForage } from './lib/store';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { ContextHeader } from './components/ContextHeader';
import { MasonryGrid } from './components/MasonryGrid';
import { StoryboardView } from './components/StoryboardView';
import { ItemDetail } from './components/ItemDetail';
import { CaptureDialog } from './components/CaptureDialog';
import { CommandPalette } from './components/CommandPalette';
import { HomeView } from './components/HomeView';
import { DitherGlow } from './components/DitherGlow';
import { SoftWash } from './components/SoftWash';
import type { Item } from './types';
import { Basket, Plus } from './components/icons';

function EmptyState({ onCapture }: { onCapture: () => void }) {
  return (
    <div className="relative isolate flex flex-col items-center justify-center px-6 py-24 text-center">
      <SoftWash className="opacity-80" blur={48} />
      <DitherGlow className="left-1/2 top-10 h-64 w-64 -translate-x-1/2 opacity-40" />
      <div className="glass mb-4 grid h-16 w-16 place-items-center rounded-2xl text-accent">
        <Basket width={28} height={28} />
      </div>
      <p className="text-[15px] font-medium text-ink">Nothing here yet</p>
      <p className="mt-1 max-w-xs text-[13px] text-muted">
        Your basket is empty — go forage something. Paste a link, drop an image, or save a snippet.
      </p>
      <button
        onClick={onCapture}
        className="mt-5 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium text-accent-ink"
        style={{ background: 'var(--accent)' }}
      >
        <Plus width={16} height={16} />
        Forage something
      </button>
    </div>
  );
}

function Workspace() {
  const { visibleItems, markSeen, view, storyboardById } = useForage();
  const [selected, setSelected] = useState<Item | null>(null);
  const [capture, setCapture] = useState(false);
  const [cmdk, setCmdk] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdk((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setCapture(true);
      }
      if (e.key === 'Escape') {
        setSelected(null);
        setCapture(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const open = (item: Item) => {
    setSelected(item);
    markSeen(item.id);
  };

  return (
    <div className="relative isolate flex h-screen overflow-hidden bg-canvas text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar onCapture={() => setCapture(true)} onCommand={() => setCmdk(true)} />
        <main className="flex-1 overflow-y-auto">
          {/* re-key on view so the header + grid animate in on navigation */}
          <motion.div
            key={
              view.kind +
              (view.kind === 'project'
                ? view.projectId
                : view.kind === 'storyboard'
                  ? view.storyboardId
                  : '')
            }
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {view.kind === 'home' ? (
              <HomeView onOpen={open} onCapture={() => setCapture(true)} />
            ) : view.kind === 'storyboard' ? (
              (() => {
                const sb = storyboardById(view.storyboardId);
                return sb ? (
                  <StoryboardView storyboard={sb} />
                ) : (
                  <EmptyState onCapture={() => setCapture(true)} />
                );
              })()
            ) : (
              <>
                <ContextHeader onOpen={open} />
                <div className="px-5 pb-24">
                  {visibleItems.length === 0 ? (
                    <EmptyState onCapture={() => setCapture(true)} />
                  ) : (
                    <MasonryGrid items={visibleItems} onOpen={open} />
                  )}
                </div>
              </>
            )}
          </motion.div>
        </main>
      </div>

      <ItemDetail item={selected} onClose={() => setSelected(null)} onOpen={open} />
      <CaptureDialog open={capture} onClose={() => setCapture(false)} />
      <CommandPalette
        open={cmdk}
        onClose={() => setCmdk(false)}
        onOpenItem={open}
        onCapture={() => setCapture(true)}
      />

      {/* Global filmic grain over everything (below modals) */}
      <div className="noise grain-overlay" aria-hidden />
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
