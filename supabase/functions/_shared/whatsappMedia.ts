import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const WA_MEDIA_BUCKET = "whatsapp-media";
const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Extract the storage object path from a Supabase Storage URL pointing at the
 * whatsapp-media bucket. Returns null if the URL is not a whatsapp-media URL.
 */
export function extractWhatsAppMediaPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /\/storage\/v1\/object\/(?:public|sign)\/whatsapp-media\/([^?]+)/,
  );
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/**
 * Create a fresh signed URL for a path inside the whatsapp-media bucket.
 */
export async function signWhatsAppMediaPath(
  supabase: SupabaseClient,
  path: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(WA_MEDIA_BUCKET)
    .createSignedUrl(path, ttlSeconds);
  if (error || !data) {
    console.error("[whatsappMedia] failed to sign path", path, error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Resolve any URL to a short-lived signed URL when it references the
 * whatsapp-media bucket. Non-matching URLs are returned unchanged so callers
 * can pass through third-party links safely.
 */
export async function resolveWhatsAppMediaUrl(
  supabase: SupabaseClient,
  url: string | null | undefined,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string | null> {
  if (!url) return null;
  const path = extractWhatsAppMediaPath(url);
  if (!path) return url;
  const signed = await signWhatsAppMediaPath(supabase, path, ttlSeconds);
  return signed ?? url;
}

/**
 * Derive a reasonable filename from a (possibly signed) URL, stripping query
 * strings so the token isn't included.
 */
export function filenameFromMediaUrl(url: string | null | undefined, fallback = "file"): string {
  if (!url) return fallback;
  return url.split("?")[0].split("/").pop() || fallback;
}
