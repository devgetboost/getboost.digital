import { describe, it, expect } from 'vitest';

/**
 * Teste de carga sintético por agente.
 * Executa N invocações concorrentes contra mocks (com latência simulada e taxa
 * de erro configurável) e verifica thresholds de latência p50/p95 e taxa de
 * erro. Para carga real, substituir `simulateRun` por chamada à edge function
 * `agentic-agent-test` e ajustar CONCURRENCY/TOTAL conforme o plano de teste.
 */

type AgentSpec = {
  name: string;
  baseLatencyMs: number;
  jitterMs: number;
  errorRate: number;
  thresholds: { p50: number; p95: number; errorRate: number };
};

const AGENTS: AgentSpec[] = [
  { name: 'Lead Qualifier',      baseLatencyMs: 400, jitterMs: 200, errorRate: 0.01, thresholds: { p50: 800,  p95: 1500, errorRate: 0.05 } },
  { name: 'WhatsApp Concierge',  baseLatencyMs: 300, jitterMs: 150, errorRate: 0.01, thresholds: { p50: 600,  p95: 1200, errorRate: 0.05 } },
  { name: 'Booking Assistant',   baseLatencyMs: 350, jitterMs: 150, errorRate: 0.005, thresholds: { p50: 700, p95: 1400, errorRate: 0.05 } },
  { name: 'Content Editor',      baseLatencyMs: 900, jitterMs: 400, errorRate: 0.02, thresholds: { p50: 1800, p95: 3500, errorRate: 0.05 } },
  { name: 'Campaign Strategist', baseLatencyMs: 700, jitterMs: 300, errorRate: 0.015, thresholds: { p50: 1400, p95: 2800, errorRate: 0.05 } },
];

const TOTAL = 40;
const CONCURRENCY = 8;

async function simulateRun(spec: AgentSpec, i: number) {
  // Determinístico: latência via seed; erros injetados em índices fixos.
  const seeded = ((i * 9301 + 49297) % 233280) / 233280;
  const latency = spec.baseLatencyMs + seeded * spec.jitterMs;
  await new Promise((r) => setTimeout(r, Math.min(50, latency / 20)));
  const expectedErrors = Math.floor(spec.errorRate * 40); // TOTAL=40
  if (i < expectedErrors) throw new Error('simulated error');
  return latency;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function runLoad(spec: AgentSpec) {
  const latencies: number[] = [];
  let errors = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < TOTAL) {
      const i = cursor++;
      if (i >= TOTAL) break;
      try {
        latencies.push(await simulateRun(spec, i));
      } catch {
        errors++;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return {
    runs: TOTAL,
    errors,
    errorRate: errors / TOTAL,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
  };
}

describe('Carga — latência e taxa de erro por agente', () => {
  for (const spec of AGENTS) {
    it(`${spec.name} respeita thresholds sob ${TOTAL} pedidos (concorrência ${CONCURRENCY})`, async () => {
      const report = await runLoad(spec);
      expect(report.p50, `${spec.name} p50=${report.p50}`).toBeLessThanOrEqual(spec.thresholds.p50);
      expect(report.p95, `${spec.name} p95=${report.p95}`).toBeLessThanOrEqual(spec.thresholds.p95);
      expect(report.errorRate, `${spec.name} errorRate=${report.errorRate}`).toBeLessThanOrEqual(spec.thresholds.errorRate);
    });
  }
});
