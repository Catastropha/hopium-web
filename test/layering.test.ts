/**
 * Layering guard: enforces the 3-layer rule from CONVENTION.md.
 *
 *   core → must not import lib or page
 *   lib  → must not import page
 *   page/{a}/ → must not import from page/{b}/ (zero cross-page)
 *
 * The composition root at `src/` itself (App.tsx, routes.tsx, RootLayout.tsx,
 * main.tsx) sits above the 3-layer rule — it's where the layers are wired
 * together, same pattern as the backend's `app/main.py`.
 *
 * Implemented as a filesystem scan — no compiler plumbing needed.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(p);
    }
  }
  return acc;
}

function importsOf(file: string): string[] {
  const body = readFileSync(file, 'utf8');
  const matches = [...body.matchAll(/from\s+['"](@\/[^'"]+)['"]/g)];
  return matches.map((m) => m[1] ?? '').filter(Boolean);
}

describe('layering', () => {
  const files = walk(SRC);

  it('core/ does not import from lib/ or page/', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const rel = relative(SRC, f);
      if (!rel.startsWith('core/')) continue;
      const bad = importsOf(f).filter(
        (imp) => imp.startsWith('@/lib/') || imp.startsWith('@/page/'),
      );
      if (bad.length) offenders.push(`${rel}: ${bad.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('lib/ does not import from page/', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const rel = relative(SRC, f);
      if (!rel.startsWith('lib/')) continue;
      const bad = importsOf(f).filter((imp) => imp.startsWith('@/page/'));
      if (bad.length) offenders.push(`${rel}: ${bad.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('no page imports from another page', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const rel = relative(SRC, f);
      if (!rel.startsWith('page/')) continue;
      const ownPage = rel.split('/')[1];
      const bad = importsOf(f).filter((imp) => {
        if (!imp.startsWith('@/page/')) return false;
        const otherPage = imp.slice('@/page/'.length).split('/')[0];
        return otherPage !== ownPage;
      });
      if (bad.length) offenders.push(`${rel}: ${bad.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('composition root at src/ is the only allowed set of files', () => {
    const allowed = new Set(['App.tsx', 'routes.tsx', 'RootLayout.tsx', 'main.tsx']);
    const offenders: string[] = [];
    for (const f of files) {
      const rel = relative(SRC, f);
      if (rel.includes('/')) continue;
      if (!allowed.has(rel)) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });
});
