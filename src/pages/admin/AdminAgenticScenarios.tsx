import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Play, CheckCircle2, XCircle, Clock, ChevronLeft, Loader2 } from "lucide-react";

type ValidateFn = (payload: any, status: number) => { ok: boolean; reason?: string };
type Scenario = {
  id: string;
  label: string;
  body: any;
  validate: ValidateFn;
};
type AgentDef = {
  fn: string;
  title: string;
  description: string;
  scenarios: Scenario[];
};

type Result = {
  status: "idle" | "running" | "pass" | "fail" | "error";
  httpStatus?: number;
  durationMs?: number;
  payload?: any;
  reason?: string;
};

const nonEmptyString = (v: unknown) => typeof v === "string" && v.trim().length > 0;

const AGENTS: AgentDef[] = [
  {
    fn: "blog-ai-assist",
    title: "Blog AI Assist",
    description: "Requer role admin. Valida result string não-vazia.",
    scenarios: [
      {
        id: "improve",
        label: "improve texto curto",
        body: { action: "improve", content: "Marketing digital é importante para empresas." },
        validate: (p, s) => ({ ok: s === 200 && nonEmptyString(p?.result), reason: p?.error }),
      },
      {
        id: "seo",
        label: "seo com keyword",
        body: { action: "seo", title: "Como escolher um CRM em 2026", keyword: "CRM PME Portugal" },
        validate: (p, s) => ({ ok: s === 200 && nonEmptyString(p?.result), reason: p?.error }),
      },
      {
        id: "summary",
        label: "resumo",
        body: {
          action: "summary",
          content:
            "A automação comercial permite reduzir tempo perdido em tarefas repetitivas e aumentar a conversão de leads qualificados, sobretudo em PMEs.",
        },
        validate: (p, s) => ({ ok: s === 200 && nonEmptyString(p?.result), reason: p?.error }),
      },
    ],
  },
  {
    fn: "content-ideas",
    title: "Content Ideas",
    description: "Público. Aceita 403 (sem lead) como regra prometida.",
    scenarios: [
      {
        id: "pt-local",
        label: "PT nicho local",
        body: { niche: "Restaurantes locais em Lisboa", language: "pt" },
        validate: (p, s) => {
          if (s === 403 && p?.error === "Submete o formulário antes de gerar ideias.") return { ok: true, reason: "403 esperado (sem lead prévio)" };
          if (s === 200 && p?.ideas && typeof p.ideas === "object") return { ok: true };
          return { ok: false, reason: p?.error ?? `status ${s}` };
        },
      },
      {
        id: "en-saas",
        label: "EN SaaS",
        body: { niche: "SaaS B2B para RH", language: "en" },
        validate: (p, s) => {
          if (s === 403 && p?.error === "Submete o formulário antes de gerar ideias.") return { ok: true, reason: "403 esperado" };
          if (s === 200 && p?.ideas) return { ok: true };
          return { ok: false, reason: p?.error ?? `status ${s}` };
        },
      },
      {
        id: "estetica",
        label: "PT saúde",
        body: { niche: "Clínicas de estética", language: "pt" },
        validate: (p, s) => {
          if (s === 403 && p?.error === "Submete o formulário antes de gerar ideias.") return { ok: true, reason: "403 esperado" };
          if (s === 200 && p?.ideas) return { ok: true };
          return { ok: false, reason: p?.error ?? `status ${s}` };
        },
      },
    ],
  },
  {
    fn: "commercial-audit",
    title: "Commercial Audit",
    description: "⚠️ Insere lead real. Valida score + verdict.",
    scenarios: [
      {
        id: "saas",
        label: "SaaS pequena equipa",
        body: buildAudit({ industry: "SaaS" }),
        validate: (p, s) => ({
          ok: s === 200 && (typeof p?.score === "number" || p?.score === null) && nonEmptyString(p?.verdict),
          reason: p?.error,
        }),
      },
      {
        id: "ecom",
        label: "E-commerce sem CRM",
        body: buildAudit({ industry: "E-commerce", currentCrm: "Nenhum", automationLevel: "nenhum" }),
        validate: (p, s) => ({
          ok: s === 200 && (typeof p?.score === "number" || p?.score === null) && nonEmptyString(p?.verdict),
          reason: p?.error,
        }),
      },
      {
        id: "servicos",
        label: "Serviços high-touch",
        body: buildAudit({ industry: "Serviços profissionais", teamSize: "10+", conversionRate: "20-30%" }),
        validate: (p, s) => ({
          ok: s === 200 && (typeof p?.score === "number" || p?.score === null) && nonEmptyString(p?.verdict),
          reason: p?.error,
        }),
      },
    ],
  },
  {
    fn: "agentic-agent-test",
    title: "Agentic Playground",
    description: "Requer role admin. Valida output não-vazio.",
    scenarios: [
      {
        id: "def",
        label: "definição curta",
        body: {
          systemPrompt: "És um consultor comercial da Getboost Digital. Responde em PT-PT, directo e conciso.",
          userMessage: "Explica CRM em 1 frase.",
          model: "google/gemini-2.5-flash",
        },
        validate: (p, s) => ({ ok: s === 200 && nonEmptyString(p?.output ?? p?.result ?? p?.text), reason: p?.error }),
      },
      {
        id: "list",
        label: "lista",
        body: {
          systemPrompt: "És um consultor comercial da Getboost Digital. Responde em PT-PT, directo e conciso.",
          userMessage: "Lista 3 vantagens de automação comercial.",
          model: "google/gemini-2.5-flash",
        },
        validate: (p, s) => ({ ok: s === 200 && nonEmptyString(p?.output ?? p?.result ?? p?.text), reason: p?.error }),
      },
      {
        id: "email",
        label: "email frio",
        body: {
          systemPrompt: "És um consultor comercial da Getboost Digital. Responde em PT-PT, directo e conciso.",
          userMessage: "Escreve um email frio de 60 palavras a apresentar a Getboost.",
          model: "google/gemini-2.5-flash",
        },
        validate: (p, s) => ({ ok: s === 200 && nonEmptyString(p?.output ?? p?.result ?? p?.text), reason: p?.error }),
      },
    ],
  },
];

function buildAudit(overrides: Partial<Record<string, string>>) {
  const answers = {
    industry: "SaaS",
    teamSize: "3-5",
    currentCrm: "HubSpot Free",
    leadVolume: "50-100",
    conversionRate: "5-10%",
    biggestChallenge: "Follow-up manual",
    automationLevel: "baixo",
    ...overrides,
  };
  const contact = {
    name: "Cenário Teste",
    email: `scenario+${Date.now()}@getboost.digital`,
    company: "Teste Lda",
  };
  return { answers, contact };
}

type Key = string; // `${fn}::${scenarioId}`

export default function AdminAgenticScenarios() {
  const [results, setResults] = useState<Record<Key, Result>>({});
  const [runningAll, setRunningAll] = useState(false);

  async function runOne(agent: AgentDef, sc: Scenario) {
    const key: Key = `${agent.fn}::${sc.id}`;
    setResults((r) => ({ ...r, [key]: { status: "running" } }));
    const t0 = performance.now();
    try {
      const { data, error } = await supabase.functions.invoke(agent.fn, { body: sc.body });
      const dt = Math.round(performance.now() - t0);
      // supabase-js resolves error for non-2xx. We still want status + payload.
      if (error) {
        const ctx: any = (error as any).context;
        let payload: any = null;
        let status = 0;
        try {
          if (ctx?.response) {
            status = ctx.response.status;
            payload = await ctx.response.clone().json().catch(() => null);
          }
        } catch { /* noop */ }
        const val = sc.validate(payload ?? { error: error.message }, status);
        setResults((r) => ({
          ...r,
          [key]: {
            status: val.ok ? "pass" : "fail",
            httpStatus: status || undefined,
            durationMs: dt,
            payload: payload ?? { error: error.message },
            reason: val.reason,
          },
        }));
        return;
      }
      const val = sc.validate(data, 200);
      setResults((r) => ({
        ...r,
        [key]: {
          status: val.ok ? "pass" : "fail",
          httpStatus: 200,
          durationMs: dt,
          payload: data,
          reason: val.reason,
        },
      }));
    } catch (e: any) {
      const dt = Math.round(performance.now() - t0);
      setResults((r) => ({
        ...r,
        [key]: { status: "error", durationMs: dt, reason: e?.message ?? String(e) },
      }));
    }
  }

  async function runAgent(agent: AgentDef) {
    await Promise.all(agent.scenarios.map((sc) => runOne(agent, sc)));
    toast.success(`${agent.title}: cenários concluídos`);
  }

  async function runAll() {
    setRunningAll(true);
    try {
      for (const a of visibleAgents) {
        await runAgent(a);
      }
    } finally {
      setRunningAll(false);
    }
  }

  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [scenarioFilter, setScenarioFilter] = useState<string>("all");

  const visibleAgents = (agentFilter === "all" ? AGENTS : AGENTS.filter((a) => a.fn === agentFilter)).map((a) => ({
    ...a,
    scenarios: scenarioFilter === "all" || agentFilter === "all"
      ? a.scenarios
      : a.scenarios.filter((s) => s.id === scenarioFilter),
  })).filter((a) => a.scenarios.length > 0);

  const selectedAgent = AGENTS.find((a) => a.fn === agentFilter);

  const totals = Object.values(results).reduce(
    (acc, r) => {
      if (r.status === "pass") acc.pass++;
      else if (r.status === "fail") acc.fail++;
      else if (r.status === "error") acc.error++;
      return acc;
    },
    { pass: 0, fail: 0, error: 0 },
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link to="/admin/agentic-ai" className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" /> Voltar
          </Link>
          <h1 className="text-2xl font-semibold mt-1">Cenários de teste</h1>
          <p className="text-sm text-muted-foreground">3 pedidos reais por agente. Valida forma da resposta, tempo e erros.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setScenarioFilter("all"); }}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Agente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os agentes</SelectItem>
              {AGENTS.map((a) => (
                <SelectItem key={a.fn} value={a.fn}>{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={scenarioFilter} onValueChange={setScenarioFilter} disabled={!selectedAgent}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Cenário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cenários</SelectItem>
              {selectedAgent?.scenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground flex items-center gap-2 ml-2">
            <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" />{totals.pass}</Badge>
            <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3 text-red-600" />{totals.fail + totals.error}</Badge>
          </div>
          <Button onClick={runAll} disabled={runningAll} className="gap-2">
            {runningAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Correr {agentFilter === "all" ? "todos" : scenarioFilter === "all" ? "agente" : "cenário"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {visibleAgents.map((agent) => (
          <Card key={agent.fn} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{agent.title}</h2>
                <p className="text-xs text-muted-foreground">
                  <code className="mr-2">{agent.fn}</code>
                  {agent.description}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => runAgent(agent)} className="gap-2">
                <Play className="h-3 w-3" /> Correr
              </Button>
            </div>
            <Separator />
            <div className="grid md:grid-cols-3 gap-3">
              {agent.scenarios.map((sc) => {
                const r = results[`${agent.fn}::${sc.id}`] ?? { status: "idle" as const };
                return (
                  <Card key={sc.id} className="p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{sc.label}</div>
                      <StatusBadge r={r} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {r.httpStatus != null && <span>HTTP {r.httpStatus}</span>}
                      {r.durationMs != null && (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{r.durationMs}ms</span>
                      )}
                    </div>
                    {r.reason && <div className="text-xs text-red-600">{r.reason}</div>}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => runOne(agent, sc)} disabled={r.status === "running"}>
                        {r.status === "running" ? "A correr…" : "Correr"}
                      </Button>
                    </div>
                    {r.payload != null && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">Ver payload</summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-2 border">
                          {safeStringify(r.payload)}
                        </pre>
                      </details>
                    )}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Ver input</summary>
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-2 border">
                        {safeStringify(sc.body)}
                      </pre>
                    </details>
                  </Card>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ r }: { r: Result }) {
  if (r.status === "pass") return <Badge className="bg-green-600 hover:bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" />pass</Badge>;
  if (r.status === "fail") return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />fail</Badge>;
  if (r.status === "error") return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />error</Badge>;
  if (r.status === "running") return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />a correr</Badge>;
  return <Badge variant="outline">idle</Badge>;
}

function safeStringify(v: unknown) {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}
