// ---- Core domain model (mirrors PRD §6) ----
// Kept deliberately small: Items live in Projects; an Item can belong to many.

export type ItemType =
  | 'image'
  | 'video'
  | 'gif'
  | 'vector'
  | 'link'
  | 'code'
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
  favorite?: boolean;
  /** ms epoch — sync-ready timestamps from day one (PRD §0). */
  createdAt: number;
  /** Powers resurfacing: how long since it was last seen. */
  lastSeenAt: number;
}

export interface Project {
  id: string;
  name: string;
  brief: string;
  color: string;
  status: 'active' | 'archived';
}

export type View =
  | { kind: 'home' }
  | { kind: 'library' }
  | { kind: 'basket' }
  | { kind: 'project'; projectId: string }
  | { kind: 'storyboard'; storyboardId: string };

export type TypeFilter = ItemType | 'all';

// ---- Storyboard (PRD §8.4) ----
// An ordered sequence of frames built from Items, for AI video & sequenced design work.

export interface Frame {
  id: string;
  /** The Item this frame shows (image/video/ai_asset). */
  itemId: string;
  /** Short direction for the shot, e.g. "wide, dawn" or "push-in". */
  beat: string;
  /** How this frame moves to the next. */
  transition?: string;
}

export interface Storyboard {
  id: string;
  projectId: string;
  title: string;
  frames: Frame[];
}
