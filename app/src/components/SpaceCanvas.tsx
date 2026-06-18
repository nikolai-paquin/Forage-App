import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, SpaceElement } from '../types';
import { uid } from '../lib/util';
import { ArrowLeft, Close, Image as ImageIcon, Maximize2, StickyNote, Trash2, ZoomIn, ZoomOut } from './icons';

const thumb = (i?: Item) => (i ? (i.type === 'video' ? i.poster : i.media) : undefined);
const NOTE_COLORS = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff'];

interface DragState {
  type: 'pan' | 'el' | 'resize';
  id?: string;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
}

export function SpaceCanvas() {
  const {
    view,
    spaceById,
    items,
    itemById,
    addSpaceElement,
    updateSpaceElement,
    removeSpaceElement,
    renameSpace,
    deleteSpace,
    setView,
  } = useForage();

  const spaceId = view.kind === 'space' ? view.id : '';
  const space = spaceById(spaceId);

  const [pan, setPan] = useState({ x: 120, y: 120 });
  const [zoom, setZoom] = useState(1);
  const [picker, setPicker] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (d.type === 'pan') {
        setPan({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
      } else if (d.type === 'resize' && d.id) {
        updateSpaceElement(spaceId, d.id, {
          w: Math.max(80, d.ox + (e.clientX - d.sx) / zoom),
        });
      } else if (d.id) {
        updateSpaceElement(spaceId, d.id, {
          x: d.ox + (e.clientX - d.sx) / zoom,
          y: d.oy + (e.clientY - d.sy) / zoom,
        });
      }
    };
    const up = () => {
      drag.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [spaceId, zoom, updateSpaceElement]);

  useEffect(() => {
    if (!presenting) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setPresenting(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [presenting]);

  if (!space) return null;

  const nextZ = () => Math.max(0, ...space.elements.map((e) => e.z)) + 1;

  const startPan = (e: React.PointerEvent) => {
    drag.current = { type: 'pan', sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  };
  const startEl = (e: React.PointerEvent, el: SpaceElement) => {
    e.stopPropagation();
    updateSpaceElement(spaceId, el.id, { z: nextZ() });
    drag.current = { type: 'el', id: el.id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y };
  };
  const startResize = (e: React.PointerEvent, el: SpaceElement) => {
    e.stopPropagation();
    drag.current = { type: 'resize', id: el.id, sx: e.clientX, sy: e.clientY, ox: el.w, oy: 0 };
  };

  // Fit-to-content transform for present mode.
  const fitView = () => {
    const el = containerRef.current;
    const vw = el?.clientWidth ?? window.innerWidth;
    const vh = (el?.clientHeight ?? window.innerHeight) || window.innerHeight;
    if (space.elements.length === 0) return { x: vw / 2, y: vh / 2, z: 1 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e2 of space.elements) {
      minX = Math.min(minX, e2.x);
      minY = Math.min(minY, e2.y);
      maxX = Math.max(maxX, e2.x + e2.w);
      maxY = Math.max(maxY, e2.y + e2.w * 0.85);
    }
    const cw = maxX - minX || 1;
    const ch = maxY - minY || 1;
    const z = Math.min((vw * 0.85) / cw, (vh * 0.85) / ch, 1.5);
    return { x: vw / 2 - (minX + cw / 2) * z, y: vh / 2 - (minY + ch / 2) * z, z };
  };

  const centerCoord = () => {
    const el = containerRef.current;
    const w = el?.clientWidth ?? 900;
    const h = el?.clientHeight ?? 600;
    return { x: (w / 2 - pan.x) / zoom, y: (h / 2 - pan.y) / zoom };
  };
  const addItemEl = (itemId: string) => {
    const c = centerCoord();
    addSpaceElement(spaceId, { id: uid(), kind: 'item', itemId, x: c.x - 110, y: c.y - 80, w: 220, z: nextZ() });
  };
  const addNote = () => {
    const c = centerCoord();
    addSpaceElement(spaceId, {
      id: uid(),
      kind: 'note',
      text: '',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      x: c.x - 90,
      y: c.y - 60,
      w: 180,
      z: nextZ(),
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    const factor = 1 - e.deltaY * 0.0012;
    setZoom((z) => Math.min(3, Math.max(0.25, z * factor)));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* toolbar */}
      <div className="flex items-center gap-3 px-5 pb-3">
        <button
          onClick={() => setView({ kind: 'spaces' })}
          className="flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
        >
          <ArrowLeft size={15} /> Spaces
        </button>
        <input
          value={space.name}
          onChange={(e) => renameSpace(space.id, e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[17px] font-semibold tracking-tight text-ink outline-none"
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPicker(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-muted transition hover:text-ink"
          >
            <ImageIcon size={14} /> Add save
          </button>
          <button
            onClick={addNote}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-muted transition hover:text-ink"
          >
            <StickyNote size={14} /> Note
          </button>
          <div className="mx-1 flex items-center gap-0.5 rounded-lg border border-border bg-surface px-1 py-0.5">
            <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-ink">
              <ZoomOut size={15} />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 120, y: 120 }); }} className="px-1 text-[12px] tabular-nums text-muted hover:text-ink">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-ink">
              <ZoomIn size={15} />
            </button>
          </div>
          <button
            onClick={() => setPresenting(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-muted transition hover:text-ink"
            title="Present full-screen"
          >
            <Maximize2 size={14} /> Present
          </button>
          <button
            onClick={() => deleteSpace(space.id)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-red-500"
            title="Delete space"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* canvas */}
      <div
        ref={containerRef}
        onPointerDown={startPan}
        onWheel={onWheel}
        className="relative flex-1 overflow-hidden border-t border-border bg-surface-2/40"
        style={{
          backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          cursor: 'grab',
        }}
      >
        {space.elements.length === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="text-[14px] text-faint">Add saves or notes — drag to arrange, scroll to zoom.</p>
          </div>
        )}
        <div
          className="absolute left-0 top-0"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          {space.elements.map((el) => {
            if (el.kind === 'item') {
              const it = itemById(el.itemId!);
              const src = thumb(it);
              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => startEl(e, el)}
                  className="group absolute cursor-grab active:cursor-grabbing"
                  style={{ left: el.x, top: el.y, width: el.w, zIndex: el.z }}
                >
                  <div className="overflow-hidden rounded-lg bg-surface shadow-xl ring-1 ring-black/5">
                    {src ? (
                      <img src={src} alt="" draggable={false} className="block w-full" />
                    ) : (
                      <div className="grid h-32 place-items-center bg-surface-2 text-[12px] text-faint">
                        {it?.title ?? 'Missing'}
                      </div>
                    )}
                  </div>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => removeSpaceElement(space.id, el.id)}
                    className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full bg-[#1b1c1f] text-white shadow-lg group-hover:grid"
                  >
                    <Close size={13} />
                  </button>
                  <span
                    onPointerDown={(e) => startResize(e, el)}
                    className="absolute -bottom-1.5 -right-1.5 hidden h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-[#1b1c1f] bg-white group-hover:block"
                  />
                </div>
              );
            }
            return (
              <div
                key={el.id}
                className="group absolute"
                style={{ left: el.x, top: el.y, width: el.w, zIndex: el.z }}
              >
                <div className="overflow-hidden rounded-lg shadow-xl" style={{ background: el.color }}>
                  <div
                    onPointerDown={(e) => startEl(e, el)}
                    className="h-5 cursor-grab active:cursor-grabbing"
                    style={{ background: 'rgba(0,0,0,0.06)' }}
                  />
                  <textarea
                    value={el.text}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => updateSpaceElement(space.id, el.id, { text: e.target.value })}
                    placeholder="Note…"
                    className="block w-full resize-none bg-transparent p-2.5 text-[13px] text-[#1b1c1f] outline-none placeholder:text-black/30"
                    rows={3}
                  />
                </div>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeSpaceElement(space.id, el.id)}
                  className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full bg-[#1b1c1f] text-white shadow-lg group-hover:grid"
                >
                  <Close size={13} />
                </button>
                <span
                  onPointerDown={(e) => startResize(e, el)}
                  className="absolute -bottom-1.5 -right-1.5 hidden h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-[#1b1c1f] bg-white group-hover:block"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* present mode */}
      {presenting &&
        (() => {
          const f = fitView();
          return (
            <div className="fixed inset-0 z-[55] overflow-hidden bg-canvas">
              <button
                onClick={() => setPresenting(false)}
                className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted shadow-lg transition hover:text-ink"
                title="Exit (Esc)"
              >
                <Close size={18} />
              </button>
              <div
                className="absolute left-0 top-0"
                style={{ transform: `translate(${f.x}px, ${f.y}px) scale(${f.z})`, transformOrigin: '0 0' }}
              >
                {[...space.elements]
                  .sort((a, b) => a.z - b.z)
                  .map((el) => {
                    if (el.kind === 'item') {
                      const it = itemById(el.itemId!);
                      const src = thumb(it);
                      return (
                        <div key={el.id} className="absolute" style={{ left: el.x, top: el.y, width: el.w }}>
                          <div className="overflow-hidden rounded-lg bg-surface shadow-xl ring-1 ring-black/5">
                            {src ? (
                              <img src={src} alt="" draggable={false} className="block w-full" />
                            ) : (
                              <div className="grid h-32 place-items-center bg-surface-2 text-[12px] text-faint">
                                {it?.title ?? 'Missing'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={el.id} className="absolute" style={{ left: el.x, top: el.y, width: el.w }}>
                        <div className="overflow-hidden rounded-lg p-2.5 text-[13px] text-[#1b1c1f] shadow-xl" style={{ background: el.color }}>
                          {el.text}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })()}

      {/* picker */}
      <AnimatePresence>
        {picker && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setPicker(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative max-h-[72vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-elevated"
              style={{ boxShadow: 'var(--shadow-pop)' }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-[14px] font-semibold">Add a save to the canvas</p>
                <button onClick={() => setPicker(false)} className="text-muted hover:text-ink">
                  <Close size={16} />
                </button>
              </div>
              <div className="grid max-h-[60vh] grid-cols-3 gap-2.5 overflow-auto p-4 sm:grid-cols-4">
                {items
                  .filter((i) => !i.deletedAt)
                  .map((i) => (
                    <button
                      key={i.id}
                      onClick={() => {
                        addItemEl(i.id);
                        setPicker(false);
                      }}
                      title={i.title}
                      className="aspect-square overflow-hidden rounded-lg border border-border bg-surface-2 transition hover:-translate-y-0.5"
                    >
                      {thumb(i) ? (
                        <img src={thumb(i)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full place-items-center text-[10px] text-faint">{i.title}</span>
                      )}
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
