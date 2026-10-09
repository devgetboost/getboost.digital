import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PRIVATE_ASSETS_BUCKET,
  PUBLIC_MEDIA_BUCKET,
  RETIRED_BUCKETS,
  publicMediaUrl,
  signPrivateUrl,
} from '@/lib/storage';

/**
 * R1C9 Wave 7 — storage migration gate.
 *
 * Clean V1 recognises exactly two buckets: `public-media` (anonymous reads)
 * and `private-assets` (admin-only). The retired buckets
 * (`avatars`, `blog-images`, `hero-banners`, `podcast-audio`, `whatsapp-media`)
 * must not appear in any active code path.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

describe('authoritative buckets', () => {
  it('declares exactly the two Clean V1 buckets', () => {
    expect(PUBLIC_MEDIA_BUCKET).toBe('public-media');
    expect(PRIVATE_ASSETS_BUCKET).toBe('private-assets');
  });

  it('names every retired bucket so tests can assert their absence', () => {
    expect([...RETIRED_BUCKETS].sort()).toEqual(
      ['avatars', 'blog-images', 'hero-banners', 'podcast-audio', 'whatsapp-media'].sort(),
    );
  });
});

describe('no retired bucket in active code', () => {
  /** Files that may name a retired bucket, with the reason. */
  const ALLOWED: Record<string, string> = {
    // The boundary itself names them to assert their absence.
    'src/lib/storage.ts': 'declares RETIRED_BUCKETS',
    // The gate below names them to scan for them.
    'src/tests/storage.test.ts': 'asserts absence',
  };

  const sources = (() => {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
    const root = process.cwd();
    const out: string[] = [];
    const walk = (rel: string) => {
      for (const entry of readdirSync(join(root, rel))) {
        const full = `${rel}/${entry}`;
        if (statSync(join(root, full)).isDirectory()) {
          if (entry !== 'node_modules') walk(full);
        } else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
      }
    };
    walk('src');
    return out;
  })();

  for (const bucket of RETIRED_BUCKETS) {
    it(`no source references the retired ${bucket} bucket`, () => {
      // Only storage-API usage counts: route slugs (`hero-banners`), cache
      // keys and prose may legitimately contain the same words.
      const pattern = new RegExp(
        `(storage\\.from\\(['"]${bucket}['"]\\)|storage/v1/[^'"]*${bucket}|\\.from\\(['"]${bucket}['"]\\)\\s*\\.\\s*(upload|download|getPublicUrl|createSignedUrl|createSignedUploadUrl|remove|list|move|copy))`,
      );
      const offenders = sources
        .filter((f) => !(f in ALLOWED))
        .filter((f) => pattern.test(stripComments(read(f))));
      expect(offenders, `retired bucket in: ${offenders.join(', ')}`).toEqual([]);
    });
  }

  it('documents every exception', () => {
    for (const [file, reason] of Object.entries(ALLOWED)) {
      expect(reason.length).toBeGreaterThan(0);
      expect(read(file)).toBeTruthy();
    }
  });
});

describe('public URL resolution', () => {
  it('passes absolute URLs through so pre-migration rows render', () => {
    const url = 'https://example.test/old-bucket/image.jpg';
    expect(publicMediaUrl(url)).toBe(url);
  });

  it('returns null for missing paths', () => {
    expect(publicMediaUrl(null)).toBeNull();
    expect(publicMediaUrl(undefined)).toBeNull();
    expect(publicMediaUrl('')).toBeNull();
  });
});

describe('single storage boundary', () => {
  it('routes uploads through the shared module', () => {
    const storage = stripComments(read('src/lib/storage.ts'));
    expect(storage).toContain('export async function uploadObject');
    expect(storage).toContain('export async function uploadPublicImage');
    expect(storage).toContain('export async function signPrivateUrl');
    expect(storage).toContain('export async function removePrivateObjects');
  });

  it('keeps admin uploads on the shared uploader', () => {
    const admin = stripComments(read('src/lib/adminContent.ts'));
    expect(admin).toContain("from './storage'");
    expect(admin).not.toMatch(/\.storage\.from\(/);
  });

  it('resolves content media through the shared boundary', () => {
    const api = stripComments(read('src/lib/contentApi.ts'));
    expect(api).toContain("from './storage'");
  });

  it('resolves avatars through the shared boundary', () => {
    const profiles = stripComments(read('src/auth/profiles.ts'));
    expect(profiles).toContain("from '@/lib/storage'");
    expect(profiles).not.toMatch(/\.storage\.from\(/);
  });
});

describe('signed URLs stay private', () => {
  it('signs private objects from the private bucket', () => {
    const storage = read('src/lib/storage.ts');
    expect(storage).toContain('PRIVATE_ASSETS_BUCKET).createSignedUrl');
  });

  it('keeps the WhatsApp media flow on signed URLs', () => {
    const send = stripComments(read('src/pages/admin/whatsapp/WhatsAppSend.tsx'));
    expect(send).toContain('createSignedUrl');
    expect(send).toContain('private-assets');
  });
});
