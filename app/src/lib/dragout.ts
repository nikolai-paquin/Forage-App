// Drag a save's media out of Forage as a real file — to the desktop/Finder or
// into a native app — instead of dropping a giant base64 data-URL as text.
//
// The trick: on dragstart we decode the data URL into a Blob (synchronously),
// hand the OS a downloadable file via the Chromium `DownloadURL` data type, and
// deliberately set text/plain to just the title (never the data URL) so targets
// that only read text get a label, not a wall of base64. The item stays put —
// this only copies the file out.
import type { Item } from '../types';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', bmp: 'image/bmp',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
};

function safe(name: string): string {
  return (
    (name || 'forage').replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80) ||
    'forage'
  );
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string; ext: string } | null {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return null;
  const header = dataUrl.slice(5, comma); // after "data:"
  const mime = header.split(';')[0] || 'application/octet-stream';
  const isB64 = /;base64/i.test(header);
  const body = dataUrl.slice(comma + 1);
  try {
    let bytes: Uint8Array;
    if (isB64) {
      const bin = atob(body);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      bytes = new TextEncoder().encode(decodeURIComponent(body));
    }
    const ext = (mime.split('/')[1] || 'bin').split('+')[0].replace('jpeg', 'jpg');
    return { blob: new Blob([bytes.buffer as ArrayBuffer], { type: mime }), mime, ext };
  } catch {
    return null;
  }
}

/** The file URL/poster to drag out for a given save, or undefined if it has none. */
export function dragMediaUrl(item: Item): string | undefined {
  if (item.type === 'video') return item.media || item.poster;
  if (item.type === 'vector' || item.type === 'palette' || item.type === 'font' ||
      item.type === 'code' || item.type === 'link' || item.type === 'audio') {
    // No standalone media file to hand out for these (they're rendered art / links).
    return item.type === 'audio' ? item.media : undefined;
  }
  return item.media; // image, gif, ai_asset
}

/** True when this save can be dragged out as a file. */
export function canDragOut(item: Item): boolean {
  return !!dragMediaUrl(item);
}

/** Wire a real-file drag onto a dragstart event. Returns true if it set anything. */
export function startMediaDrag(e: React.DragEvent, item: Item): boolean {
  const media = dragMediaUrl(item);
  if (!media || !e.dataTransfer) return false;

  let url = media;
  let mime = '';
  let ext = '';
  let revoke: string | null = null;

  if (media.startsWith('data:')) {
    const d = dataUrlToBlob(media);
    if (!d) return false;
    url = URL.createObjectURL(d.blob);
    revoke = url;
    mime = d.mime;
    ext = d.ext;
  } else {
    try {
      url = new URL(media, location.href).href; // absolute — required for DownloadURL
    } catch {
      url = media;
    }
    const m = url.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i);
    ext = m ? m[1].toLowerCase() : '';
    mime = MIME[ext] || (item.type === 'video' ? 'video/mp4' : 'image/jpeg');
  }

  const filename = `${safe(item.title)}${ext ? '.' + ext : ''}`;
  try {
    const dt = e.dataTransfer;
    dt.effectAllowed = 'copy';
    // Chromium: makes this draggable to Finder/desktop and into native apps as a file.
    dt.setData('DownloadURL', `${mime}:${filename}:${url}`);
    dt.setData('text/uri-list', url);
    dt.setData('text/plain', item.title); // a label, NOT the data URL
  } catch {
    /* some targets lock dataTransfer — ignore */
  }

  if (revoke) {
    const u = revoke;
    const cleanup = () => {
      // keep the blob alive long enough for the OS to finish copying
      setTimeout(() => URL.revokeObjectURL(u), 60_000);
      window.removeEventListener('dragend', cleanup, true);
    };
    window.addEventListener('dragend', cleanup, true);
  }
  return true;
}
