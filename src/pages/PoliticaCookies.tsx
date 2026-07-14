import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Cookie, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';

const ACCENT = '#ff4000';

const manifestoLines = ['Transparência primeiro.', 'Cookies, sem letra pequena.'];

type Section = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const sections: Section[] = [
  {
    eyebrow: 'O que são',
    title: 'Cookies, explicados sem rodeios',
    tags: ['Ficheiros de texto', 'Guardados no browser', 'Sessão ou persistentes', 'First e third-party'],
    body: 'Um cookie é um pequeno ficheiro de texto que o teu browser guarda quando visitas um site. Serve para lembrar preferências (idioma, sessão iniciada), medir tráfego e, quando autorizado, personalizar comunicação. Podem ser de sessão (apagados ao fechar o browser) ou persistentes (com validade definida).',
  },
  {
    eyebrow: 'Cookies Essenciais',
    title: 'Necessários ao funcionamento do site',
    tags: ['Sessão de utilizador', 'Segurança', 'Preferência de idioma', 'Consentimento'],
    body: 'Estes cookies são indispensáveis. Sem eles, não é possível manter a sessão iniciada, guardar o teu idioma preferido nem lembrar a escolha que fizeste no banner de consentimento. Não podem ser desativados nas nossas definições, mas podes bloqueá-los diretamente no browser — algumas áreas do site deixarão de funcionar.',
  },
  {
    eyebrow: 'Analytics & Performance',
    title: 'Como medimos o que funciona',
    tags: ['Contagens agregadas', 'Origem de tráfego', 'Páginas mais vistas', 'Tempo médio'],
    body: 'Usamos analítica para perceber, de forma agregada e anónima, que páginas são mais úteis, onde as pessoas ficam presas e o que precisa de ser melhorado. Nenhuma decisão comercial individual é tomada com base nestes dados. Só ativamos estes cookies depois de dares consentimento explícito no banner.',
  },
  {
    eyebrow: 'Marketing & Remarketing',
    title: 'Comunicação relevante, quando autorizada',
    tags: ['Meta Pixel', 'Google Ads', 'LinkedIn Insight', 'Remarketing controlado'],
    body: 'Se aceitares, colocamos pixels de plataformas publicitárias para medir campanhas e mostrar comunicação relevante a quem já demonstrou interesse. Podes recusar por completo — o site continua a funcionar na íntegra e nunca serás bloqueado por essa escolha.',
  },
  {
    eyebrow: 'Terceiros e Integrações',
    title: 'Serviços externos que podemos carregar',
    tags: ['Vídeos incorporados', 'Mapas', 'Widgets sociais', 'Formulários e chat'],
    body: 'Algumas páginas incorporam serviços de terceiros (vídeos, mapas, chat, formulários) que definem os seus próprios cookies. Esses fornecedores atuam como responsáveis pelos dados que recolhem. Listamo-los na tabela de subprocessadores e recomendamos que consultes também as suas políticas.',
  },
  {
    eyebrow: 'Controlo do Utilizador',
    title: 'Como gerir ou revogar o consentimento',
    tags: ['Banner de consentimento', 'Definições do browser', 'Revogação a qualquer momento', 'Direito de acesso'],
    body: 'Podes alterar a tua escolha a qualquer momento a partir do banner de cookies (reabrível ao pé do rodapé) ou apagar os cookies diretamente nas definições do teu browser. Para exercer direitos ao abrigo do RGPD — acesso, retificação, apagamento, oposição — escreve para privacidade@getboost.digital.',
  },
];

const PoliticaCookies = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <Layout>
      <SEO
        title="Política de Cookies | Getboost Digital"
        description="Como a Getboost Digital utiliza cookies: categorias, finalidades, base legal e como podes controlar as tuas preferências a qualquer momento."
        canonical="/politica-de-cookies"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO — manifesto */}
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
            Política de Cookies · RGPD · Última revisão: Julho 2026
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
            Esta página é mantida pela <span className="text-white">Getboost Digital</span> e
            explica que cookies utilizamos, para quê, e como podes controlar as tuas preferências
            em qualquer momento. Sem jargão jurídico desnecessário — o que precisas de saber, direto.
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
              Contactar DPO
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/politica-de-privacidade"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Cookie className="h-4 w-4" style={{ color: ACCENT }} />
              Ver Política de Privacidade
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '4', v: 'Categorias de cookies' },
              { k: '0', v: 'Vendemos aos teus dados' },
              { k: '100%', v: 'Consentimento reversível' },
              { k: '24h', v: 'Resposta a pedidos RGPD' },
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

      {/* SECTIONS — accordion */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10">
            {sections.map((f, i) => {
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

          {/* Base legal + contactos */}
          <div className="mt-20 grid md:grid-cols-2 gap-10 border-t border-white/10 pt-16">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Base legal
              </span>
              <p className="mt-4 text-white/70 leading-relaxed">
                Tratamos dados ao abrigo do Regulamento (UE) 2016/679 (RGPD) e da Lei n.º 41/2004
                relativa às comunicações electrónicas. Os cookies não-essenciais só são colocados
                mediante consentimento explícito, revogável a qualquer momento sem prejuízo do
                acesso ao site.
              </p>
            </div>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Responsável pelo tratamento
              </span>
              <p className="mt-4 text-white/70 leading-relaxed">
                Getboost Digital · Encarregado de Proteção de Dados<br />
                Email:{' '}
                <a href="mailto:privacidade@getboost.digital" className="underline hover:text-white">
                  privacidade@getboost.digital
                </a>
                <br />
                Podes também apresentar reclamação junto da CNPD em{' '}
                <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                  cnpd.pt
                </a>.
              </p>
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
            Dúvidas sobre{' '}
            <span style={{ color: ACCENT }}>privacidade</span> ou{' '}
            <span style={{ color: ACCENT }}>consentimento</span>?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14"
          >
            <Link
              to="/contact"
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Falar com o DPO
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default PoliticaCookies;
