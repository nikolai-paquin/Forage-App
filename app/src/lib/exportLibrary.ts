// Export the whole library as a downloadable folder (.zip): a master folder with
// one sub-folder per collection (plus "Unfiltered"), holding the actual asset
// files. Uploaded/pasted media is written as real files; links and remote assets
// become .url shortcuts. A full forage-backup.json sits at the root so the same
// zip can be re-imported losslessly.
import JSZip from 'jszip';
import type { Item, Project } from '../types';
import { buildBackup, importBackup, type ImportResult } from './backup';
import { itemInProject } from './util';

function safe(name: string): string {
  return (
    (name || 'untitled')
      .replace(/[/\\:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'untitled'
  );
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; ext: string } | null {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return null;
  const header = dataUrl.slice(5, comma); // after "data:"
  const mime = header.split(';')[0] || '';
  const isB64 = /;base64/i.test(header);
  const body = dataUrl.slice(comma + 1);
  let bytes: Uint8Array;
  try {
    if (isB64) {
      const bin = atob(body);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      bytes = new TextEncoder().encode(decodeURIComponent(body));
    }
  } catch {
    return null;
  }
  const ext = (mime.split('/')[1] || 'bin').split('+')[0].replace('jpeg', 'jpg');
  return { bytes, ext };
}

function writeItem(folder: JSZip, item: Item, idx: number) {
  const base = `${String(idx + 1).padStart(3, '0')}-${safe(item.title)}`;
  const media = item.type === 'video' ? item.poster : item.media || item.fontData;

  if (item.type === 'palette') {
    folder.file(`${base}.txt`, [item.title, '', ...item.palette.map((c) => c.toUpperCase())].join('\n'));
    return;
  }
  if (media && media.startsWith('data:')) {
    const d = dataUrlToBytes(media);
    if (d) {
      folder.file(`${base}.${d.ext}`, d.bytes);
      return;
    }
  }
  // Link / remote asset → an internet-shortcut file referencing the URL.
  const url = item.url || (media && !media.startsWith('data:') ? media : '');
  folder.file(`${base}.url`, `[InternetShortcut]\nURL=${url}\n`);
}

/** Build + download the library as an organized .zip. */
export async function exportLibraryZip(onProgress?: (pct: number) => void) {
  const zip = new JSZip();
  const backup = await buildBackup();
  zip.file('forage-backup.json', JSON.stringify(backup, null, 2));
  zip.file(
    'README.txt',
    'Forage library export.\n\n' +
      'Each folder is a collection; "Unfiltered" holds saves not in any collection.\n' +
      'Uploaded media is saved as real files; links and remote assets are .url shortcuts.\n' +
      'forage-backup.json restores everything if you re-import this zip into Forage.\n',
  );

  const items = (backup.idb.items as Item[]) ?? [];
  const projects = (backup.idb.projects as Project[]) ?? [];
  const root = zip.folder('Forage Library')!;

  for (const p of projects) {
    const inP = items.filter((i) => itemInProject(i, p));
    if (!inP.length) continue;
    const f = root.folder(safe(p.name))!;
    inP.forEach((it, idx) => writeItem(f, it, idx));
  }
  const unfiled = items.filter((i) => !projects.some((p) => itemInProject(i, p)));
  if (unfiled.length) {
    const f = root.folder('Unfiltered')!;
    unfiled.forEach((it, idx) => writeItem(f, it, idx));
  }

  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => onProgress?.(meta.percent),
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `forage-library-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke a tick — revoking in the same task as click() can cancel the
  // download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Import either a .json backup or a .zip library export (reads its backup json). */
export async function importLibraryFile(file: File): Promise<ImportResult> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    const entry = zip.file('forage-backup.json');
    if (!entry) throw new Error('That zip isn’t a Forage library export (no forage-backup.json).');
    const text = await entry.async('string');
    return importBackup(new File([text], 'forage-backup.json', { type: 'application/json' }));
  }
  return importBackup(file);
}
