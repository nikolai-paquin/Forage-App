import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { Close, Heart, Link as LinkIcon, Sparkle } from './icons';
import { timeAgo } from '../lib/util';

function Media({ item }: { item: Item }) {
  if (item.type === 'video')
    return (
      <video
        src={item.media}
        poster={item.poster}
        controls
        autoPlay
        muted
        loop
        playsInline
        className="max-h-[68vh] w-full bg-black object-contain"
      />
    );
  if (item.type === 'code')
    return (
      <pre className="max-h-[68vh] overflow-auto bg-[#14150f] p-5 font-mono text-[12.5px] leading-relaxed text-[#cdd4b8]">
        <code>{item.code}</code>
      </pre>
    );
  if (item.type === 'vector')
    return (
      <div
        className="grid aspect-video w-full place-items-center"
        style={{ background: `linear-gradient(145deg, ${item.palette[1]}, ${item.palette[0]}22)` }}
      >
        <svg viewBox="0 0 100 100" className="h-2/5" style={{ color: item.palette[0] }}>
          <path
            d="M50 8C50 32 38 44 20 50c18 6 30 18 30 42 0-24 12-36 30-42-18-6-30-18-30-42Z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  if ((item.type === 'link' && !item.media))
    return (
      <div
        className="grid aspect-video w-full place-items-center text-white/90"
        style={{ background: `linear-gradient(150deg, ${item.palette[0]}, ${item.palette[1]})` }}
      >
        <LinkIcon width={28} height={28} />
      </div>
    );
  return <img src={item.media} alt={item.title} className="max-h-[68vh] w-full object-contain" />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</p>
      <div className="text-[13.5px] text-ink">{children}</div>
    </div>
  );
}

export function ItemDetail({
  item,
  onClose,
  onOpen,
}: {
  item: Item | null;
  onClose: () => void;
  onOpen: (i: Item) => void;
}) {
  const { items, projectById, toggleFavorite, itemById } = useForage();

  const related = item
    ? items
        .filter((i) => i.id !== item.id && i.tags.some((t) => item.tags.includes(t)))
        .slice(0, 5)
    : [];
  const sourceRef = item?.ai?.sourceRefId ? itemById(item.ai.sourceRefId) : undefined;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative grid max-h-full w-full max-w-4xl grid-rows-[auto] overflow-hidden rounded-2xl border border-border-strong bg-elevated md:grid-cols-[1.55fr_1fr]"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
            >
              <Close width={16} height={16} />
            </button>

            <div className="flex items-center justify-center overflow-hidden bg-surface-2 md:max-h-[82vh]">
              <Media item={item} />
            </div>

            <div className="flex max-h-[82vh] flex-col gap-5 overflow-auto p-5">
              <div>
                <div className="flex items-start gap-2">
                  <h2 className="flex-1 text-[18px] font-semibold leading-snug tracking-tight">
                    {item.title}
                  </h2>
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border transition ${
                      item.favorite ? 'text-accent' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Heart width={16} height={16} fill={item.favorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
                {item.source && (
                  <p className="mt-1 text-[12.5px] text-muted">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent"
                      >
                        {item.source} ↗
                      </a>
                    ) : (
                      item.source
                    )}
                    <span className="text-faint">
                      {' '}
                      · saved {timeAgo(item.createdAt)} · seen {timeAgo(item.lastSeenAt)}
                    </span>
                  </p>
                )}
              </div>

              {item.note && (
                <Row label="Note">
                  <p className="italic text-muted">“{item.note}”</p>
                </Row>
              )}

              {item.summary && (
                <Row label="AI summary">
                  <p className="leading-relaxed text-muted">{item.summary}</p>
                </Row>
              )}

              {item.ai && (
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-accent">
                    <Sparkle width={13} height={13} /> Generated asset
                  </p>
                  <p className="text-[12.5px] leading-relaxed text-ink">“{item.ai.prompt}”</p>
                  <p className="text-[12px] text-muted">model: {item.ai.model}</p>
                  {sourceRef && (
                    <button
                      onClick={() => onOpen(sourceRef)}
                      className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-surface p-1.5 pr-3 text-left transition hover:-translate-y-0.5"
                    >
                      <span
                        className="h-8 w-8 overflow-hidden rounded-md"
                        style={{ background: sourceRef.palette[1] }}
                      >
                        {sourceRef.media && (
                          <img src={sourceRef.media} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="text-[12px]">
                        <span className="block text-faint">derived from</span>
                        <span className="text-ink">{sourceRef.title}</span>
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Row label="Palette">
                  <div className="flex gap-1.5">
                    {item.palette.map((c) => (
                      <span
                        key={c}
                        className="h-6 w-6 rounded-md border border-border"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </Row>
                {item.projectIds.length > 0 && (
                  <Row label="In projects">
                    <div className="flex flex-wrap gap-1.5">
                      {item.projectIds.map((pid) => {
                        const p = projectById(pid);
                        if (!p) return null;
                        return (
                          <span
                            key={pid}
                            className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-[12px]"
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: p.color }}
                            />
                            {p.name}
                          </span>
                        );
                      })}
                    </div>
                  </Row>
                )}
              </div>

              {item.tags.length > 0 && (
                <Row label="Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-surface-2 px-2 py-0.5 text-[12px] text-muted"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </Row>
              )}

              {related.length > 0 && (
                <Row label="Related · semantic">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {related.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onOpen(r)}
                        title={r.title}
                        className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border transition hover:-translate-y-0.5"
                        style={{ background: r.palette[1] }}
                      >
                        {(r.media || r.poster) && r.type !== 'code' ? (
                          <img
                            src={r.type === 'video' ? r.poster : r.media}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            className="block h-full w-full"
                            style={{
                              background: `linear-gradient(140deg, ${r.palette[0]}, ${r.palette[1]})`,
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </Row>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
