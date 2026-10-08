import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AUTHORITATIVE_ROLES,
  RETIRED_ROLES,
  ROLE_HOME_ROUTE,
  ROLE_LABELS,
  hasAnyAuthoritativeRole,
  isRetiredRole,
  resolveLandingRoute,
  type AppRole,
} from '@/auth/roles';
import { ROLES } from '@/config/env';

/**
 * R1C4 Wave 2 — role model contract.
 *
 * `user` and `moderator` are retired. They are not aliases of anything: the
 * Clean V1 CHECK constraint rejects them, and every consumer must ignore them
 * rather than map them onto a Clean V1 role.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/** Strips comments so assertions test code, not prose. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/** Application sources that must not treat a retired role as authoritative. */
const AUTH_SOURCES = [
  'src/auth/roles.ts',
  'src/auth/AuthProvider.tsx',
  'src/auth/guards.tsx',
  'src/auth/profiles.ts',
  'src/auth/userRoles.ts',
  'src/hooks/useHasRole.ts',
  'src/hooks/useAgenticPermissions.ts',
  'src/pages/Login.tsx',
  'src/components/admin/AdminLayout.tsx',
  'src/components/client/ClientLayout.tsx',
  'src/pages/client/ClientDashboard.tsx',
  'src/lib/agenticGuard.ts',
  'supabase/functions/create-client/index.ts',
];

describe('authoritative role set', () => {
  it('contains exactly the three Clean V1 roles', () => {
    expect([...AUTHORITATIVE_ROLES].sort()).toEqual(['admin', 'client', 'collaborator']);
    expect(AUTHORITATIVE_ROLES).toHaveLength(3);
  });

  it('shares one declaration with the environment contract', () => {
    expect([...ROLES].sort()).toEqual([...AUTHORITATIVE_ROLES].sort());
    expect([...ROLES].sort()).toEqual(['admin', 'client', 'collaborator']);
  });

  it('excludes the retired user and moderator roles', () => {
    expect([...RETIRED_ROLES].sort()).toEqual(['moderator', 'user']);
    for (const retired of RETIRED_ROLES) {
      expect(AUTHORITATIVE_ROLES as readonly string[]).not.toContain(retired);
    }
  });

  it('recognises retired values without granting them authority', () => {
    expect(isRetiredRole('user')).toBe(true);
    expect(isRetiredRole('moderator')).toBe(true);
    expect(isRetiredRole('admin')).toBe(false);
    expect(isRetiredRole('client')).toBe(false);
    expect(isRetiredRole(undefined)).toBe(false);
  });

  it('gives every authoritative role a label and a home route', () => {
    for (const role of AUTHORITATIVE_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
      expect(ROLE_HOME_ROUTE[role]).toBeTruthy();
    }
    expect(ROLE_HOME_ROUTE.admin).toBe('/admin');
    expect(ROLE_HOME_ROUTE.collaborator).toBe('/colaborador');
    expect(ROLE_HOME_ROUTE.client).toBe('/cliente');
  });
});

describe('landing route resolution', () => {
  it('routes each single role to its own area', () => {
    expect(resolveLandingRoute(['admin'])).toBe('/admin');
    expect(resolveLandingRoute(['collaborator'])).toBe('/colaborador');
    expect(resolveLandingRoute(['client'])).toBe('/cliente');
  });

  it('applies admin > collaborator > client precedence', () => {
    expect(resolveLandingRoute(['client', 'admin'])).toBe('/admin');
    expect(resolveLandingRoute(['collaborator', 'client'])).toBe('/colaborador');
    expect(resolveLandingRoute(['admin', 'collaborator', 'client'])).toBe('/admin');
  });

  it('never authorises a retired or empty role set', () => {
    expect(resolveLandingRoute([])).toBe('/login');
    expect(resolveLandingRoute(['user'])).toBe('/login');
    expect(resolveLandingRoute(['moderator'])).toBe('/login');
    expect(resolveLandingRoute(['user', 'moderator'])).toBe('/login');
    expect(resolveLandingRoute(null)).toBe('/login');
    expect(resolveLandingRoute(undefined)).toBe('/login');
    expect(hasAnyAuthoritativeRole(['user'])).toBe(false);
    expect(hasAnyAuthoritativeRole(['client'])).toBe(true);
  });

  it('ignores a retired value mixed with an authoritative one', () => {
    expect(resolveLandingRoute(['user', 'collaborator'])).toBe('/colaborador');
  });
});

describe('retired roles are not authoritative anywhere in the app', () => {
  it('assigns no retired role in any auth source', () => {
    for (const file of AUTH_SOURCES) {
      const src = stripComments(read(file));
      for (const retired of RETIRED_ROLES) {
        const assignments = [
          new RegExp(`role['"]?\\s*[:=]\\s*['"]${retired}['"]`, 'i'),
          new RegExp(`\\.eq\\(['"]role['"],\\s*['"]${retired}['"]\\)`, 'i'),
        ];
        for (const pattern of assignments) {
          expect(pattern.test(src), `${file} must not assign role ${retired}`).toBe(false);
        }
      }
    }
  });

  it('keeps the retired literals out of the authoritative role declarations', () => {
    const rolesSrc = stripComments(read('src/auth/roles.ts'));
    // No `role: 'user'` / `role: 'moderator'` style declaration exists here.
    expect(rolesSrc).not.toMatch(/:\s*'(user|moderator)'/);
    expect(rolesSrc).toContain('AUTHORITATIVE_ROLES');
  });
});

describe('type-level role contract', () => {
  it('rejects a retired role where an AppRole is expected', () => {
    const rejected = () => {
      // @ts-expect-error 'user' is retired and not an AppRole
      const bad: AppRole = 'user';
      // @ts-expect-error 'moderator' is retired and not an AppRole
      const bad2: AppRole = 'moderator';
      return [bad, bad2] as const;
    };
    expect(rejected()).toHaveLength(2);
  });

  it('accepts every authoritative role', () => {
    const accepted: AppRole[] = ['admin', 'collaborator', 'client'];
    expect(accepted).toHaveLength(3);
  });
});
