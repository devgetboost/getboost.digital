import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Grid2x2,
  Minus,
  Circle,
  Bot,
  Megaphone,
  Code2,
  Workflow,
  LineChart,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO, { organizationSchema } from '@/components/SEO';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import type { StoredAudit } from '@/lib/auditHistory';
import logoPikto from '@/assets/logos/logo-pikto.svg';
import logoHostify from '@/assets/logos/logo-hostify.svg';
import logoProSafe from '@/assets/logos/logo-prosafe360.svg';
import logoMotivae from '@/assets/logos/logo-motivae.svg';
import logoQook from '@/assets/logos/logo-qook.svg';
import logoAgrifly from '@/assets/logos/logo-agrifly.svg';
import logoKasccab from '@/assets/logos/logo-kasccab.svg';

import qookMockup from '@/assets/qook/saas-qook-mockup.png.asset.json';
import hostifyMockup from '@/assets/hostify/mockup.png.asset.json';
import motivaeMockup from '@/assets/motivae/mockup.png.asset.json';

const ACCENT = '#ff4000';

const manifestoLines = ['O teu negócio', 'não precisa de mais horas.', 'Precisa de mais inteligência.'];

type Pillar = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const pillars: Pillar[] = [
  {
    eyebrow: 'Agentes de IA · 24/7',
    title: 'IA que atende, qualifica e agenda por ti',
    tags: ['Atendimento autónomo', 'Qualificação de leads', 'Agenda comercial', 'WhatsApp · Web · Instagram'],
    body: 'Instalamos operadores digitais no teu site, WhatsApp e redes. Conversam de forma natural, percebem intenção real, filtram curiosos e marcam reuniões directamente na tua agenda — enquanto tu dormes ou estás em obra com um cliente.',
    icon: Bot,
    href: '/agentes-ia',
  },
  {
    eyebrow: 'Growth & Aquisição',
    title: 'Tráfego pago e SEO que geram pipeline, não vaidade',
    tags: ['Google & Meta Ads', 'SEO técnico', 'Landing pages', 'CRO'],
    body: 'Combinamos aquisição paga, SEO e páginas de conversão desenhadas para uma única acção: preencher a agenda comercial. Cada euro investido tem um destino, cada lead tem origem rastreada e cada semana tem decisão baseada em dados.',
    icon: Megaphone,
    href: '/marketing-digital',
  },
  {
    eyebrow: 'Software · SaaS · Web',
    title: 'Produto digital construído para escalar sem re-escrever',
    tags: ['Web apps', 'SaaS', 'Mobile', 'MVP em 30 dias'],
    body: 'Desenvolvemos software à medida quando o mercado não tem uma resposta suficientemente boa. Do MVP ao produto multi-tenant, com arquitectura pronta para crescer, integrar e automatizar — sem dívida técnica desde o dia zero.',
    icon: Code2,
    href: '/servicos/desenvolvimento-saas',
  },
  {
    eyebrow: 'Automação & Operações',
    title: 'Processos internos automatizados de ponta a ponta',
    tags: ['CRM & ERP', 'Integrações', 'Back-office IA', 'Fluxos personalizados'],
    body: 'Ligamos as ferramentas que já usas, eliminamos copy-paste manual e criamos agentes internos que tratam de relatórios, propostas, follow-ups e validação documental. A tua equipa foca em decisões — o resto executa-se sozinho.',
    icon: Workflow,
    href: '/servicos/integracoes-erp-crm',
  },
  {
    eyebrow: 'Estratégia & Consultoria',
    title: 'Um plano digital com prazos, responsáveis e KPIs',
    tags: ['Auditoria digital', 'Roadmap 90 dias', 'Métricas de negócio', 'Acompanhamento contínuo'],
    body: 'Não entregamos apresentações bonitas — entregamos um plano executável, com prioridades claras, orçamento realista e métricas ligadas ao P&L. E ficamos ao lado da tua equipa até os números mudarem.',
    icon: LineChart,
    href: '/servicos',
  },
];

const stats = [
  { k: '30+', v: 'Projetos entregues' },
  { k: '24/7', v: 'Agentes IA a operar' },
  { k: '<30d', v: 'Do briefing ao MVP' },
  { k: '3x', v: 'Leads qualificadas médias' },
];

const process = [
  {
    step: '01',
    title: 'Auditoria comercial',
    body: 'Em 7 minutos analisamos o teu site, presença digital e funil actual. Sais com um relatório concreto do que está a travar vendas.',
  },
  {
    step: '02',
    title: 'Plano de ataque',
    body: 'Traduzimos a auditoria num roadmap de 90 dias com prioridades, entregáveis semanais e KPIs ligados a receita — não a cliques.',
  },
  {
    step: '03',
    title: 'Execução obsessiva',
    body: 'Equipa dedicada em design, código, IA e media. Reuniões semanais, dashboards partilhados e decisões documentadas.',
  },
  {
    step: '04',
    title: 'Escala e optimização',
    body: 'Quando o motor gira, subimos a velocidade: mais canais, mais automações, mais mercados. Sem re-fazer o que já está a funcionar.',
  },
];

const clientLogos = [
  { name: 'Pikto', src: logoPikto },
  { name: 'Hostify', src: logoHostify },
  { name: 'ProSafe360', src: logoProSafe },
  { name: 'Motivae', src: logoMotivae },
  { name: 'Qook', src: logoQook },
  { name: 'Agrifly', src: logoAgrifly },
  { name: 'Kasccab', src: logoKasccab },
];


type Showcase = {
  kind: 'Produto' | 'Serviço';
  name: string;
  tagline: string;
  body: string;
  href: string;
  logo?: string;
  image?: string;
  color: string;
};

const showcaseSlides: Showcase[] = [
  {
    kind: 'Produto',
    name: 'Qook',
    tagline: 'O sistema all-in-one para restauração moderna',
    body: 'POS, self-order, KDS, pagamentos e menu digital — tudo numa plataforma pensada para restaurantes que querem servir mais em menos tempo.',
    href: '/solucoes/qook',
    logo: logoQook,
    image: qookMockup.url,
    color: '#FF1C00',
  },
  {
    kind: 'Produto',
    name: 'Hostify',
    tagline: 'Gestão inteligente para alojamento local',
    body: 'Automatiza reservas, check-ins, comunicação com hóspedes e limpeza. Uma plataforma que devolve horas ao teu dia.',
    href: '/solucoes/hostify',
    logo: logoHostify,
    image: hostifyMockup.url,
    color: '#03A63C',
  },
  {
    kind: 'Produto',
    name: 'Motivae',
    tagline: 'Plataforma de benefícios e engagement de equipas',
    body: 'Motiva, reconhece e retém talento com uma plataforma pensada para RH modernos.',
    href: '/investidores/motivae',
    logo: logoMotivae,
    color: '#F6137E',
    image: motivaeMockup.url,
  },
  {
    kind: 'Produto',
    name: 'Pikto',
    tagline: 'Criatividade visual assistida por IA',
    body: 'Gera imagens, mockups e conteúdos visuais consistentes com a tua marca em minutos, não em dias.',
    href: '/solucoes/pikto',
    logo: logoPikto,
    color: '#056CF2',
  },
  {
    kind: 'Produto',
    name: 'Trackfy',
    tagline: 'Rastreamento e operações em tempo real',
    body: 'Acompanha frota, equipas e activos com dashboards claros e alertas accionáveis.',
    href: '/solucoes/trackfy',
    color: '#003264',
  },
  {
    kind: 'Produto',
    name: 'ProSafe360',
    tagline: 'Segurança e compliance em obra, em tempo real',
    body: 'Gestão integrada de segurança, formação e auditorias para empresas de construção que não podem falhar.',
    href: '/investidores/prosafe360',
    logo: logoProSafe,
    color: '#4A99F9',
  },
  {
    kind: 'Serviço',
    name: 'Agentes de IA',
    tagline: 'IA que atende, qualifica e agenda 24/7',
    body: 'Instalamos agentes autónomos no teu site, WhatsApp e redes que conversam, filtram curiosos e marcam reuniões directamente na tua agenda.',
    href: '/agentes-ia',
    color: ACCENT,
  },
];

function TypewriterPhrases({ phrases }: { phrases: string[] }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), 1600);
      return () => clearTimeout(t);
    }
    if (deleting && text === '') {
      setDeleting(false);
      setPhraseIdx((p) => (p + 1) % phrases.length);
      return;
    }
    const t = setTimeout(
      () => {
        setText((prev) =>
          deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1),
        );
      },
      deleting ? 30 : 55,
    );
    return () => clearTimeout(t);
  }, [text, deleting, phraseIdx, phrases]);

  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), '');
  return (
    <span className="relative inline-grid align-top text-white/95">
      {/* Invisible longest phrase reserves the height/width so layout never shifts */}
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre-wrap">
        {longest}
      </span>
      <span className="col-start-1 row-start-1 whitespace-pre-wrap">
        {text}
        <span
          aria-hidden
          className="inline-block w-[0.08em] h-[0.9em] align-[-0.1em] ml-1 bg-white animate-pulse"
        />
      </span>
    </span>
  );
}

function ProductsShowcase() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % showcaseSlides.length), 6000);
    return () => clearInterval(id);
  }, []);
  const slide = showcaseSlides[i];
  return (
    <section
      className="relative overflow-hidden text-white transition-colors duration-500"
      style={{ backgroundColor: slide.color }}
    >
      {/* subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-20">
        <div className="flex items-end justify-between gap-6 mb-8 md:mb-10">
          <div>
            <h2 className="text-3xl md:text-5xl font-black leading-[1.05] tracking-tight max-w-3xl">
              Soluções digitais que estamos a{' '}
              <TypewriterPhrases
                phrases={[
                  'Construir contigo.',
                  'Impulsionar com tecnologia e IA.',
                  'Transformar em soluções inteligentes.',
                  'Escalar com automação avançada.',
                  'Criar para o futuro do teu negócio.',
                ]}
              />
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {showcaseSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Ver slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="grid md:grid-cols-[1.05fr_1fr] gap-8 md:gap-12 items-end"
            >
              <div className="pb-14 md:pb-20">
                <span className="inline-block font-mono text-[10px] md:text-[11px] uppercase tracking-[0.24em] px-3 py-1 rounded-full border border-white/40 text-white/90">
                  {slide.kind}
                </span>
                <h3 className="mt-5 text-4xl md:text-6xl font-black tracking-tight leading-[1.02]">
                  {slide.name}
                </h3>
                <p className="mt-4 text-lg md:text-2xl font-medium text-white/95 leading-snug">
                  {slide.tagline}
                </p>
                <p className="mt-4 text-white/85 text-base md:text-lg leading-relaxed max-w-xl">
                  {slide.body}
                </p>
                <Link
                  to={slide.href}
                  className="mt-7 inline-flex items-center gap-2 bg-white font-semibold px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
                  style={{ color: slide.color }}
                >
                  Descobrir <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative flex items-end justify-center min-h-[260px] md:min-h-[380px]">
                {slide.image ? (
                  <img
                    src={slide.image}
                    alt={slide.name}
                    className="w-full h-auto max-h-[440px] object-contain object-bottom drop-shadow-2xl block"
                  />
                ) : (
                  <div className="mb-14 md:mb-20 w-full aspect-[4/3] max-h-[360px] rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm flex items-center justify-center p-10">
                    {slide.logo ? (
                      <img
                        src={slide.logo}
                        alt={slide.name}
                        className="max-h-24 md:max-h-32 object-contain"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    ) : (
                      <Bot className="h-24 w-24 md:h-32 md:w-32 text-white" strokeWidth={1.2} />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* mobile dots */}
        <div className="pb-8 pt-6 flex md:hidden items-center gap-2 justify-center">
          {showcaseSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Ver slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? 'w-8 bg-white' : 'w-4 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}



const Index = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Getboost Digital — Agentes IA, Growth e Software que geram clientes"
        description="Transformamos empresas com agentes de IA autónomos, marketing digital orientado a receita e software à medida. Auditoria comercial gratuita em 7 minutos."
        canonical="/"
        lang={i18n.language as 'pt' | 'en' | 'es'}
        jsonLd={organizationSchema}
      />

      {/* HERO — products & services slide */}
      <ProductsShowcase />

      {/* CLIENT LOGOS */}
      <section className="relative bg-[#0a0603] py-14 before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#ff4000]/60 before:to-transparent">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40 text-center">
            Marcas que já correm com a nossa tecnologia
          </p>
          <div
            className="mt-8 group relative overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
          >
            <div className="flex w-max animate-marquee-x group-hover:[animation-play-state:paused]">
              {[...clientLogos, ...clientLogos].map((logo, i) => (
                <div
                  key={`${logo.name}-${i}`}
                  className="shrink-0 w-40 md:w-52 flex items-center justify-center px-6"
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-10 md:h-12 object-contain opacity-50 hover:opacity-100 transition-opacity"
                    style={{ filter: 'brightness(0) invert(1)' }}
                    loading="lazy"
                  />
                </div>
              ))}
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`soon-${i}`}
                  className="shrink-0 w-40 md:w-52 flex items-center justify-center px-6"
                  aria-label="A tua marca pode estar aqui"
                  title="A tua marca pode estar aqui"
                >
                  <span className="h-10 md:h-12 flex items-center justify-center px-4 rounded-full border border-dashed border-white/25 text-white/50 hover:text-white/90 hover:border-white/50 transition-all font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] whitespace-nowrap">
                    A tua marca aqui
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>




      {/* FEATURE LIST — accordion */}
      <section className="relative overflow-hidden bg-[#120906] text-white py-24 md:py-32 before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#ff4000]/40 before:to-transparent">
        <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.45) 0%, rgba(10,6,3,0) 65%)' }} />
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl mb-16">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
              O que fazemos
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl font-black leading-[1.02] tracking-tight">
              5 alavancas para <span style={{ color: ACCENT }}>crescer com previsibilidade</span>.
            </h2>
            <p className="mt-6 text-white/70 text-lg leading-relaxed">
              Cada peça funciona sozinha. Juntas, transformam o teu digital num sistema que atrai,
              converte e opera sem depender de heroísmos individuais.
            </p>
          </div>

          <div className="border-t border-white/10">
            {pillars.map((f, i) => {
              const isOpen = openIndex === i;
              const Icon = f.icon;
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
                          {isOpen ? <Circle className="h-4 w-4 fill-current" /> : <Icon className="h-6 w-6" />}
                        </span>
                        <h3 className="text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight">
                          {f.title}
                        </h3>
                      </div>
                      <div className="mt-8 ml-0 md:ml-11 flex flex-wrap gap-3">
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
                            <Link
                              to={f.href}
                              className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em]"
                              style={{ color: ACCENT }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver detalhe <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
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
      <section className="relative bg-black text-white py-24 md:py-32 before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#ff4000]/40 before:to-transparent">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl mb-16">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
              Como trabalhamos
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl font-black leading-[1.02] tracking-tight">
              De briefing a resultado, <span style={{ color: ACCENT }}>sem drama</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {process.map((p) => (
              <div key={p.step} className="bg-black p-8 md:p-10 min-h-[260px] flex flex-col">
                <div className="font-mono text-sm tracking-[0.22em]" style={{ color: ACCENT }}>
                  {p.step}
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight">{p.title}</h3>
                <p className="mt-4 text-sm text-white/60 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVA / RESULTADOS */}
      <section className="relative overflow-hidden bg-[#120906] text-white py-24 md:py-32 before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#ff4000]/40 before:to-transparent">
        <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[560px] w-[560px] rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.5) 0%, rgba(10,6,3,0) 65%)' }} />
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
              Prova real
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-black leading-[1.05] tracking-tight">
              Não vendemos <span style={{ color: ACCENT }}>promessas</span>. Vendemos operações que já{' '}
              <span style={{ color: ACCENT }}>funcionam</span>.
            </h2>
            <p className="mt-6 text-white/70 leading-relaxed">
              Do PMS que corre em centenas de propriedades ao SaaS de segurança no trabalho, do POS
              para restauração ao coach emocional com IA — construímos, mantemos e escalamos produtos
              digitais reais, com utilizadores reais, todos os dias.
            </p>
            <Link
              to="/portfolio"
              className="mt-10 inline-flex items-center gap-3 border-2 px-6 py-3.5 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Ver portefólio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10">
            {[
              { k: '+300%', v: 'crescimento orgânico médio em 6 meses' },
              { k: '−70%', v: 'tempo em tarefas administrativas' },
              { k: '5x', v: 'reuniões comerciais qualificadas' },
              { k: '30d', v: 'do zero a MVP em produção' },
            ].map((r) => (
              <div key={r.k} className="bg-[#120906] p-8">
                <div className="font-mono text-4xl md:text-5xl font-black" style={{ color: ACCENT }}>
                  {r.k}
                </div>
                <div className="mt-3 text-xs uppercase tracking-widest text-white/50 leading-relaxed">
                  {r.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative bg-black text-white py-28 md:py-40 before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#ff4000]/40 before:to-transparent">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,6.5vw,5.5rem)]"
          >
            Adoraria conhecer o teu <span style={{ color: ACCENT }}>projecto</span> e trabalhar{' '}
            <span style={{ color: ACCENT }}>contigo</span>.
          </motion.h2>
          <p className="mt-8 text-white/60 max-w-2xl mx-auto text-lg">
            Vamos criar algo extraordinário. Conta-nos o contexto, os objectivos e o prazo — voltamos
            com um plano concreto em menos de 48 horas.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {contactOpen ? 'Fechar formulário' : 'Falar com um consultor'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-5 font-mono text-xs uppercase tracking-[0.28em] text-white/60 hover:text-white transition-colors"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Auditoria grátis 7 min
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'homepage',
              name: 'Getboost Digital',
              accent: ACCENT,
              eyebrow: 'Briefing · Projecto Digital',
              headline: 'Vamos desenhar o próximo passo do teu negócio.',
              subhead: 'Descreve o contexto, os objectivos e onde queres chegar. Voltamos com um plano concreto, prazos e investimento em menos de 48 horas.',
              goalOptions: [
                'Gerar mais leads qualificadas',
                'Automatizar operações com IA',
                'Lançar um produto/SaaS novo',
                'Redesenhar o site e a marca',
                'Estruturar marketing e vendas',
                'Ainda a explorar',
              ],
              messagePlaceholder: 'Contexto do negócio, objectivos a 6 meses, orçamento aproximado, prazo desejado…',
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

export default Index;
