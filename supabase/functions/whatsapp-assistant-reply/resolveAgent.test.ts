import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resolveWhatsAppConciergeConfig } from "./index.ts";

// Test fixtures: 3 instances mapped to 3 different agents
const INSTANCES = {
  PT:   { id: "inst-pt",   agentId: "agent-pt",   agentName: "Getboost Concierge PT" },
  BR:   { id: "inst-br",   agentId: "agent-br",   agentName: "Getboost Concierge BR" },
  QOOK: { id: "inst-qook", agentId: "agent-qook", agentName: "Qook Concierge" },
};

function makeFakeDb() {
  const mapRows: Record<string, { agent_id: string }> = {
    [INSTANCES.PT.id]:   { agent_id: INSTANCES.PT.agentId },
    [INSTANCES.BR.id]:   { agent_id: INSTANCES.BR.agentId },
    [INSTANCES.QOOK.id]: { agent_id: INSTANCES.QOOK.agentId },
  };
  const agents: Record<string, any> = {
    [INSTANCES.PT.agentId]: {
      id: INSTANCES.PT.agentId, name: INSTANCES.PT.agentName, status: "active",
      model: "google/gemini-2.5-flash", system_prompt: "PT prompt",
      temperature: 0.4, max_tokens: 500, active_version_id: null,
    },
    [INSTANCES.BR.agentId]: {
      id: INSTANCES.BR.agentId, name: INSTANCES.BR.agentName, status: "active",
      model: "google/gemini-2.5-flash", system_prompt: "BR prompt",
      temperature: 0.4, max_tokens: 500, active_version_id: null,
    },
    [INSTANCES.QOOK.agentId]: {
      id: INSTANCES.QOOK.agentId, name: INSTANCES.QOOK.agentName, status: "active",
      model: "google/gemini-2.5-flash", system_prompt: "Qook prompt",
      temperature: 0.4, max_tokens: 500, active_version_id: null,
    },
  };
  const calls: string[] = [];

  const db = {
    from(table: string) {
      const q: any = { table, filters: {} as Record<string, unknown> };
      q.select = (_: string) => q;
      q.eq = (col: string, val: unknown) => { q.filters[col] = val; return q; };
      q.maybeSingle = async () => {
        calls.push(`${table}:${JSON.stringify(q.filters)}`);
        if (table === "whatsapp_instance_agent_map") {
          const row = mapRows[q.filters.instance_id as string];
          return { data: row ?? null, error: null };
        }
        if (table === "agentic_agents") {
          if (q.filters.id) return { data: agents[q.filters.id as string] ?? null, error: null };
          // fallback lookup by name — should NOT happen when mapping exists
          return { data: null, error: null };
        }
        if (table === "agentic_agent_versions") {
          return { data: null, error: null };
        }
        return { data: null, error: null };
      };
      return q;
    },
    _calls: calls,
  };
  return db;
}

for (const [key, inst] of Object.entries(INSTANCES)) {
  Deno.test(`resolveWhatsAppConciergeConfig resolves agent for instance ${key}`, async () => {
    const db = makeFakeDb();
    const cfg = { model: "fallback", system_prompt: "fallback" };
    const res: any = await resolveWhatsAppConciergeConfig(cfg, inst.id, db);
    assertEquals(res.agentId, inst.agentId);
    assertEquals(res.agentName, inst.agentName);
    assertEquals(res.source, "instance_map_agent");
    // Confirms the resolver actually queried the map by instance_id
    const mapCall = db._calls.find((c) => c.startsWith("whatsapp_instance_agent_map:"));
    assertEquals(mapCall, `whatsapp_instance_agent_map:{"instance_id":"${inst.id}"}`);
  });
}

Deno.test("resolveWhatsAppConciergeConfig falls back when instanceId has no mapping", async () => {
  const db = makeFakeDb();
  const res: any = await resolveWhatsAppConciergeConfig({ model: "fb", system_prompt: "fb" }, "unknown-instance", db);
  // No mapping → no agent → fallback to whatsapp_assistant_config
  assertEquals(res.source, "whatsapp_assistant_config");
  assertEquals(res.agentId, undefined);
});

Deno.test("resolveWhatsAppConciergeConfig does not cross-map instances", async () => {
  const db = makeFakeDb();
  const pt: any = await resolveWhatsAppConciergeConfig({}, INSTANCES.PT.id, db);
  const br: any = await resolveWhatsAppConciergeConfig({}, INSTANCES.BR.id, db);
  const qook: any = await resolveWhatsAppConciergeConfig({}, INSTANCES.QOOK.id, db);
  assertEquals(pt.agentName, "Getboost Concierge PT");
  assertEquals(br.agentName, "Getboost Concierge BR");
  assertEquals(qook.agentName, "Qook Concierge");
});
