import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Grid2x2, Minus, Circle, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Nascemos para fazer.', 'Ficamos para escalar.'];

type Pillar = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const pillars: Pillar[] = [
  {
    eyebrow: 'Origem',
    title: 'De consultores a operadores',
    tags: ['2019', 'Figueira da Foz', 'Bootstrap', 'Fundadores Técnicos'],
    body: 'Começámos a Getboost porque cansámo-nos de ver empresas a pagar por apresentações em PowerPoint sem execução por trás. Fundada por engenheiros e estrategas, a Getboost nasceu como resposta directa a esse vazio — uma casa que pensa, constrói e opera no mesmo turno.',
  },
  {
    eyebrow: 'Missão',
    title: 'Democratizar tecnologia de topo',
    tags: ['PMEs', 'Acesso', 'IA aplicada', 'Software à medida'],
    body: 'Levar às PMEs portuguesas as mesmas ferramentas, práticas e inteligência que grandes tecnológicas usam há uma década. Software próprio, agentes de IA, automação de operações — sem preços de agência internacional, sem barreiras técnicas.',
  },
  {
    eyebrow: 'Visão',
    title: 'Portugal, hub técnico do sul da Europa',
    tags: ['Talento local', 'Produtos globais', 'Investimento em I&D', 'Long-term'],
    body: 'Acreditamos que Portugal tem tudo para se tornar um pólo de produtos digitais de referência. Trabalhamos todos os dias para provar isso — construindo produtos próprios que competem lá fora e ajudando clientes locais a fazer o mesmo.',
  },
  {
    eyebrow: 'Valores',
    title: 'Fazer bem, dizer o que se faz',
    tags: ['Transparência', 'Craft', 'Responsabilidade', 'Ambição saudável'],
    body: 'Falamos claro sobre prazos, custos, riscos e resultados. Assumimos os erros que fazemos, celebramos as vitórias sem exageros e recusamos projectos onde não conseguimos gerar valor real. Preferimos perder um cliente do que enganá-lo.',
  },
  {
    eyebrow: 'Método',
    title: 'Discovery curto, entrega frequente',
    tags: ['Sprints', 'Feedback loops', 'Data-informed', 'Iteração'],
    body: 'Trabalhamos em ciclos curtos, com entregas visíveis a cada duas semanas. Cada decisão passa por dados, cada hipótese é validada em produção, cada projecto termina com métricas — não com um powerpoint final.',
  },
  {
    eyebrow: 'Compromisso',
    title: 'Parceiros, não fornecedores',
    tags: ['Relação longa', 'Ownership', 'Suporte contínuo', 'Sem lock-in'],
    body: 'Não desaparecemos no dia do go-live. Mantemos ligação directa com os clientes muito depois da entrega, evoluímos com eles e não usamos técnicas de retenção artificial. Se saíres, sais com todo o código, todos os dados, toda a documentação.',
  },
];

const SobreNos = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Sobre Nós — Quem é a Getboost Digital"
        description="Somos uma casa técnica portuguesa que pensa, constrói e opera. Conhece a origem, missão, valores e método da Getboost Digital."
        canonical="/sobre-nos"
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
            background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)',
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
            Sobre Nós · Getboost Digital · Desde 2019
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
            Somos uma casa técnica que combina <em className="not-italic text-white">engenharia</em>,
            <em className="not-italic text-white"> design</em> e <em className="not-italic text-white">estratégia</em>{' '}
            para construir produtos digitais que geram receita — não impressões. Trabalhamos com
            PMEs, startups e operadores que preferem métricas a promessas.
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
              Falar com a Getboost
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/equipa"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
              Conhecer a equipa
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '2019', v: 'Ano de fundação' },
              { k: '6+', v: 'Produtos próprios' },
              { k: '50+', v: 'Projectos entregues' },
              { k: '100%', v: 'Bootstrap · Independente' },
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

      {/* PILLARS ACCORDION */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-16 flex items-center gap-4">
            <Compass className="h-5 w-5" style={{ color: ACCENT }} />
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-white/60">
              O que nos define
            </span>
          </div>
          <div className="border-t border-white/10">
            {pillars.map((f, i) => {
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
            Adoraria conhecer o teu <span style={{ color: ACCENT }}>projecto</span> e{' '}
            <span style={{ color: ACCENT }}>trabalhar contigo</span>.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 max-w-2xl mx-auto text-white/70 text-lg"
          >
            Vamos criar algo extraordinário.
          </motion.p>

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
              {contactOpen ? 'Fechar formulário' : 'Vamos conversar'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'sobre-nos',
              name: 'Getboost Digital',
              accent: ACCENT,
              eyebrow: 'Contacto · Getboost',
              headline: 'Diz-nos em que podemos ajudar.',
              subhead: 'Seja um projecto novo, uma parceria ou apenas uma conversa exploratória, respondemos em menos de 24h.',
              goalOptions: [
                'Novo projecto digital',
                'Escalar produto existente',
                'Consultoria estratégica',
                'Parceria comercial',
                'Ainda a explorar',
              ],
              messagePlaceholder: 'Contexto, objectivos, timings, qualquer detalhe útil…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default SobreNos;
