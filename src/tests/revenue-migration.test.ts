import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const FILE = "supabase/migrations_next/20261009_revenue_attribution.sql";
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * R20.18 — staged migration contract.
 * The file must stay OUT of supabase/migrations/ (frozen R20.5 chain),
 * create exactly the two revenue tables, deny anonymous writes, and
 * enforce the facts revenue readability depends on. CI fails on drift.
 */
describe("R20.18 — staged revenue migration", () => {
  it("is staged outside the frozen chain", () => {
    expect(existsSync(join(root, FILE))).toBe(true);
    expect(FILE.startsWith("supabase/migrations/")).toBe(false);
  });

  it("creates exactly opportunities + revenue_events", () => {
    const sql = read(FILE);
    const tables = [...sql.matchAll(/create table public\.(\w+)/gi)].map((m) => m[1].toLowerCase()).sort();
    expect(tables).toEqual(["opportunities", "revenue_events"]);
  });

  it("enforces the five commercial stages on both tables", () => {
    const sql = read(FILE);
    for (const table of ["opportunities", "revenue_events"]) {
      expect(sql).toMatch(new RegExp(`create table public\\.${table}[\\s\\S]*?'open', 'proposal_sent', 'negotiation', 'won', 'lost'`, "i"));
    }
  });

  it("rejects won rows without facts at the database level", () => {
    const sql = read(FILE);
    expect(sql).toContain("opportunities_won_requires_facts");
    expect(sql).toContain("opportunities_lost_requires_date");
    expect(sql).toContain("revenue_events_won_requires_value");
  });

  it("enables RLS with admin-only policies and no anon writes", () => {
    const sql = read(FILE);
    for (const table of ["opportunities", "revenue_events"]) {
      expect(sql).toMatch(new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    }
    expect(sql).not.toMatch(/to anon/i);
  });

  it("indexes the attribution hot paths", () => {
    const sql = read(FILE);
    for (const index of [
      "opportunities_lead_id_idx",
      "opportunities_stage_updated_idx",
      "revenue_events_opportunity_idx",
      "revenue_events_stage_occurred_idx",
    ]) {
      expect(sql).toContain(index);
    }
  });

  it("references no project secrets or forbidden refs", () => {
    const sql = read(FILE);
    expect(sql).not.toMatch(/sb_secret_|service_role|eyJ[A-Za-z0-9_-]{20,}/);
  });
});
