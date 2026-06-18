export const uid = () =>
  's_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

/** Guess an item type + a friendly title from pasted text (the smart-paste demo). */
export function detectFromInput(raw: string): {
  type: 'link' | 'image' | 'gif' | 'code';
  title: string;
  source?: string;
} {
  const text = raw.trim();
  const isUrl = /^https?:\/\//i.test(text);
  if (isUrl) {
    let host = '';
    try {
      host = new URL(text).hostname.replace(/^www\./, '');
    } catch {
      host = 'link';
    }
    if (/\.(png|jpe?g|webp|avif)(\?|$)/i.test(text))
      return { type: 'image', title: 'Pasted image', source: host };
    if (/\.gif(\?|$)/i.test(text)) return { type: 'gif', title: 'Pasted GIF', source: host };
    return { type: 'link', title: host, source: host };
  }
  if (/[{};=>]|function |const |=>/.test(text) && text.length > 12)
    return { type: 'code', title: 'Pasted snippet', source: 'paste' };
  return { type: 'link', title: text.slice(0, 60) || 'Untitled', source: 'note' };
}
