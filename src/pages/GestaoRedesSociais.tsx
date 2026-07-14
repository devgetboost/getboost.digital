import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Não fazemos posts.', 'Construímos audiência.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Estratégia & Posicionamento',
    title: 'Narrativa de marca com propósito',
    tags: ['Brand Voice', 'Pilares de Conteúdo', 'Calendário Editorial', 'Análise de Público'],
    body: 'Antes de publicar, definimos o território que a tua marca vai ocupar. Desenhamos uma linha editorial coerente, alinhada com os teus objectivos comerciais, para que cada peça reforce autoridade e não seja apenas mais um post no feed.',
  },
  {
    eyebrow: 'Produção Criativa',
    title: 'Conteúdo pensado para parar o scroll',
    tags: ['Reels & TikTok', 'Carrosséis Editoriais', 'Motion & Design', 'Copy Persuasivo'],
    body: 'Da captação em estúdio à edição final: produzimos Reels, TikToks, carrosséis e motion graphics com direcção de arte própria. Cada formato é adaptado à plataforma para maximizar retenção, partilhas e conversas.',
  },
  {
    eyebrow: 'Paid Social & Performance',
    title: 'Meta, TikTok e LinkedIn com foco em ROI',
    tags: ['Meta Ads', 'TikTok Ads', 'LinkedIn Ads', 'Retargeting Full-funnel'],
    body: 'Amplificamos o que já funciona no orgânico com campanhas segmentadas. Estruturamos funis completos, testamos criativos em paralelo e optimizamos CPA e ROAS semana a semana — sem queimar budget em audiências que não convertem.',
  },
  {
    eyebrow: 'Community & Social Care',
    title: 'Conversas que criam lealdade',
    tags: ['Gestão de DMs', 'Moderação', 'Escuta Activa', 'Playbook de Crises'],
    body: 'Redes sociais são canais de duas vias. Respondemos comentários e mensagens com tom coerente, transformamos dúvidas em oportunidades comerciais e blindamos a marca com um protocolo claro para momentos sensíveis.',
  },
  {
    eyebrow: 'Analytics & Growth',
    title: 'Decisões baseadas em dados, não em suposições',
    tags: ['Dashboards Real-time', 'KPIs Comerciais', 'Benchmarking', 'Relatórios Mensais'],
    body: 'Analisamos alcance, engagement, saved posts, CTR e conversão em dashboards claros. Cruzamos dados sociais com o funil de vendas para mostrar o impacto real das redes no negócio — e ajustar a estratégia em tempo real.',
  },
];

const GestaoRedesSociais = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Gestão de Redes Sociais — Estratégia, Conteúdo & Paid Social | Getboost Digital"
        description="Transformamos seguidores em clientes. Estratégia editorial, produção criativa, paid social e community management pensados para gerar vendas e autoridade."
        canonical="/solucoes/gestao-redes-sociais"
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
            Estratégia · Conteúdo · Paid · Comunidade
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
            Uma marca forte não vive de sorte algorítmica. Vive de uma
            <em className="not-italic text-white"> estratégia editorial</em> consistente,
            de criatividade que corta ruído e de dados que fecham o ciclo entre atenção e receita.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/contact"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Pedir Proposta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Ver casos reais
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '+340%', v: 'Alcance orgânico médio' },
              { k: '5x', v: 'Engagement vs. baseline' },
              { k: '<48h', v: 'Resposta em DMs' },
              { k: '4.2', v: 'ROAS médio em paid' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
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

      {/* PLATAFORMAS */}
      <section className="bg-[#0a0603] text-white pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start border-t border-white/10 pt-16">
            <div>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                Ecossistema
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
                Uma marca, todos os canais.
              </h2>
              <p className="mt-6 text-white/70 leading-relaxed">
                Coordenamos presença em Instagram, TikTok, LinkedIn, Facebook, Pinterest e YouTube
                Shorts. Cada canal com estratégia própria, mas alinhado numa mesma identidade.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Instagram', 'TikTok', 'LinkedIn',
                'Facebook', 'Pinterest', 'YouTube Shorts',
                'Threads', 'X / Twitter', 'Google Business',
              ].map((p) => (
                <div
                  key={p}
                  className="border border-white/15 px-5 py-4 text-sm font-mono uppercase tracking-widest text-white/80 hover:border-[color:var(--accent)] transition-colors"
                  style={{ ['--accent' as string]: ACCENT }}
                >
                  {p}
                </div>
              ))}
            </div>
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
            Pronto para transformar seguidores em{' '}
            <span style={{ color: ACCENT }}>clientes</span> e presença em{' '}
            <span style={{ color: ACCENT }}>autoridade</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Falar com um estratega'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'gestao-redes-sociais',
              name: 'Gestão de Redes Sociais',
              accent: ACCENT,
              eyebrow: 'Briefing · Redes Sociais',
              headline: 'Vamos desenhar a tua presença digital.',
              subhead: 'Conta-nos o momento actual da tua marca e o que queres atingir. Preparamos uma estratégia editorial e de paid social adaptada ao teu negócio.',
              goalOptions: [
                'Crescer audiência e notoriedade',
                'Gerar leads / vendas directas',
                'Reforçar autoridade e posicionamento',
                'Reactivar contas paradas',
                'Lançar novo produto ou marca',
              ],
              messagePlaceholder: 'Redes actuais, número de seguidores, quem produz conteúdo hoje, tom de comunicação…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default GestaoRedesSociais;
