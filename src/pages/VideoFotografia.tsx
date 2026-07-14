import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import type { StoredAudit } from '@/lib/auditHistory';

const ACCENT = '#ff4000';

const manifestoLines = ['Uma imagem', 'vende por dez.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Direção Criativa',
    title: 'Conceito, Storyboard e Art Direction',
    tags: ['Moodboards', 'Storyboarding', 'Referências Cinematográficas', 'Guideline Visual'],
    body: 'Antes da câmara ligar, a ideia já está afinada. Desenhamos o conceito visual, definimos referências, iluminação, paletas e ritmo narrativo — para que cada frame trabalhe a favor da marca e não contra ela.',
  },
  {
    eyebrow: 'Produção em Estúdio & Locação',
    title: 'Rodagens Profissionais em Qualquer Formato',
    tags: ['4K/6K Cinema', 'Iluminação Cine', 'Áudio Broadcast', 'Equipa Full Crew'],
    body: 'Câmaras cinema, ópticas primes, iluminação controlada e áudio de qualidade broadcast. Produzimos institucionais, product films, entrevistas, testemunhos e conteúdo social — em estúdio, on-location ou remoto.',
  },
  {
    eyebrow: 'Drone & Aéreos Certificados',
    title: 'Imagem Aérea com Piloto Licenciado ANAC',
    tags: ['Licença ANAC', 'FPV Cinematográfico', 'Mapping 2D/3D', 'Inspeção Técnica'],
    body: 'Planos aéreos que mudam a escala da tua história — imobiliário, indústria, turismo, eventos. Operação legal, seguro civil, autorizações tratadas por nós. Também mapeamento fotogramétrico e inspeção de estruturas.',
  },
  {
    eyebrow: 'Fotografia de Marca',
    title: 'Produto, Lifestyle, Corporate & Editorial',
    tags: ['Packshot Estúdio', 'Lifestyle Editorial', 'Retratos Corporate', 'Interiores/Arquitetura'],
    body: 'Bibliotecas visuais consistentes para website, e-commerce, redes sociais e imprensa. Fotografamos produto com precisão, equipas com naturalidade e espaços com carácter — tudo alinhado à identidade da marca.',
  },
  {
    eyebrow: 'Pós-produção Cinematográfica',
    title: 'Edição, Color Grading e Sound Design',
    tags: ['Edição Narrativa', 'Color DaVinci', 'Sound Mix Dolby', 'Motion & VFX'],
    body: 'A magia acontece na sala de edição. Cortes rítmicos, color grading assinado, mistura de som, motion graphics e efeitos visuais. Entregamos masters para cinema, web, TV e formatos verticais nativos.',
  },
  {
    eyebrow: 'Conteúdo Contínuo',
    title: 'Content Packs Mensais para Redes',
    tags: ['Reels & Shorts', 'Foto Social', 'UGC Estilizado', 'Recorrência Mensal'],
    body: 'Um dia de rodagem, um mês de conteúdo. Planeamos e capturamos em bateria — dezenas de peças curtas prontas para publicar, com edição, legendas e formatos verticais optimizados para cada plataforma.',
  },
];

const pillars = [
  {
    n: '01',
    t: 'Imagem que faz parar o scroll',
    d: 'Peças visuais com direção clara, luz cuidada e edição rítmica — desenhadas para captar atenção nos primeiros três segundos.',
  },
  {
    n: '02',
    t: 'Consistência ao longo do ano',
    d: 'Uma linguagem visual coerente em todos os canais e formatos, reforçada por bibliotecas de conteúdo renováveis mensalmente.',
  },
  {
    n: '03',
    t: 'Vídeo que vende, não decora',
    d: 'Cada plano tem um objectivo comercial. Storytelling ao serviço da conversão, do posicionamento e da confiança na marca.',
  },
];

const process = [
  { t: 'Briefing', d: 'Alinhamos objectivo, público, mensagem-chave e KPI de negócio por peça.' },
  { t: 'Pré-produção', d: 'Guião, storyboard, casting, locações, autorizações, cronograma e checklist técnico.' },
  { t: 'Rodagem', d: 'Equipa completa em campo — câmara, luz, som, direção e produção sincronizadas.' },
  { t: 'Edição', d: 'Montagem narrativa, seleção de takes, ritmo e primeiro corte para aprovação.' },
  { t: 'Finalização', d: 'Color grading, sound design, motion graphics, legendas e masters por formato.' },
  { t: 'Distribuição', d: 'Entrega de assets prontos para website, YouTube, social, imprensa e paid media.' },
];

const VideoFotografia = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Vídeo e Fotografia — Produção Audiovisual & Drone | Getboost Digital"
        description="Produção de vídeo, fotografia de marca e imagem aérea com drone. Conceito, rodagem, edição cinematográfica e content packs mensais."
        canonical="/solucoes/video-fotografia"
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
            Cinema · Photo · Aerial · Post-production
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
            Não fazemos vídeos bonitos por fazer. Construímos narrativas visuais que
            posicionam a marca, aceleram o funil e geram desejo. Cinema, foto, drone e
            pós-produção sob o mesmo tecto — do storyboard ao master final.
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
              Pedir Orçamento
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Auditoria visual 7 min
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '6K', v: 'Câmaras cinema' },
              { k: 'ANAC', v: 'Piloto de drone licenciado' },
              { k: '+40', v: 'Peças por dia de rodagem' },
              { k: '72h', v: 'Primeiro corte entregue' },
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

      {/* PILARES */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid gap-16 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="absolute -top-6 -left-2 font-black text-[7rem] leading-none text-white/[0.06] select-none">
                {p.n}
              </div>
              <div className="relative">
                <h3 className="text-xl md:text-2xl font-bold tracking-tight">{p.t}</h3>
                <p className="mt-4 text-sm md:text-base text-white/60 leading-relaxed">{p.d}</p>
              </div>
            </motion.div>
          ))}
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

      {/* PROCESSO */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,5vw,4.5rem)] max-w-4xl"
          >
            Do briefing ao <span style={{ color: ACCENT }}>master final</span>.
          </motion.h2>

          <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {process.map((p, i) => (
              <motion.div
                key={p.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="relative"
              >
                <div className="absolute -top-4 -left-1 font-black text-[5rem] leading-none text-white/[0.05] select-none">
                  0{i + 1}
                </div>
                <div className="relative">
                  <h4 className="text-lg font-bold" style={{ color: ACCENT }}>{p.t}</h4>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{p.d}</p>
                </div>
              </motion.div>
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
            Vamos <span style={{ color: ACCENT }}>filmar</span> algo que{' '}
            <span style={{ color: ACCENT }}>ninguém esquece</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Falar com um realizador'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'video-fotografia',
              name: 'Vídeo e Fotografia',
              accent: ACCENT,
              eyebrow: 'Briefing · Produção Audiovisual',
              headline: 'Vamos desenhar a tua produção.',
              subhead: 'Conta-nos o formato, objectivo e prazo. Preparamos proposta técnica, orçamento e cronograma detalhado.',
              goalOptions: [
                'Vídeo institucional / brand film',
                'Product film / e-commerce',
                'Testemunhos e case studies',
                'Fotografia de marca / catálogo',
                'Imagem aérea com drone',
                'Content pack mensal para redes',
              ],
              messagePlaceholder: 'Formato desejado, duração, locações, número de peças, prazo de entrega, referências visuais…',
            }}
          />
        </div>
      </section>

      <CommercialAuditModal
        open={auditOpen}
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default VideoFotografia;
