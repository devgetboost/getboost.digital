/**
 * R1C9 Wave 7 — the single storage boundary.
 *
 * Clean V1 recognises exactly two buckets:
 *  - `public-media`   — anonymously readable. Website imagery, case-study
 *                       heroes, product logos, episode audio, hero banners.
 *  - `private-assets` — admin-only. Anything that must never be public
 *                       (WhatsApp media, internal documents).
 *
 * Every upload, public URL and signed URL in the application goes through this
 * module so a bucket rename is one edit, and so the retired buckets
 * (`avatars`, `blog-images`, `hero-banners`, `podcast-audio`, `whatsapp-media`)
 * cannot creep back in: they appear nowhere outside comments and tests.
 *
 * Clean V1 stores object *paths*, not URLs. Callers persist the path and
 * resolve a display URL with `publicMediaUrl()` at render time — except
 * WhatsApp media, whose rows keep a signed URL by design (see below).
 */

import { supabase } from '@/integrations/supabase/client';

/** The Clean V1 public bucket. */
export const PUBLIC_MEDIA_BUCKET = 'public-media' as const;

/** The Clean V1 private bucket. */
export const PRIVATE_ASSETS_BUCKET = 'private-assets' as const;

export type StorageBucket = typeof PUBLIC_MEDIA_BUCKET | typeof PRIVATE_ASSETS_BUCKET;

/** Buckets retired by Clean V1. Named here so tests can assert their absence. */
export const RETIRED_BUCKETS = [
  'avatars',
  'blog-images',
  'hero-banners',
  'podcast-audio',
  'whatsapp-media',
] as const;

export class StorageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageUploadError';
  }
}

function assertImage(file: File, maxBytes = 5 * 1024 * 1024): void {
  if (!file.type.startsWith('image/')) {
    throw new StorageUploadError('Selecione um ficheiro de imagem.');
  }
  if (file.size > maxBytes) {
    throw new StorageUploadError('A imagem não pode exceder 5MB.');
  }
}

function objectPath(folder: string, file: File): string {
  const ext = file.name.split('.').pop() || 'bin';
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/**
 * Uploads a file and returns its object path.
 *
 * The path — never a URL — is what callers persist. Display URLs are resolved
 * at render time so a future bucket move does not orphan stored rows.
 */
export async function uploadObject(
  bucket: StorageBucket,
  folder: string,
  file: File,
  options: { contentType?: string; upsert?: boolean; maxBytes?: number } = {},
): Promise<string> {
  if (options.maxBytes !== undefined && file.size > options.maxBytes) {
    throw new StorageUploadError('Ficheiro demasiado grande.');
  }
  const path = objectPath(folder, file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: options.upsert ?? false,
    ...(options.contentType ? { contentType: options.contentType } : {}),
  });
  if (error) throw new StorageUploadError('Erro ao carregar: ' + error.message);
  return path;
}

/** Uploads an image to the public bucket and returns its object path. */
export async function uploadPublicImage(folder: string, file: File): Promise<string> {
  assertImage(file);
  return uploadObject(PUBLIC_MEDIA_BUCKET, folder, file);
}

/**
 * Resolves a stored path (or absolute URL) to a displayable URL.
 *
 * Absolute URLs pass through untouched so rows written before the migration
 * keep rendering. Anything else is resolved against `public-media`.
 */
export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//i.test(path)) return path;
  const { data } = supabase.storage.from(PUBLIC_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl || null;
}

/**
 * A time-limited URL for a private object.
 *
 * Used by WhatsApp media, whose rows store the signed URL itself: the link is
 * handed to external clients (Meta's servers fetch it), so it must be
 * self-contained rather than resolvable at render time.
 */
export async function signPrivateUrl(path: string, expiresInSeconds: number): Promise<string | null> {
  const { data } = await supabase.storage.from(PRIVATE_ASSETS_BUCKET).createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? null;
}

/** Removes private objects. Returns true when storage confirmed the removal. */
export async function removePrivateObjects(paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true;
  const { error } = await supabase.storage.from(PRIVATE_ASSETS_BUCKET).remove(paths);
  return !error;
}
