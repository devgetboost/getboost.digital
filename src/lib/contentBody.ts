/**
 * R1C6 Wave 4 — adapter for the Clean V1 `content_localizations.body` column.
 *
 * `body` is a `jsonb` column holding block-based content, whereas the legacy
 * `blog_posts.content` column held a markdown/HTML string. This adapter reads
 * whichever shape is present so the renderer can stay shape-agnostic while the
 * content is being authored.
 *
 * Supported shapes:
 *  - a string                       → treated as rich text (HTML or markdown)
 *  - an array of blocks             → rendered block by block
 *  - `{ blocks: [...] }`            → the `blocks` array is rendered
 *  - `{ html | content | markdown | text }` → the string value is used
 *  - anything else (or null)        → no content
 */

export type ContentBlockType =
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'quote'
  | 'code'
  | 'image'
  | 'divider';

export interface ContentBlock {
  type: ContentBlockType;
  /** Paragraph/heading/quote/code body. */
  text?: string;
  /** Heading level, 1-6. */
  level?: number;
  /** List items for `type: 'list'`. */
  items?: string[];
  /** Image path or URL for `type: 'image'`. */
  src?: string;
  /** Image alt text. */
  alt?: string;
  /** Optional caption under an image. */
  caption?: string;
}

export type BodySegment =
  | { kind: 'rich-text'; text: string }
  | { kind: 'blocks'; blocks: ContentBlock[] };

const BLOCK_TYPES: readonly ContentBlockType[] = [
  'paragraph',
  'heading',
  'list',
  'quote',
  'code',
  'image',
  'divider',
];

const STRING_KEYS = ['html', 'content', 'markdown', 'text', 'body'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeBlock(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.type === 'string' && BLOCK_TYPES.includes(value.type as ContentBlockType);
}

/** Best-effort normalisation of one JSON value into a block. */
function toBlock(value: unknown): ContentBlock | null {
  if (!looksLikeBlock(value)) return null;
  const raw = value;
  const type = raw.type as ContentBlockType;
  const block: ContentBlock = { type };
  if (typeof raw.text === 'string') block.text = raw.text;
  if (typeof raw.level === 'number') block.level = raw.level;
  if (Array.isArray(raw.items)) block.items = raw.items.map((i) => String(i));
  if (typeof raw.src === 'string') block.src = raw.src;
  if (typeof raw.alt === 'string') block.alt = raw.alt;
  if (typeof raw.caption === 'string') block.caption = raw.caption;
  return block;
}

/**
 * Converts a `body` value into renderable segments.
 *
 * Returns an empty array for null/empty/unknown shapes, so a page renders its
 * empty state instead of throwing.
 */
export function parseContentBody(body: unknown): BodySegment[] {
  if (typeof body === 'string') {
    return body.trim().length > 0 ? [{ kind: 'rich-text', text: body }] : [];
  }

  if (Array.isArray(body)) {
    const blocks = body.map(toBlock).filter((b): b is ContentBlock => b !== null);
    return blocks.length > 0 ? [{ kind: 'blocks', blocks }] : [];
  }

  if (isRecord(body)) {
    if (Array.isArray(body.blocks)) {
      const blocks = body.blocks.map(toBlock).filter((b): b is ContentBlock => b !== null);
      return blocks.length > 0 ? [{ kind: 'blocks', blocks }] : [];
    }
    for (const key of STRING_KEYS) {
      const value = body[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return [{ kind: 'rich-text', text: value }];
      }
    }
  }

  return [];
}

/** Convenience: the concatenated plain text of a body, for search/excerpts. */
export function contentBodyToText(body: unknown): string {
  const segments = parseContentBody(body);
  const parts: string[] = [];
  for (const segment of segments) {
    if (segment.kind === 'rich-text') {
      parts.push(segment.text.replace(/<[^>]*>/g, ' '));
    } else {
      for (const block of segment.blocks) {
        if (block.text) parts.push(block.text);
        if (block.items) parts.push(block.items.join(' '));
      }
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
