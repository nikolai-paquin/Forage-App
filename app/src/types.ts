// ---- Core domain model (mirrors PRD §6) ----
// Kept deliberately small: Items live in Projects; an Item can belong to many.

export type ItemType =
  | 'image'
  | 'video'
  | 'gif'
  | 'vector'
  | 'link'
  | 'code'
  | 'audio'
  | 'ai_asset';

export interface AiMeta {
  prompt: string;
  model: string;
  /** Item id of the inspiration this output was derived from (the input→output graph). */
  sourceRefId?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  /** Display/source domain for links, or tool for ai assets. */
  source?: string;
  /** Creator/author/channel, e.g. a YouTube channel name. */
  author?: string;
  url?: string;
  /** Media URL (image/video/gif/vector preview). */
  media?: string;
  /** Poster image for video tiles. */
  poster?: string;
  /** For code items. */
  code?: string;
  language?: string;
  /** Intrinsic aspect ratio (w/h) to lay out the masonry without layout shift. */
  ratio: number;
  /** Dominant palette, used for the focus glow + future color filtering. */
  palette: string[];
  tags: string[];
  /** Project ids this item belongs to. */
  projectIds: string[];
  note?: string;
  summary?: string;
  ai?: AiMeta;
  /** The save this one was made/derived from (input→output graph). */
  derivedFrom?: string;
  favorite?: boolean;
  /** ms epoch — sync-ready timestamps from day one (PRD §0). */
  createdAt: number;
  /** Last mutation time — drives last-write-wins sync merges. */
  updatedAt?: number;
  /** Powers resurfacing: how long since it was last seen. */
  lastSeenAt: number;
  /** Soft-delete timestamp; set when moved to Trash. */
  deletedAt?: number;
}

export interface Project {
  id: string;
  name: string;
  brief: string;
  color: string;
  status: 'active' | 'archived';
  /** Tags that auto-collect into this collection — any save with one is included. */
  autoTags?: string[];
}

export type LibraryTab = 'all' | 'bookmarks';

export type View =
  | { kind: 'library'; tab: LibraryTab }
  | { kind: 'collections' }
  | { kind: 'collection'; id: string }
  | { kind: 'smart'; field: 'type' | 'source'; value: string }
  | { kind: 'spaces' }
  | { kind: 'space'; id: string }
  | { kind: 'storyboards' }
  | { kind: 'storyboard'; id: string };

// ---- Spaces: freeform infinite canvas ----
export interface SpaceElement {
  id: string;
  kind: 'item' | 'note';
  itemId?: string; // for kind 'item'
  text?: string; // for kind 'note'
  color?: string; // note background
  x: number;
  y: number;
  w: number;
  h?: number; // explicit height for notes (resizable)
  z: number;
}

/** A freehand pen stroke or arrow drawn on the canvas, for annotation. */
export interface SpaceDrawing {
  id: string;
  kind: 'pen' | 'arrow';
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface Space {
  id: string;
  name: string;
  elements: SpaceElement[];
  drawings?: SpaceDrawing[];
  createdAt: number;
  /** Last mutation time — drives last-write-wins sync merges. */
  updatedAt?: number;
}

// ---- Storyboards: an ordered sequence of captioned frames ----
export interface StoryFrame {
  id: string;
  /** Optional linked save — its media is shown as the frame image. */
  itemId?: string;
  caption: string;
  notes?: string;
}

export interface Storyboard {
  id: string;
  name: string;
  frames: StoryFrame[];
  createdAt: number;
  updatedAt?: number;
}

export type TypeFilter = ItemType | 'all';

export type SortBy = 'recent' | 'oldest' | 'name' | 'type';

/** A user-managed entry in the Type or Source filter lists. */
export interface FilterEntry {
  value: string;
  label: string;
  enabled: boolean;
}

