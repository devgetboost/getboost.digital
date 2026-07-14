import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Não é sorte.', 'É performance.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Do topo à recompra',
    title: 'Estratégias full-funnel',
    tags: ['Notoriedade', 'Consideração', 'Conversão', 'Retenção', 'LTV'],
    body: 'Desenhamos a jornada inteira como um sistema único — cada euro investido tem um papel claro, seja gerar procura nova, aquecer audiências ou fechar a venda. Nada solto, nada aleatório: uma arquitectura contínua onde cada fase alimenta a seguinte.',
  },
  {
    eyebrow: 'Online, offline e tudo no meio',
    title: 'Visão Omnichannel',
    tags: ['Loja Online', 'Loja Física', 'App', 'Social', 'Paid Media', 'Email & CRM'],
    body: 'Pensamos além do canal isolado. Sincronizamos mensagem, oferta e experiência entre e-commerce, retail físico, app, redes sociais e email — para que o cliente sinta uma marca coerente em qualquer ponto de contacto e a atribuição reflicta o valor real de cada touchpoint.',
  },
  {
    eyebrow: 'Escala com rentabilidade',
    title: 'Paid Media obcecado por resultado',
    tags: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'LinkedIn Ads', 'Pinterest', 'Reddit', 'Amazon Ads'],
    body: 'Não somos gestores de conta — somos operadores de performance. Testamos criativos em ciclos curtos, isolamos audiências que compõem margem e cortamos o que não escala. O objectivo nunca é gastar melhor: é ganhar mais por cada euro investido.',
  },
  {
    eyebrow: 'Criativo como alavanca',
    title: 'Creative Strategy orientada a performance',
    tags: ['Hook Testing', 'UGC', 'Motion Ads', 'Static Iterations', 'Copy Frameworks'],
    body: 'O criativo é hoje a variável com maior impacto no CAC. Produzimos ciclos rápidos de conceitos, testamos hooks em volume e escalamos apenas o que prova performance real. Cada peça nasce de um insight de dados — nunca de gosto pessoal.',
  },
  {
    eyebrow: 'Ver o que os outros não vêem',
    title: 'Tracking & Atribuição Avançada',
    tags: ['Server-Side Tagging', 'GA4', 'Consent Mode', 'CAPI', 'Pixel Health', 'Modelling'],
    body: 'Sem dados fiáveis, decidir é apostar. Implementamos tracking server-side, conversões offline, integrações CAPI e modelação de atribuição para recuperar sinal perdido pelo iOS e cookies third-party. Menos ruído, mais verdade.',
  },
  {
    eyebrow: 'Decisões baseadas em dados',
    title: 'Data Analytics & Dashboards 360°',
    tags: ['CDP', 'Looker Studio', 'Power BI', 'BigQuery', 'Hotjar', 'Clarity'],
    body: 'Unificamos campanhas, plataformas, CRM e ponto de venda numa vista consolidada. Dashboards que respondem às perguntas certas — margem por campanha, LTV por audiência, cohort por criativo — para que as decisões estratégicas cheguem antes da concorrência.',
  },
  {
    eyebrow: 'Cresce sem depender de leilões',
    title: 'CRM, Email & Retenção',
    tags: ['Automação Klaviyo', 'Segmentação RFM', 'Lifecycle', 'Winback', 'Loyalty'],
    body: 'A performance mais barata acontece com quem já te conhece. Construímos fluxos de retenção, upsell e reactivação que multiplicam a receita por cliente sem inflacionar o custo de aquisição. Escala saudável nasce do segundo pedido, não do primeiro.',
  },
];

const PaidMedia = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Paid Media — Google, Meta, TikTok & LinkedIn Ads | Getboost Digital"
        description="Performance marketing full-funnel: paid media, tracking avançado, dashboards 360° e retenção para escalar com rentabilidade real."
        canonical="/solucoes/paid-media"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a0603] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)',
          }}
        />
        <motion.div
          aria-hidden
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent"
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-28 md:py-40">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            Paid Media · Tracking · Data · Full-Funnel
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.75rem,8vw,7rem)]">
            {manifestoLines.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                className="block"
              >
                {i === manifestoLines.length - 1 ? (
                  <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>
                    {line}
                  </span>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 h-px w-40 origin-left"
            style={{ background: `${ACCENT}b3` }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75"
          >
            Paid media não é gerir contas — é <em className="not-italic text-white">operar um
            sistema de crescimento</em> baseado em dados, criativos em ciclo curto e decisões
            que perseguem margem, não apenas cliques.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Falar com Especialista
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Ver cases
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '+1M€', v: 'Investimento gerido' },
              { k: '+20', v: 'Contas de anúncios' },
              { k: '7', v: 'Mercados activos' },
              { k: '24/7', v: 'Monitorização real' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>

          {/* pill capabilities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="mt-10 flex flex-wrap gap-2.5"
          >
            {[
              'Tracking & atribuição avançada',
              'Modelação de audiências',
              'Criativos orientados a performance',
              'Escala sustentável com rentabilidade',
              'Dashboards 360°',
              'Proximidade com o cliente',
            ].map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/20 px-4 py-2 text-[11px] md:text-xs uppercase tracking-[0.18em] text-white/70"
              >
                {p}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURE LIST */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10">
            {features.map((f, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={f.title} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-10 md:py-14 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <div>
                      <div className="flex items-start gap-5">
                        <span className="mt-3 shrink-0" style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)' }}>
                          {isOpen ? <Circle className="h-4 w-4 fill-current" /> : <Grid2x2 className="h-5 w-5" />}
                        </span>
                        <h3 className="text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight">
                          {f.title}
                        </h3>
                      </div>
                      <div className="mt-8 ml-0 md:ml-10 flex flex-wrap gap-3">
                        {f.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/25 px-4 py-1.5 text-xs md:text-sm text-white/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-start justify-between gap-6">
                        <span
                          className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em]"
                          style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.6)' }}
                        >
                          {f.eyebrow}
                        </span>
                        <Minus
                          className="h-6 w-6 shrink-0 transition-transform"
                          style={{
                            color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)',
                            transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
                          }}
                        />
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.35 }}
                            className="overflow-hidden text-sm md:text-base leading-relaxed text-white/70"
                          >
                            {f.body}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* METODOLOGIA */}
      <section className="bg-[#0a0603] text-white pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-white/10 pt-16">
          <div className="text-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              Fluxo
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight max-w-3xl mx-auto">
              Uma metodologia obcecada com o cliente e com o resultado.
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { n: '01', t: 'Auditoria inicial', d: 'Contas, tracking, criativos, funil e concorrência.' },
              { n: '02', t: 'Definição de objectivos', d: 'KPIs de negócio traduzidos em metas de mídia.' },
              { n: '03', t: 'Planeamento estratégico', d: 'Mix de canais, orçamento e roadmap criativo.' },
              { n: '04', t: 'Implementação', d: 'Setup técnico, campanhas, tracking e QA.' },
              { n: '05', t: 'Análise de resultados', d: 'Ciclos semanais de leitura, teste e optimização.' },
              { n: '06', t: 'Relatórios', d: 'Dashboards e review executivo mensal.' },
            ].map((s) => (
              <div
                key={s.n}
                className="relative border border-white/15 rounded-2xl p-6 min-h-[220px] flex flex-col justify-end hover:border-white/40 transition-colors"
              >
                <span
                  className="absolute top-4 left-4 h-2 w-2 rounded-full"
                  style={{ background: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }}
                />
                <span className="absolute top-8 right-6 font-mono text-5xl md:text-6xl font-bold text-white/[0.06]">
                  {s.n}
                </span>
                <h3 className="text-base md:text-lg font-bold leading-tight">{s.t}</h3>
                <p className="mt-2 text-xs md:text-sm text-white/60 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACK / PLATAFORMAS */}
      <section className="bg-[#0a0603] text-white pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-white/10 pt-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Stack & Plataformas
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            Trabalhamos com o ecossistema completo — tu só vês o resultado.
          </h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Google Ads', 'Meta Ads', 'TikTok Ads', 'LinkedIn Ads',
              'Pinterest Ads', 'Reddit Ads', 'Amazon Ads', 'Microsoft Ads',
              'GA4', 'Looker Studio', 'BigQuery', 'Power BI',
              'Klaviyo', 'HubSpot', 'Shopify Plus', 'Server-Side GTM',
              'Meta CAPI', 'Consent Mode v2', 'Hotjar', 'Clarity',
            ].map((item) => (
              <div
                key={item}
                className="border border-white/15 px-5 py-4 text-sm text-white/80 hover:border-[color:var(--accent)] transition-colors"
                style={{ ['--accent' as string]: ACCENT }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-black text-white py-28 md:py-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
          >
            Com as informações certas,{' '}
            <span style={{ color: ACCENT }}>tomamos melhores decisões.</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14"
          >
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {contactOpen ? 'Fechar formulário' : 'Falar com Especialista'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'paid-media',
              name: 'Paid Media',
              accent: ACCENT,
              eyebrow: 'Briefing · Paid Media',
              headline: 'Vamos escalar o teu investimento.',
              subhead: 'Conta-nos onde estás hoje. Preparamos um plano de paid media com foco em rentabilidade real e escala sustentável.',
              goalOptions: [
                'Escalar aquisição (novos clientes)',
                'Melhorar ROAS / margem',
                'Implementar tracking avançado',
                'Auditoria de contas actuais',
                'Lançar novo produto / mercado',
                'Estratégia full-funnel do zero',
              ],
              messagePlaceholder: 'Investimento mensal actual, canais activos, principais desafios, objectivos de negócio, prazos…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default PaidMedia;
