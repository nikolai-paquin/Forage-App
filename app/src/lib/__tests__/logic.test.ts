import { describe, it, expect } from 'vitest';
import type { Item } from '../../types';
import { normalizeUrl, findDuplicate } from '../dedupe';
import { mergeById, mergeSnapshots, generateSyncKey, type SyncSnapshot } from '../sync';
import { cosine, hashText, itemText } from '../semantic';

function item(partial: Partial<Item> & { id: string }): Item {
  return {
    type: 'image',
    title: 'Untitled',
    ratio: 1,
    palette: ['#000000'],
    tags: [],
    projectIds: [],
    createdAt: 1000,
    lastSeenAt: 1000,
    ...partial,
  };
}

describe('normalizeUrl', () => {
  it('drops www, trailing slash, and hash', () => {
    expect(normalizeUrl('https://www.example.com/path/#frag')).toBe('https://example.com/path');
  });

  it('strips tracking params but keeps real ones', () => {
    expect(normalizeUrl('https://x.com/a?utm_source=z&b=1&fbclid=9')).toBe('https://x.com/a?b=1');
  });

  it('is case-insensitive and stable', () => {
    expect(normalizeUrl('HTTPS://Example.com/A')).toBe(normalizeUrl('https://example.com/A'));
  });

  it('returns empty for missing url', () => {
    expect(normalizeUrl(undefined)).toBe('');
  });
});

describe('findDuplicate', () => {
  const items = [
    item({ id: '1', url: 'https://example.com/post' }),
    item({ id: '2', media: 'data:image/png;base64,AAA' }),
    item({ id: '3', url: 'https://gone.com/x', deletedAt: 5 }),
  ];

  it('matches an existing url regardless of tracking params/slash', () => {
    expect(findDuplicate(items, { url: 'https://www.example.com/post/?utm_source=nl' })?.id).toBe('1');
  });

  it('matches identical media', () => {
    expect(findDuplicate(items, { media: 'data:image/png;base64,AAA' })?.id).toBe('2');
  });

  it('ignores trashed items', () => {
    expect(findDuplicate(items, { url: 'https://gone.com/x' })).toBeUndefined();
  });

  it('returns undefined when nothing matches', () => {
    expect(findDuplicate(items, { url: 'https://new.com' })).toBeUndefined();
  });
});

describe('mergeById (last-write-wins)', () => {
  it('keeps the newer updatedAt', () => {
    const local = [item({ id: 'a', title: 'old', updatedAt: 1 })];
    const remote = [item({ id: 'a', title: 'new', updatedAt: 2 })];
    expect(mergeById(local, remote).find((x) => x.id === 'a')?.title).toBe('new');
  });

  it('does not regress to an older remote', () => {
    const local = [item({ id: 'a', title: 'new', updatedAt: 5 })];
    const remote = [item({ id: 'a', title: 'old', updatedAt: 2 })];
    expect(mergeById(local, remote).find((x) => x.id === 'a')?.title).toBe('new');
  });

  it('unions ids from both sides', () => {
    const local = [item({ id: 'a' })];
    const remote = [item({ id: 'b' })];
    expect(mergeById(local, remote).map((x) => x.id).sort()).toEqual(['a', 'b']);
  });

  it('respects a delete tombstone that is newer', () => {
    const local = [item({ id: 'a', updatedAt: 1 })];
    const remote = [item({ id: 'a', updatedAt: 9, deletedAt: 9 })];
    expect(mergeById(local, remote).find((x) => x.id === 'a')?.deletedAt).toBe(9);
  });
});

describe('mergeSnapshots', () => {
  it('merges items and spaces and advances updatedAt', () => {
    const a: SyncSnapshot = { v: 1, updatedAt: 10, items: [item({ id: 'x', updatedAt: 10 })], spaces: [] };
    const b: SyncSnapshot = { v: 1, updatedAt: 20, items: [item({ id: 'y', updatedAt: 20 })], spaces: [] };
    const merged = mergeSnapshots(a, b);
    expect(merged.items.map((i) => i.id).sort()).toEqual(['x', 'y']);
    expect(merged.updatedAt).toBe(20);
  });
});

describe('generateSyncKey', () => {
  it('produces unique, well-formed keys', () => {
    const a = generateSyncKey();
    const b = generateSyncKey();
    expect(a).toMatch(/^fk_[0-9a-f]+$/);
    expect(a).not.toBe(b);
  });
});

describe('semantic math', () => {
  it('cosine of identical vectors is 1', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });

  it('cosine of orthogonal vectors is 0', () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });

  it('cosine handles zero vectors without NaN', () => {
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });

  it('hashText is deterministic and content-sensitive', () => {
    expect(hashText('hello')).toBe(hashText('hello'));
    expect(hashText('hello')).not.toBe(hashText('hello!'));
  });

  it('itemText includes title and tags', () => {
    const text = itemText(item({ id: 'a', title: 'Brutalist poster', tags: ['typography'] }));
    expect(text).toContain('Brutalist poster');
    expect(text).toContain('typography');
  });
});
