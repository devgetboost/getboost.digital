import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Info,
  Lightbulb,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { RequireRoles } from '@/auth/guards';
import {
  buildDashboardData,
  parseDataset,
  type DashboardData,
  type DashboardAlert,
  type Insight,
} from '@/lib/dashboard-data';
import { Reveal, fadeUp } from '@/components/ui/reveal';

/**
 * R20.12 — Revenue Dashboard (executive view).
 *
 * Internal command centre over an IMPORTED event export: there is no backend
 * here, and no number on this page is invented. With no dataset loaded every
 * panel reads zero and the page says so explicitly — an empty dashboard is
 * the honest state, not a failure.
 *
 * Everything renders on the frozen design system (R18.8), with no chart
 * library: rankings are CSS bars, which keeps the R20.11 bundle budget intact.
 */

type Panel = 'executive' | 'marketing' | 'leads' | 'seo' | 'cases' | 'products' | 'crm' | 'sales' | 'revenue';

const PANELS: Array<{ id: Panel; label: string }> = [
  { id: 'executive', label: 'Executivo' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'leads', label: 'Lead Magnets' },
  { id: 'seo', label: 'SEO' },
  { id: 'cases', label: 'Cases' },
  { id: 'products', label: 'Produtos' },
  { id: 'crm', label: 'CRM' },
  { id: 'sales', label: 'Vendas' },
  { id: 'revenue', label: 'Receita' },
];

/** CSS bar ranking — no chart library, no extra bytes. */
const Bar = ({ label, value, max, suffix = '' }: { label: string; value: number; max: number; suffix?: string }) => {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm text-ink-secondary">{label}</span>
        <span className="shrink-0 font-mono text-xs font-semibold text-ink-primary">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Card = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <section className="gb-surface-card h-full">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="gb-text-h3 !text-lg text-ink-primary">{title}</h2>
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const KpiGrid = ({ kpis }: { kpis: DashboardData['executive']['kpis'] }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {kpis.map((kpi, i) => (
      <Reveal key={kpi.key} i={i}>
        <div className="gb-surface-card-elevated h-full">
          <p className="gb-eyebrow text-ink-tertiary">{kpi.label}</p>
          <p className="gb-text-display mt-2 text-brand-600">{kpi.value}</p>
        </div>
      </Reveal>
    ))}
  </div>
);

const Empty = ({ hint }: { hint: string }) => (
  <p className="gb-text-small py-6 text-center text-ink-tertiary">{hint}</p>
);

const AlertCard = ({ alert }: { alert: DashboardAlert }) => {
  const tone = {
    CRITICAL: { bg: 'bg-brand-500/10', text: 'text-brand-600', Icon: AlertTriangle },
    WARNING: { bg: 'bg-warning-bg', text: 'text-warning', Icon: AlertTriangle },
    INFO: { bg: 'bg-black/[0.04]', text: 'text-ink-secondary', Icon: Info },
  }[alert.severity];
  const Icon = tone.Icon;
  return (
    <div className="flex gap-3 rounded-xl border border-black/[0.06] bg-white p-4">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.bg}`}>
        <Icon className={`h-4 w-4 ${tone.text}`} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-primary">{alert.title}</p>
        <p className="gb-text-small mt-1 text-ink-secondary">{alert.detail}</p>
        <p className="mt-1.5 font-mono text-[11px] text-ink-tertiary">{alert.evidence}</p>
      </div>
    </div>
  );
};

const InsightCard = ({ insight }: { insight: Insight }) => (
  <div className="flex gap-3 rounded-xl border border-black/[0.06] bg-white p-4">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
      <Lightbulb className="h-4 w-4 text-brand-600" />
    </span>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-ink-primary">{insight.title}</p>
      <p className="gb-text-small mt-1 text-ink-secondary">{insight.detail}</p>
      <p className="mt-1.5 font-mono text-[11px] text-ink-tertiary">{insight.evidence}</p>
    </div>
  </div>
);

/** Export the current dashboard view as JSON (local file, no upload). */
const downloadJson = (data: DashboardData) => {
  const blob = new Blob([JSON.stringify(data.dataset, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `getboost-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * R20.18 — revenue attribution panels (imported CRM rows only).
 *
 * Every number here comes from the pasted CRM export: the dashboard never
 * invents a euro, a deal or a rate. Missing values render as "—".
 */
const eur = (value: number): string =>
  value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const pct = (rate: number | null): string => (rate === null ? '—' : `${(rate * 100).toFixed(1)}%`);

const RevenueAttributionPanels = ({
  attribution,
}: {
  attribution: NonNullable<DashboardData['revenue']['attribution']>;
}) => {
  const { totals, bySource, byMedium, byCampaign, byLandingPage, byProduct, byService, byCaseStudy, byChannel, funnel, scorecard, quality } = attribution;
  const hasRows = totals.deals + totals.proposals > 0;

  const moneyRows: Array<[string, string]> = [
    ['Pipeline', eur(totals.pipeline)],
    ['Receita ganha', eur(totals.won)],
    ['Receita perdida', eur(totals.lostValue)],
    ['Ticket médio', totals.averageDeal !== null ? eur(totals.averageDeal) : '—'],
    ['Win rate', totals.winRate !== null ? pct(totals.winRate) : '—'],
  ];

  const scorecardRows: Array<[string, string]> = [
    ['Tráfego', scorecard.traffic.toLocaleString('pt-PT')],
    ['Leads', String(scorecard.leads)],
    ['Reuniões', String(scorecard.meetings)],
    ['Propostas', String(scorecard.proposals)],
    ['Negócios ganhos', String(scorecard.wonDeals)],
    ['Pipeline', eur(scorecard.pipeline)],
    ['Receita', eur(scorecard.revenue)],
    ['Crescimento', scorecard.revenueGrowth !== null ? pct(scorecard.revenueGrowth) : '—'],
    ['Melhor origem', scorecard.topSource ?? '—'],
    ['Melhor produto', scorecard.topProduct ?? '—'],
    ['Melhor serviço', scorecard.topService ?? '—'],
    ['Melhor caso', scorecard.topCase ?? '—'],
  ];

  if (!hasRows) {
    return (
      <div className="mt-6">
        <Card title="Receita">
          <Empty hint="Sem linhas de CRM importadas. Cola uma exportação com opportunities[] para ver receita por origem, produto, serviço e canal." />
        </Card>
      </div>
    );
  }

  const sliceBars = (rows: typeof bySource, onlyWon = false) =>
    rows
      .filter((row) => (onlyWon ? row.won > 0 : true))
      .slice(0, 6)
      .map((row) => (
        <Bar
          key={row.key}
          label={row.key}
          value={row.won}
          max={Math.max(1, ...rows.map((r) => r.won))}
          suffix=" €"
        />
      ));

  return (
    <>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Reveal i={0}>
          <Card title="Receita">
            <p className="gb-text-display text-brand-600">{eur(totals.won)}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-ink-secondary">
              {moneyRows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-black/[0.04] pb-1.5 last:border-0">
                  <span className="text-ink-tertiary">{label}</span>
                  <span className="font-mono font-medium text-ink-primary">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
        <Reveal i={1}>
          <Card title="Scorecard executivo">
            <div className="flex flex-col gap-2 text-sm text-ink-secondary">
              {scorecardRows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-black/[0.04] pb-1.5 last:border-0">
                  <span className="text-ink-tertiary">{label}</span>
                  <span className="truncate font-medium text-ink-primary">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
        <Reveal i={2}>
          <Card title="Funil comercial">
            <div className="flex flex-col gap-1.5 text-sm">
              {funnel.steps.map((step) => (
                <div key={step.stage} className="flex items-center justify-between gap-3 border-b border-black/[0.04] pb-1.5 last:border-0">
                  <span className="text-ink-tertiary">{step.stage}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono font-medium text-ink-primary">{step.count}</span>
                    <span className="w-14 text-right font-mono text-[11px] text-ink-tertiary">{pct(step.rate)}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Reveal i={0}>
          <Card title="Receita por origem">{sliceBars(bySource, true)}</Card>
        </Reveal>
        <Reveal i={1}>
          <Card title="Receita por meio">{sliceBars(byMedium, true)}</Card>
        </Reveal>
        <Reveal i={2}>
          <Card title="Receita por campanha">{sliceBars(byCampaign, true)}</Card>
        </Reveal>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Reveal i={0}>
          <Card title="Receita por landing">{sliceBars(byLandingPage, true)}</Card>
        </Reveal>
        <Reveal i={1}>
          <Card title="Receita por produto">{sliceBars(byProduct, true)}</Card>
        </Reveal>
        <Reveal i={2}>
          <Card title="Receita por serviço">{sliceBars(byService, true)}</Card>
        </Reveal>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal i={0}>
          <Card title="Receita por caso de sucesso">{sliceBars(byCaseStudy, true)}</Card>
        </Reveal>
        <Reveal i={1}>
          <Card title="Receita por canal">{sliceBars(byChannel, true)}</Card>
        </Reveal>
      </div>

      {quality.length > 0 && (
        <div className="mt-6">
          <Card title="Qualidade dos dados">
            {quality.slice(0, 8).map((issue, i) => (
              <div key={`${issue.code}-${i}`} className="flex justify-between gap-3 border-b border-black/[0.04] py-1.5 text-sm last:border-0">
                <span className="font-mono text-[11px] text-brand-600">{issue.code}</span>
                <span className="truncate text-ink-secondary">{issue.detail}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </>
  );
};

const DashboardInner = () => {
  const [raw, setRaw] = useState('');
  const [panel, setPanel] = useState<Panel>('executive');
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DashboardData['dataset']>({ events: [], generatedAt: '', source: '' });

  const data = useMemo(() => buildDashboardData(dataset), [dataset]);
  const hasData = dataset.events.length > 0;
  const maxPage = Math.max(1, ...data.executive.topPages.map((row) => row.count));
  const maxLanding = Math.max(1, ...data.marketing.landings.map((row) => row.views));
  const maxAssessment = Math.max(1, ...data.leadMagnets.rows.map((row) => row.starts));

  const load = () => {
    const parsed = parseDataset(raw, 'paste');
    if (!parsed) {
      setError('JSON inválido. Esperado: um array de eventos, ou { "events": [...] }.');
      return;
    }
    setError(null);
    setDataset(parsed);
  };

  return (
    <Layout>
      <SEO
        title="Revenue Dashboard"
        description="Centro de comando interno: tráfego, leads, oportunidades, produtos e pipeline."
        canonical="/dashboard"
        noIndex
      />

      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !py-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="gb-eyebrow text-brand-600">Getboost · Interno</p>
              <h1 className="gb-text-display mt-3 text-ink-primary">Revenue Dashboard</h1>
              <p className="gb-text-body mt-3 max-w-xl text-ink-secondary">
                Tráfego, leads, oportunidades, produtos e pipeline numa só vista.
                Os dados entram por exportação — não há backend nem números inventados.
              </p>
            </div>
            <div className="text-right">
              <p className="gb-eyebrow text-ink-tertiary">Dataset</p>
              <p className="gb-text-h3 mt-1 text-ink-primary">{dataset.events.length} eventos</p>
              {dataset.source && (
                <p className="font-mono text-[11px] text-ink-tertiary">
                  {dataset.source} · {dataset.generatedAt.slice(0, 16).replace('T', ' ')}
                </p>
              )}
            </div>
          </div>

          {/* Data loader */}
          <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-5">
            <label htmlFor="dashboard-data" className="gb-eyebrow text-ink-tertiary">
              Colar exportação de eventos (GA4 / GTM / warehouse)
            </label>
            <textarea
              id="dashboard-data"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              rows={3}
              placeholder='[{"name":"page_view","path":"/"},{"name":"generate_lead", ...}]'
              className="mt-3 w-full rounded-xl border border-black/[0.1] bg-canvas-subtle p-3 font-mono text-xs text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/40"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={load} disabled={raw.trim().length === 0}>
                <BarChart3 className="h-4 w-4" /> Carregar dataset
              </Button>
              {hasData && (
                <Button size="sm" variant="outline" onClick={() => downloadJson(data)}>
                  <Download className="h-4 w-4" /> Exportar view
                </Button>
              )}
              {hasData && (
                <Button size="sm" variant="ghost" onClick={() => { setRaw(''); setDataset({ events: [], generatedAt: '', source: '' }); }}>
                  <RefreshCw className="h-4 w-4" /> Limpar
                </Button>
              )}
              {error && <p className="text-sm font-medium text-brand-600">{error}</p>}
            </div>
          </div>

          {!hasData && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#ff4000]/20 bg-[#ff4000]/[0.04] p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <p className="gb-text-small text-ink-secondary">
                <strong className="text-ink-primary">Sem dataset carregado.</strong> Os eventos de
                analytics vivem no navegador da sessão e não são um registo de negócio — por isso o
                dashboard calcula tudo a partir de uma exportação, e mostra zero até existir uma.
              </p>
            </div>
          )}
        </div>
        <div className="gb-container pb-10">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* Alerts + insights */}
      <section className="gb-surface-section gb-section !py-12">
        <div className="gb-container">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal i={0}>
              <Card title="Alertas" icon={<AlertTriangle className="h-4 w-4 text-ink-tertiary" />}>
                <div className="flex flex-col gap-3">
                  {data.alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              </Card>
            </Reveal>
            <Reveal i={1}>
              <Card title="Insights" icon={<Lightbulb className="h-4 w-4 text-ink-tertiary" />}>
                <div className="flex flex-col gap-3">
                  {data.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Panels */}
      <section className="gb-surface-page gb-section !py-12">
        <div className="gb-container">
          <div className="flex flex-wrap gap-2">
            {PANELS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPanel(item.id)}
                aria-pressed={panel === item.id}
                className={`gb-chip cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50 ${
                  panel === item.id ? '!border-brand-600 !bg-brand-600 !text-white' : 'hover:-translate-y-px'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-10">
            {panel === 'executive' && (
              <div className="flex flex-col gap-8">
                <KpiGrid kpis={data.executive.kpis} />
                <div className="grid gap-6 lg:grid-cols-3">
                  <Reveal i={0}>
                    <Card title="Top páginas">
                      {hasData ? data.executive.topPages.map((row) => (
                        <Bar key={row.key} label={row.key} value={row.count} max={maxPage} />
                      )) : <Empty hint="Sem dados." />}
                    </Card>
                  </Reveal>
                  <Reveal i={1}>
                    <Card title="Top CTAs">
                      {hasData ? data.executive.topCtas.map((row) => (
                        <Bar key={row.key} label={row.key} value={row.count} max={maxPage} />
                      )) : <Empty hint="Sem dados." />}
                    </Card>
                  </Reveal>
                  <Reveal i={2}>
                    <Card title="Origens de leads">
                      {hasData && data.executive.leadSources.length > 0 ? data.executive.leadSources.map((row) => (
                        <Bar key={`${row.source}/${row.medium}`} label={`${row.source} · ${row.medium}`} value={row.conversions} max={Math.max(1, ...data.executive.leadSources.map((r) => r.conversions))} />
                      )) : <Empty hint="Sem conversões com UTMs." />}
                    </Card>
                  </Reveal>
                  <Reveal i={3}>
                    <Card title="Top performers">
                      <div className="flex flex-col gap-2 text-sm text-ink-secondary">
                        {[
                          ['Produto', data.performers.product?.label],
                          ['Landing', data.performers.landing?.label],
                          ['CTA', data.performers.cta?.label],
                          ['Assessment', data.performers.assessment?.label],
                          ['Case', data.performers.caseStudy?.label],
                          ['Oportunidade', data.performers.opportunity?.label],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-3 border-b border-black/[0.04] pb-1.5 last:border-0">
                            <span className="text-ink-tertiary">{label}</span>
                            <span className="truncate font-medium text-ink-primary">{value ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Reveal>
                </div>
              </div>
            )}

            {panel === 'marketing' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Reveal i={0}>
                  <Card title="Funil" icon={<TrendingUp className="h-4 w-4 text-ink-tertiary" />}>
                    {[
                      ['Views', data.marketing.funnel.views],
                      ['CTA clicks', data.marketing.funnel.ctaClicks],
                      ['Intenções', data.marketing.funnel.intents],
                      ['Form starts', data.marketing.funnel.formStarts],
                      ['Submits', data.marketing.funnel.submits],
                    ].map(([label, value]) => (
                      <Bar key={label as string} label={label as string} value={value as number} max={Math.max(1, data.marketing.funnel.views)} />
                    ))}
                  </Card>
                </Reveal>
                <Reveal i={1}>
                  <Card title="Landings">
                    {hasData ? data.marketing.landings.slice(0, 10).map((row) => (
                      <Bar key={row.slug} label={`/${row.slug}`} value={row.views} max={maxLanding} />
                    )) : <Empty hint="Sem dados." />}
                  </Card>
                </Reveal>
                <Reveal i={2}>
                  <Card title="Scroll">
                    {hasData && data.marketing.scroll.length > 0
                      ? data.marketing.scroll.map((row) => (
                        <Bar key={row.location} label={row.location} value={row.p100} max={100} suffix="%" />
                      ))
                      : <Empty hint="Sem scroll tracking carregado." />}
                  </Card>
                </Reveal>
              </div>
            )}

            {panel === 'leads' && (
              <Reveal i={0}>
                <Card title="Assessments" icon={<Target className="h-4 w-4 text-ink-tertiary" />}>
                  {hasData ? data.leadMagnets.rows.map((row) => (
                    <div key={row.id} className="border-b border-black/[0.04] py-3 last:border-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold text-ink-primary">{row.category}</span>
                        <span className="font-mono text-xs text-ink-tertiary">{row.id}</span>
                      </div>
                      <Bar label="starts" value={row.starts} max={maxAssessment} />
                      <div className="flex gap-6 font-mono text-[11px] text-ink-tertiary">
                        <span>completion {row.completionRate === null ? '—' : `${Math.round(row.completionRate * 100)}%`}</span>
                        <span>capture {row.captureRate === null ? '—' : `${Math.round(row.captureRate * 100)}%`}</span>
                      </div>
                    </div>
                  )) : <Empty hint="Sem dados." />}
                </Card>
              </Reveal>
            )}

            {panel === 'seo' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Reveal i={0}>
                  <Card title="Cobertura da rede">
                    <p className="gb-text-display text-brand-600">
                      {data.seo.covered}/{data.seo.total}
                    </p>
                    <p className="gb-text-small mt-2 text-ink-secondary">
                      landings da rede R20.6 com pelo menos uma visita registada.
                    </p>
                  </Card>
                </Reveal>
                <Reveal i={1}>
                  <Card title="Clusters">
                    {data.seo.clusters.map((row) => (
                      <Bar key={row.cluster} label={`${row.cluster} (${row.landings})`} value={row.views} max={maxLanding} />
                    ))}
                  </Card>
                </Reveal>
              </div>
            )}

            {panel === 'cases' && (
              <Reveal i={0}>
                <Card title="Cases">
                  {hasData && data.cases.stats.length > 0
                    ? data.cases.stats.map((row) => (
                      <Bar key={row.slug} label={row.slug} value={row.views} max={Math.max(1, ...data.cases.stats.map((s) => s.views))} />
                    ))
                    : <Empty hint="Sem eventos de case carregados." />}
                </Card>
              </Reveal>
            )}

            {panel === 'products' && (
              <Reveal i={0}>
                <Card title="Produtos">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-black/[0.08] font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                          <th className="py-2 pr-4">Produto</th>
                          <th className="py-2 pr-4">Score</th>
                          <th className="py-2 pr-4">Interesse</th>
                          <th className="py-2 pr-4">Leads</th>
                          <th className="py-2">Validação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.products.map((row) => (
                          <tr key={row.slug} className="border-b border-black/[0.04] last:border-0">
                            <td className="py-2.5 pr-4 font-medium text-ink-primary">{row.name}</td>
                            <td className="py-2.5 pr-4 font-mono text-xs">{row.demandScore}</td>
                            <td className="py-2.5 pr-4 font-mono text-xs">{row.interestScore}</td>
                            <td className="py-2.5 pr-4 font-mono text-xs">{row.leadScore}</td>
                            <td className="py-2.5 font-mono text-[11px] text-ink-secondary">{row.validation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </Reveal>
            )}

            {panel === 'crm' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Reveal i={0}>
                  <Card title="Distribuição de qualificação">
                    {(['HOT', 'WARM', 'COLD', 'NURTURE'] as const).map((tier) => (
                      <Bar key={tier} label={tier} value={data.crm.byTier[tier]} max={Math.max(1, data.crm.leads)} />
                    ))}
                  </Card>
                </Reveal>
                <Reveal i={1}>
                  <Card title="Pipeline">
                    <div className="flex flex-col gap-2 text-sm text-ink-secondary">
                      {[
                        ['Leads', data.crm.leads],
                        ['Qualificados', data.crm.qualified],
                        ['Oportunidades', data.crm.opportunities],
                        ['Conversão', data.crm.conversionRate === null ? '—' : `${Math.round(data.crm.conversionRate * 100)}%`],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex justify-between border-b border-black/[0.04] pb-1.5 last:border-0">
                          <span className="text-ink-tertiary">{label}</span>
                          <span className="font-mono font-medium text-ink-primary">{value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Reveal>
              </div>
            )}

            {panel === 'sales' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Reveal i={0}>
                  <Card title="Ações recomendadas" icon={<CheckCircle2 className="h-4 w-4 text-ink-tertiary" />}>
                    {data.revenue.salesActions.map((row) => (
                      <Bar key={row.action} label={row.action} value={row.count} max={Math.max(1, data.crm.leads)} />
                    ))}
                  </Card>
                </Reveal>
                <Reveal i={1}>
                  <Card title="Oportunidades por produto">
                    {data.revenue.products.filter((row) => row.opportunities > 0).map((row) => (
                      <Bar key={row.slug} label={row.name} value={row.opportunities} max={Math.max(1, ...data.revenue.products.map((p) => p.opportunities))} />
                    ))}
                  </Card>
                </Reveal>
              </div>
            )}

            {panel === 'revenue' && (
              <>
                <div className="grid gap-6 lg:grid-cols-3">
                  <Reveal i={0}>
                    <Card title="Pipeline potencial">
                      <p className="gb-text-display text-brand-600">{data.revenue.potentialPipeline}</p>
                      <p className="gb-text-small mt-2 text-ink-secondary">leads com ação comercial recomendada.</p>
                    </Card>
                  </Reveal>
                  <Reveal i={1}>
                    <Card title="Estágios">
                      {data.revenue.pipelineStages.map((row) => (
                        <Bar key={row.stage} label={row.stage} value={row.count} max={Math.max(1, data.crm.leads)} />
                      ))}
                    </Card>
                  </Reveal>
                  <Reveal i={2}>
                    <Card title="Respostas">
                      <div className="flex flex-col gap-2 text-sm text-ink-secondary">
                        {[
                          ['Produto com mais procura', data.answers.topDemand],
                          ['Gera mais leads', data.answers.topLeads],
                          ['Gera mais reuniões', data.answers.topMeetings],
                          ['Justifica investimento', data.answers.topInvestment],
                          ['Precisa de landing', data.answers.needLanding.join(', ') || '—'],
                        ].map(([label, value]) => (
                          <div key={label as string} className="flex justify-between gap-3 border-b border-black/[0.04] pb-1.5 last:border-0">
                            <span className="text-ink-tertiary">{label}</span>
                            <span className="truncate font-medium text-ink-primary">{value ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Reveal>
                </div>
              {data.revenue.attribution && (
                <RevenueAttributionPanels attribution={data.revenue.attribution} />
              )}
              </>
            )}
          </div>

          <div className="mt-10">
            <SectionHeader
              eyebrow="Fontes"
              title="Onde vêm estes números"
              description="Analytics (R20.1), Funnel (R20.2), CRO (R20.3), Lead Magnets (R20.4), SEO network (R20.6), Cases (R20.7), Demand (R20.8), CRM (R20.9) e Sales (R20.10). Nenhum valor é estimado."
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

/** Internal route: authenticated operator with an admin/collaborator role. */
const Dashboard = () => (
  <RequireRoles anyOf={['admin', 'collaborator']}>
    <DashboardInner />
  </RequireRoles>
);

export default Dashboard;
