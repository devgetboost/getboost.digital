import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * R1C4 Wave 2 — structural gate for the auth surface.
 *
 * Covers the invariants that are expensive to assert in a unit test but cheap
 * and valuable to assert statically: there is exactly one session boundary,
 * every protected area is behind it, and no reachable route is unguarded.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

describe('single auth boundary', () => {
  it('mounts exactly one AuthProvider', () => {
    const app = stripComments(read('src/App.tsx'));
    expect(app).toContain('<AuthProvider>');
    expect(app.match(/<AuthProvider>/g) ?? []).toHaveLength(1);
    expect(app.match(/<\/AuthProvider>/g) ?? []).toHaveLength(1);
  });

  it('keeps the provider above the router content and below LanguageManager', () => {
    const app = read('src/App.tsx');
    expect(app.indexOf('<LanguageManager>')).toBeLessThan(app.indexOf('<AuthProvider>'));
    expect(app.indexOf('<AuthProvider>')).toBeLessThan(app.indexOf('<Routes>'));
  });

  it('guards the collaborator area', () => {
    const app = read('src/App.tsx');
    const collaborator = /<Route\s+path="\/colaborador"[\s\S]*?\/>/.exec(app);
    expect(collaborator, '/colaborador route must exist').not.toBeNull();
    expect(collaborator![0]).toContain('RequireArea');
    expect(collaborator![0]).toContain("anyOf={['admin', 'collaborator']}");
  });
});

describe('no stray session plumbing', () => {
  it('reads the session in exactly one module', () => {
    // The provider owns getSession/onAuthStateChange; nothing else should.
    const provider = read('src/auth/AuthProvider.tsx');
    expect(provider).toContain('supabase.auth.getSession()');
    expect(provider).toContain('supabase.auth.onAuthStateChange');
  });

  it('does not read user_roles directly from a layout or page', () => {
    for (const file of [
      'src/components/admin/AdminLayout.tsx',
      'src/components/client/ClientLayout.tsx',
      'src/hooks/useHasRole.ts',
      'src/hooks/useAgenticPermissions.ts',
    ]) {
      const src = stripComments(read(file));
      expect(src, `${file} must not query user_roles directly`).not.toContain("from('user_roles')");
      expect(src, file).not.toContain("'has_role'");
    }
  });

  it('only signs out from an explicit user action', () => {
    const clientLayout = stripComments(read('src/components/client/ClientLayout.tsx'));
    const handleLogout = /const handleLogout = useCallback\(([\s\S]*?)\}, \[/m.exec(clientLayout);
    expect(handleLogout, 'handleLogout must exist').not.toBeNull();
    expect(handleLogout![1]).toContain('signOut()');
    // The gate itself must never sign the user out: a role-less session goes to
    // /login with the session intact so provisioning can be diagnosed.
    const guard = /useEffect\(\(\) => \{[\s\S]{0,400}?roles\.length === 0[\s\S]{0,200}?\}, \[status, roles, navigate\]\)/;
    expect(guard.test(clientLayout), 'role-less branch must not call signOut').toBe(true);
    const gateBlock = /roles\.length === 0[\s\S]{0,300}?return;/.exec(clientLayout);
    expect(gateBlock![0]).not.toContain('signOut()');
  });
});

describe('profiles access uses the Clean V1 key', () => {
  it('selects profiles by id, never by the retired user_id column', () => {
    for (const file of [
      'src/auth/profiles.ts',
      'src/components/client/ClientLayout.tsx',
      'src/pages/client/ClientDashboard.tsx',
      'src/pages/admin/AdminSettings.tsx',
    ]) {
      const src = stripComments(read(file));
      expect(src, `${file} must not filter profiles on user_id`).not.toMatch(
        /from\('profiles'\)[\s\S]{0,200}?\.eq\('user_id'/,
      );
    }
  });

  it('writes the avatar as a path, not a url', () => {
    const settings = stripComments(read('src/pages/admin/AdminSettings.tsx'));
    expect(settings).toContain('avatar_path');
    expect(settings).not.toContain('avatar_url');
  });
});

describe('role check helpers', () => {
  it('derive roles through the shared accessor', () => {
    const provider = read('src/auth/AuthProvider.tsx');
    expect(provider).toContain("from './userRoles'");
    expect(provider).toContain("from './profiles'");
  });
});
