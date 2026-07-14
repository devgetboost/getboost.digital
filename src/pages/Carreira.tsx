import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Grid2x2, Minus, Circle, Sparkles, MapPin, Clock, MousePointer2, Users, MessageSquare } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Constrói o teu percurso.', 'Junta-te ao squad.'];

type Vaga = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const vagas: Vaga[] = [
  {
    eyebrow: 'Engenharia · Full-time · Remoto/Híbrido',
    title: 'Full-Stack Developer (React + Node)',
    tags: ['React', 'TypeScript', 'Node.js', 'Supabase', 'Sénior'],
    body: 'Vais liderar features end-to-end em produtos SaaS multi-tenant. Procuramos alguém que escreva código pensado para durar, saiba justificar decisões de arquitectura e se sinta confortável a falar directamente com o cliente. Bónus se já operaste sistemas em produção com observabilidade a sério.',
  },
  {
    eyebrow: 'Inteligência Artificial · Full-time · Híbrido',
    title: 'AI Engineer — Agentes & RAG',
    tags: ['LLMs', 'RAG', 'Python', 'LangGraph', 'MLOps'],
    body: 'Desenhas agentes autónomos e pipelines de retrieval para clientes reais — não demos. Avaliação contínua, governance, function calling e integração com sistemas legacy fazem parte do dia-a-dia. Precisamos de rigor experimental e capacidade de traduzir modelos em produtos utilizáveis.',
  },
  {
    eyebrow: 'Design · Full-time · Remoto',
    title: 'Product Designer (UI/UX + Motion)',
    tags: ['Figma', 'Design Systems', 'Motion', 'UX Research'],
    body: 'Vais desenhar interfaces que convertem e sistemas coerentes entre marca e produto. Trabalhas com engenharia desde o dia zero — nada de deitar mockups por cima da parede. Portfolio com processo visível pesa mais do que anos de experiência.',
  },
  {
    eyebrow: 'Marketing · Full-time · Híbrido',
    title: 'Growth Marketer (Paid + SEO/GEO)',
    tags: ['Meta Ads', 'Google Ads', 'SEO', 'Analytics', 'Copy'],
    body: 'Estruturas funis de aquisição, escalas campanhas com ROI positivo e escreves copy que vende. Interpretas dados sem drama e sabes distinguir vaidade de resultado. Trabalhas próximo do produto — o teu output tem impacto directo na receita.',
  },
  {
    eyebrow: 'Operações · Full-time · Presencial (Figueira da Foz)',
    title: 'Project Manager / Client Lead',
    tags: ['Delivery', 'QA', 'Comunicação', 'Gestão de Expectativas'],
    body: 'Serás o tecido conectivo entre equipa técnica e cliente. Garantes timings, qualidade da entrega e continuidade pós-launch. Precisamos de alguém metódico, calmo em fogo cruzado e obcecado por comunicação clara — em português impecável e inglês fluente.',
  },
  {
    eyebrow: 'Estágio · 6 meses · Presencial/Híbrido',
    title: 'Estágio Profissional — Dev, Design ou Growth',
    tags: ['IEFP', 'Mentoria', 'Projectos reais', 'Portugal'],
    body: 'Abrimos ciclicamente vagas de estágio profissional (IEFP) em desenvolvimento, design e marketing. Trabalhas em projectos reais desde a primeira semana, com mentoria estruturada e feedback semanal. Não fazes café — construis coisas que vão para produção.',
  },
];

const processo = [
  {
    icon: MousePointer2,
    title: 'Primeiro contacto',
    body: 'Envias o teu CV, portfolio ou GitHub. Podes também ser contactado por nós através do LinkedIn se cruzarmos caminho. Sem cover letters obrigatórias — mostra-nos o teu trabalho.',
  },
  {
    icon: Users,
    title: 'Conversa & avaliação',
    body: 'Uma conversa honesta sobre o teu percurso, expectativas e o que procuras. Em posições técnicas, propomos um pequeno case prático — pago se ultrapassar 2 horas.',
  },
  {
    icon: MessageSquare,
    title: 'Decisão & feedback',
    body: 'Damos resposta em menos de 10 dias, sempre. Se não avançarmos, explicamos porquê — feedback útil é o mínimo que devemos a quem investiu tempo connosco.',
  },
];

const CarreiraPage = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Carreira Getboost — Vagas abertas e cultura de squad | Getboost Digital"
        description="Descobre as vagas abertas na Getboost Digital: engenharia, IA, design, marketing e operações. Trabalha em produtos reais, com autonomia e impacto directo."
        canonical="/carreira"
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
            Carreira · Vagas abertas · Portugal & Remoto
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
            Aqui trabalhas em <em className="not-italic text-white">produtos reais</em>, com
            autonomia e impacto directo na conta do cliente. Sem burocracia inventada, sem
            <em className="not-italic"> managers</em> que só encaminham emails. Falas com quem
            decide. Constróis com quem executa.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <a
              href="#vagas"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Ver vagas abertas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <Link
              to="/equipa"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
              Conhecer o squad
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '6', v: 'Vagas abertas' },
              { k: '100%', v: 'Trabalho remoto ou híbrido' },
              { k: '<10d', v: 'Resposta ao candidato' },
              { k: '1:1', v: 'Mentoria contínua' },
            ].map((s) => (
              <div key={s.v}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CULTURA — código de cultura */}
      <section className="bg-[#f5f3ef] text-[#0a0603] py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#0a0603]/60">
              Código de cultura
            </span>
            <h2 className="mt-6 text-4xl md:text-6xl font-black leading-[1.02] tracking-tight">
              Envolve-te e inspira-te com o nosso <span style={{ color: ACCENT }}>Código de Cultura</span>.
            </h2>
            <p className="mt-8 text-base md:text-lg leading-relaxed text-[#0a0603]/75 max-w-lg">
              O nosso Código de Cultura é a base de tudo o que fazemos. Trabalhamos com propósito,
              foco no cliente e compromisso absoluto com a excelência do que entregamos.
            </p>
            <p className="mt-4 text-base md:text-lg leading-relaxed text-[#0a0603]/75 max-w-lg">
              Valorizamos diversidade, verdade e crescimento contínuo — criando soluções inovadoras
              com resultados baseados em dados, sempre com uma boa dose de parceria genuína entre
              equipa e cliente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {[
              { t: 'Trabalho com propósito', b: 'Assumimos responsabilidade por criar mudanças positivas e duradouras — não entregáveis descartáveis.', bg: '#0a0603', fg: 'white' },
              { t: 'Foco no cliente', b: 'Construímos histórias de sucesso que impulsionam empresas a alcançar os seus objectivos reais.', bg: '#141414', fg: 'white' },
              { t: 'Aprendizagem contínua', b: 'Erramos rápido, aprendemos rápido e agimos com inteligência para garantir os melhores resultados.', bg: '#242424', fg: 'white' },
              { t: 'Diversão no processo', b: 'Enfrentamos desafios e celebramos cada conquista — o caminho importa tanto como o destino.', bg: '#3a3a3a', fg: 'white' },
              { t: 'Valores acima de tudo', b: 'Trabalhamos com quem partilha os nossos princípios, valorizando o benefício mútuo a longo prazo.', bg: '#c9c4bc', fg: '#0a0603' },
              { t: 'Verdade e transparência', b: 'Ouvimos e falamos com honestidade, acolhendo feedback construtivo para crescer todos juntos.', bg: '#d4cfc7', fg: '#0a0603' },
            ].map((c, i) => (
              <motion.div
                key={c.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl p-6"
                style={{ background: c.bg, color: c.fg }}
              >
                <h3 className="font-bold text-base mb-2 leading-snug">{c.t}</h3>
                <p className="text-xs leading-relaxed opacity-80">{c.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIBERDADE */}
      <section className="bg-[#f5f3ef] text-[#0a0603] pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black leading-[1.05] tracking-tight">
              Liberdade para criar <span style={{ color: ACCENT }}>de qualquer lugar</span>.
            </h2>
            <p className="mt-8 text-base md:text-lg leading-relaxed text-[#0a0603]/75">
              Valorizamos a tua autonomia e oferecemos trabalho remoto, híbrido ou presencial —
              ajustado às tuas necessidades. Confiamos na tua dedicação para alcançar resultados
              extraordinários, independentemente de onde escolhes trabalhar.
            </p>
            <p className="mt-4 text-base md:text-lg leading-relaxed text-[#0a0603]/75">
              Reconhecemos que cada pessoa tem preferências únicas. Por isso, promovemos um
              ambiente flexível, que apoia o equilíbrio entre vida pessoal e profissional — porque
              equipas descansadas constroem melhor.
            </p>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#0a0603]/5 border border-[#0a0603]/10 grid place-items-center">
            <div className="text-center px-8">
              <Briefcase className="h-12 w-12 mx-auto mb-4" style={{ color: ACCENT }} />
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#0a0603]/60">
                Remoto · Híbrido · Presencial
              </p>
              <p className="mt-4 text-2xl font-bold leading-snug">
                O modelo certo para cada perfil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VAGAS ACCORDION */}
      <section id="vagas" className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-16 flex items-center gap-4">
            <Briefcase className="h-5 w-5" style={{ color: ACCENT }} />
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-white/60">
              Vagas abertas · Actualizado semanalmente
            </span>
          </div>
          <div className="border-t border-white/10">
            {vagas.map((f, i) => {
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
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.35 }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm md:text-base leading-relaxed text-white/70">
                              {f.body}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-4 text-xs font-mono uppercase tracking-[0.2em] text-white/50">
                              <span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5" style={{ color: ACCENT }} /> Portugal</span>
                              <span className="inline-flex items-center gap-2"><Clock className="h-3.5 w-3.5" style={{ color: ACCENT }} /> Início imediato</span>
                            </div>
                          </motion.div>
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

      {/* PROCESSO */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-white/50">
              Processo de contratação
            </span>
            <h2 className="mt-6 text-4xl md:text-6xl font-black leading-[1.02] tracking-tight">
              Simples e <span style={{ color: ACCENT }}>transparente</span>.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {processo.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <p.icon className="h-10 w-10 mb-6" style={{ color: ACCENT }} strokeWidth={1.25} />
                <div className="font-mono text-xs uppercase tracking-[0.28em] text-white/40 mb-2">
                  0{i + 1}
                </div>
                <h3 className="text-xl font-bold mb-4">{p.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-[#0a0603] text-white py-28 md:py-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
          >
            Adoraria conhecer o teu <span style={{ color: ACCENT }}>percurso</span> e{' '}
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
              {contactOpen ? 'Fechar candidatura' : 'Candidatar-me'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'carreira',
              name: 'Carreira Getboost',
              accent: ACCENT,
              eyebrow: 'Candidatura · Carreira',
              headline: 'Diz-nos quem és e o que procuras.',
              subhead: 'Partilha o teu percurso, portfolio ou GitHub. Respondemos em menos de 10 dias — sempre com feedback útil.',
              goalOptions: [
                'Vaga específica listada acima',
                'Candidatura espontânea',
                'Estágio profissional (IEFP)',
                'Freelance / colaboração pontual',
                'Ainda a explorar oportunidades',
              ],
              messagePlaceholder: 'Link para portfolio/GitHub/LinkedIn, vaga de interesse, disponibilidade…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default CarreiraPage;
