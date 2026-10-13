# R19.12 — LEGACY REMOVAL

**Status:** PENDING (After all migrations complete)

## COMPONENTS TO REMOVE

| Component | File | Removal Condition |
|---|---|---|
| PageHero | src/components/PageHero.tsx | All 12 pages migrated |
| PageHero legacy styles | PageHero.tsx | Component removed |
| Old gradient definitions | PageHero.tsx | Component removed |
| Old chip styles | PageHero.tsx | Component removed |
| Old checkmark stats | PageHero.tsx | Component removed |
| Old stats row | PageHero.tsx | Component removed |
| SolucaoPlaceholder | src/pages/SolucaoPlaceholder.tsx | Replaced with real pages |
| About.tsx | src/pages/About.tsx | Already deleted |

## FILES TO DELETE

src/components/PageHero.tsx
src/pages/SolucaoPlaceholder.tsx
src/pages/About.tsx (already deleted)

## CI GUARDS (Post-Removal)

```typescript
it("no PageHero imports remain", () => {
  const pages = glob.sync("src/pages/**/*.tsx");
  for (const page of pages) expect(read(page)).not.toContain("PageHero");
});

it("no legacy hero-wave-clip class remains", () => {
  const allTsx = glob.sync("src/**/*.tsx");
  for (const file of allTsx) expect(read(file)).not.toContain("hero-wave-clip");
});

it("no legacy dark hero backgrounds remain", () => {
  const pages = glob.sync("src/pages/**/*.tsx");
  for (const page of pages) expect(read(page)).not.toContain("bg-[#0a0603]");
});
```

## REMOVAL SEQUENCE

1. Complete all migrations (R19.5-R19.11)
2. Run full test suite -> all green
4. Delete PageHero.tsx
5. Delete SolucaoPlaceholder.tsx
6. Remove legacy CSS from globals.css
7. Run full test suite -> all green
8. Build -> success
9. Commit with message: chore: remove legacy PageHero (R19.12)

*Legacy removal executes after all R19.x migrations complete and CI passes.*