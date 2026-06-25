import { useEffect, useState } from 'react';
import { fetchShareByUrl, type SharePayload, type SharedItem } from '../lib/share';
import { ensureFont, fontStack } from '../lib/fonts';
import { copyHex } from '../lib/util';
import { Loader2 } from './icons';
import { ForageMark } from './ForageMark';
import { Toaster } from './Toaster';

const thumb = (i: SharedItem) => (i.type === 'video' ? i.poster : i.media);

function ShareTile({ item }: { item: SharedItem }) {
  useEffect(() => {
    if (item.type === 'font') ensureFont(item);
  }, [item]);

  const inner = () => {
    if (item.type === 'palette') {
      const colors = item.palette.length ? item.palette : ['#e6e6e6'];
      return (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex h-28">
            {colors.map((c, i) => (
              <button
                key={i}
                onClick={() => copyHex(c)}
                title={`${c.toUpperCase()} — click to copy`}
                className="flex-1 transition-[flex] hover:flex-[1.4]"
                style={{ background: c }}
              />
            ))}
          </div>
          <p className="bg-surface px-3 py-2 text-[12.5px] font-medium text-ink">{item.title}</p>
        </div>
      );
    }
    if (item.type === 'font') {
      return (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="grid place-items-center py-6 text-[48px] text-ink" style={{ fontFamily: fontStack(item.fontFamily) }}>
            Ag
          </div>
          <div className="border-t border-border px-3 py-2">
            <p className="truncate text-[12.5px] font-medium text-ink">{item.title}</p>
            <p className="truncate text-[13px] text-muted" style={{ fontFamily: fontStack(item.fontFamily) }}>
              {item.sample || 'The quick brown fox'}
            </p>
          </div>
        </div>
      );
    }
    if (thumb(item)) {
      return (
        <img
          src={thumb(item)}
          alt={item.title}
          loading="lazy"
          className="w-full rounded-lg border border-border object-cover"
        />
      );
    }
    // link / code / audio fallback card
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="truncate text-[13.5px] font-medium text-ink">{item.title}</p>
        {item.source && <p className="mt-1 truncate text-[12px] text-muted">{item.source}</p>}
        {item.summary && <p className="mt-2 line-clamp-3 text-[12.5px] text-muted">{item.summary}</p>}
      </div>
    );
  };

  const body = <div className="mb-3 break-inside-avoid">{inner()}</div>;
  return item.url ? (
    <a href={item.url} target="_blank" rel="noreferrer" className="block">
      {body}
    </a>
  ) : (
    body
  );
}

export function ShareViewer({ url }: { url: string }) {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [data, setData] = useState<SharePayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShareByUrl(url)
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setState('error');
          return;
        }
        setData(d);
        setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] text-accent-ink" style={{ background: 'var(--ink)' }}>
            <ForageMark size={18} />
          </span>
          <span className="text-[16px] font-bold tracking-tight">Forage</span>
        </div>
        <a
          href={location.pathname}
          className="rounded-full border border-border px-3.5 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
        >
          Open Forage
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {state === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-32 text-muted">
            <Loader2 size={18} className="animate-spin" /> Loading shared collection…
          </div>
        )}
        {state === 'error' && (
          <div className="py-32 text-center text-muted">
            <p className="text-[16px] font-medium text-ink">This share isn’t available</p>
            <p className="mt-1.5 text-[13.5px]">The link may have expired or been removed.</p>
          </div>
        )}
        {state === 'ready' && data && (
          <>
            <div className="mb-7">
              <h1 className="text-[28px] font-semibold tracking-tight">{data.title}</h1>
              {data.brief && <p className="mt-1.5 max-w-2xl text-[14px] text-muted">{data.brief}</p>}
              <p className="mt-1 text-[12.5px] text-faint">
                {data.items.length} saves · shared {new Date(data.exportedAt).toLocaleDateString()} ·
                read-only
              </p>
            </div>
            <div className="[column-fill:_balance] gap-3 [columns:1] sm:[columns:2] lg:[columns:3] xl:[columns:4]">
              {data.items.map((it) => (
                <ShareTile key={it.id} item={it} />
              ))}
            </div>
          </>
        )}
      </main>
      <Toaster />
    </div>
  );
}
