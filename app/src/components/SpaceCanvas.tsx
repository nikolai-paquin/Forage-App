import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, SpaceDrawing, SpaceElement } from '../types';
import { uid } from '../lib/util';
import { exportMoodboardImage } from '../lib/snapshot';
import {
  ArrowLeft,
  Close,
  ImageDown,
  Image as ImageIcon,
  Maximize2,
  MousePointer2,
  MoveUpRight,
  Pencil,
  StickyNote,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from './icons';

const thumb = (i?: Item) => (i ? (i.type === 'video' ? i.poster : i.media) : undefined);

const PEN_COLORS = ['#ef4444', '#1b1c1f', '#3b82f6', '#22c55e', '#eab308'];
type Tool = 'select' | 'pen' | 'arrow';

type Pt = { x: number; y: number };
function distToSeg(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
/** Is the cursor close enough to a stroke to erase it? */
function nearDrawing(p: Pt, d: SpaceDrawing): boolean {
  const thr = Math.max(10, d.width / 1.5);
  const pts = d.points;
  if (pts.length === 1) return Math.hypot(p.x - pts[0].x, p.y - pts[0].y) <= thr;
  for (let i = 1; i < pts.length; i++) if (distToSeg(p, pts[i - 1], pts[i]) <= thr) return true;
  return false;
}

/** SVG path for a pen stroke or a line+arrowhead. */
function drawingPath(d: SpaceDrawing): string {
  if (d.kind === 'pen') return 'M ' + d.points.map((p) => `${p.x} ${p.y}`).join(' L ');
  const s = d.points[0];
  const e = d.points[d.points.length - 1];
  const ang = Math.atan2(e.y - s.y, e.x - s.x);
  const L = 16;
  const sp = 0.42;
  const a1 = { x: e.x - L * Math.cos(ang - sp), y: e.y - L * Math.sin(ang - sp) };
  const a2 = { x: e.x - L * Math.cos(ang + sp), y: e.y - L * Math.sin(ang + sp) };
  return `M ${s.x} ${s.y} L ${e.x} ${e.y} M ${a1.x} ${a1.y} L ${e.x} ${e.y} L ${a2.x} ${a2.y}`;
}

function DrawingLayer({
  drawings,
  draft,
  selectedId,
}: {
  drawings: SpaceDrawing[];
  draft: SpaceDrawing | null;
  selectedId?: string | null;
}) {
  const all = draft ? [...drawings, draft] : drawings;
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      style={{ overflow: 'visible', zIndex: 2147483000 }}
      width={1}
      height={1}
    >
      {all.map((d) => (
        <g key={d.id}>
          {selectedId === d.id && (
            <path
              d={drawingPath(d)}
              stroke="#3b82f6"
              strokeWidth={d.width + 8}
              opacity={0.35}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <path
            d={drawingPath(d)}
            stroke={d.color}
            strokeWidth={d.width}
            opacity={d.kind === 'marker' ? 0.4 : 1}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  );
}

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
    addDrawing,
    removeDrawing,
    removeLastDrawing,
    clearDrawings,
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
  const [tool, setTool] = useState<Tool>('select');
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [draft, setDraft] = useState<SpaceDrawing | null>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const drawRef = useRef<SpaceDrawing | null>(null);
  // Fresh values for the window pointer handlers without re-subscribing.
  const liveRef = useRef({ pan, zoom, spaceId, addDrawing });
  liveRef.current = { pan, zoom, spaceId, addDrawing };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      // Active pen/arrow stroke — append points in canvas coords.
      if (drawRef.current) {
        const r = containerRef.current?.getBoundingClientRect();
        if (!r) return;
        const { pan: lp, zoom: lz } = liveRef.current;
        const p = { x: (e.clientX - r.left - lp.x) / lz, y: (e.clientY - r.top - lp.y) / lz };
        const cur = drawRef.current;
        if (cur.kind === 'arrow') cur.points[1] = p;
        else cur.points.push(p);
        setDraft({ ...cur, points: [...cur.points] });
        return;
      }
      const d = drag.current;
      if (!d) return;
      if (d.type === 'pan') {
        setPan({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
      } else if (d.type === 'resize' && d.id) {
        const patch: Partial<SpaceElement> = {
          w: Math.max(80, d.ox + (e.clientX - d.sx) / zoom),
        };
        if (d.oy >= 0) patch.h = Math.max(60, d.oy + (e.clientY - d.sy) / zoom);
        updateSpaceElement(spaceId, d.id, patch);
      } else if (d.id) {
        updateSpaceElement(spaceId, d.id, {
          x: d.ox + (e.clientX - d.sx) / zoom,
          y: d.oy + (e.clientY - d.sy) / zoom,
        });
      }
    };
    const up = () => {
      if (drawRef.current) {
        const cur = drawRef.current;
        const a = cur.points[0];
        const b = cur.points[cur.points.length - 1];
        const ok =
          cur.kind === 'pen' ? cur.points.length >= 2 : a.x !== b.x || a.y !== b.y;
        if (ok) liveRef.current.addDrawing(liveRef.current.spaceId, cur);
        drawRef.current = null;
        setDraft(null);
      }
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

  // Delete / Backspace removes the selected stroke or arrow.
  useEffect(() => {
    if (!selectedDrawing) return;
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeDrawing(spaceId, selectedDrawing);
        setSelectedDrawing(null);
      }
      if (e.key === 'Escape') setSelectedDrawing(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selectedDrawing, spaceId, removeDrawing]);

  if (!space) return null;

  const nextZ = () => Math.max(0, ...space.elements.map((e) => e.z)) + 1;

  const startPan = (e: React.PointerEvent) => {
    drag.current = { type: 'pan', sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  };
  const startEl = (e: React.PointerEvent, el: SpaceElement) => {
    if (tool !== 'select') return; // let the press bubble to the canvas to draw
    e.stopPropagation();
    updateSpaceElement(spaceId, el.id, { z: nextZ() });
    drag.current = { type: 'el', id: el.id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y };
  };
  const startResize = (e: React.PointerEvent, el: SpaceElement) => {
    e.stopPropagation();
    // Notes resize in both dimensions; items keep their image aspect (width only).
    const oy = el.kind === 'note' ? (el.h ?? 120) : -1;
    drag.current = { type: 'resize', id: el.id, sx: e.clientX, sy: e.clientY, ox: el.w, oy };
  };

  // Canvas press: in select mode, click a stroke to select it (else pan);
  // otherwise begin a pen/arrow stroke.
  const onCanvasDown = (e: React.PointerEvent) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const p = { x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom };
    if (tool === 'select') {
      const hit = [...(space?.drawings ?? [])].reverse().find((d) => nearDrawing(p, d));
      if (hit) {
        setSelectedDrawing(hit.id);
        return; // select the stroke instead of panning
      }
      setSelectedDrawing(null);
      startPan(e);
      return;
    }
    const d: SpaceDrawing = {
      id: uid(),
      kind: tool,
      color: penColor,
      width: 3,
      points: tool === 'arrow' ? [p, p] : [p],
    };
    drawRef.current = d;
    setDraft(d);
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
      x: c.x - 100,
      y: c.y - 60,
      w: 200,
      h: 120,
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
          <ArrowLeft size={15} /> Moodboards
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

          {/* draw tools */}
          <div className="mx-1 flex items-center gap-0.5 rounded-lg border border-border bg-surface px-1 py-0.5">
            {(
              [
                ['select', <MousePointer2 size={15} />, 'Select & move'],
                ['pen', <Pencil size={15} />, 'Pen — draw / circle'],
                ['arrow', <MoveUpRight size={15} />, 'Arrow'],
              ] as [Tool, React.ReactNode, string][]
            ).map(([t, icon, title]) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                title={title}
                className={`grid h-7 w-7 place-items-center rounded-md transition ${
                  tool === t ? 'bg-ink text-accent-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          {tool !== 'select' && (
            <div className="flex items-center gap-1">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  title="Pen color"
                  className={`h-5 w-5 rounded-full ring-2 transition ${
                    penColor === c ? 'ring-ink' : 'ring-transparent'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
          {(space.drawings?.length ?? 0) > 0 && (
            <>
              <button
                onClick={() => removeLastDrawing(space.id)}
                title="Undo last drawing"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <Undo2 size={16} />
              </button>
              <button
                onClick={() => clearDrawings(space.id)}
                title="Clear all drawings"
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-muted transition hover:text-ink"
              >
                Clear
              </button>
            </>
          )}

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
            onClick={() => exportMoodboardImage(space, itemById)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-muted transition hover:text-ink"
            title="Export as image"
          >
            <ImageDown size={14} /> Image
          </button>
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
            title="Delete moodboard"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* canvas */}
      <div
        ref={containerRef}
        onPointerDown={onCanvasDown}
        onWheel={onWheel}
        className="relative flex-1 overflow-hidden border-t border-border bg-surface-2/40"
        style={{
          backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          cursor: tool === 'select' ? 'grab' : 'crosshair',
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
                <div
                  className="flex flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-md ring-1 ring-black/5"
                  style={{ height: el.h ?? 120 }}
                >
                  <div
                    onPointerDown={(e) => startEl(e, el)}
                    className="flex h-4 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
                  >
                    <span className="h-[3px] w-6 rounded-full bg-black/15 opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <textarea
                    value={el.text}
                    onPointerDown={(e) => {
                      if (tool === 'select') e.stopPropagation();
                    }}
                    onChange={(e) => updateSpaceElement(space.id, el.id, { text: e.target.value })}
                    placeholder="Note…"
                    readOnly={tool !== 'select'}
                    className="block w-full flex-1 cursor-text resize-none overflow-auto bg-transparent px-3 pb-3 text-[13px] text-[#1b1c1f] outline-none [user-select:text] placeholder:text-black/30"
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
          <DrawingLayer
            drawings={space.drawings ?? []}
            draft={draft}
            selectedId={tool === 'select' ? selectedDrawing : null}
          />
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
                      <div
                        key={el.id}
                        className="absolute"
                        style={{ left: el.x, top: el.y, width: el.w, height: el.h ?? 120 }}
                      >
                        <div className="h-full overflow-hidden whitespace-pre-wrap rounded-md border border-black/10 bg-white p-3 text-[13px] text-[#1b1c1f] shadow-md ring-1 ring-black/5">
                          {el.text}
                        </div>
                      </div>
                    );
                  })}
                <DrawingLayer drawings={space.drawings ?? []} draft={null} />
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
