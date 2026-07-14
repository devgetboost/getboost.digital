import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Cada quilómetro', 'sob controlo.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Rastreamento em tempo real',
    title: 'Localização precisa a cada segundo, em qualquer parte do mundo',
    tags: ['GPS · GLONASS · Galileo · BeiDou', 'Histórico de rotas', 'Modo anti-roubo', 'Alertas imediatos'],
    body: 'O Trackfy segue os teus veículos com precisão multi-constelação e atualiza a posição no mapa continuamente. Reconstrói qualquer viagem com eventos marcados — travagens, paragens, excessos — e ativa o modo anti-roubo com notificação imediata assim que algo saia do previsto.',
  },
  {
    eyebrow: 'Telemetria OBD-II avançada',
    title: 'Dados profundos do veículo, prontos para decisão',
    tags: ['RPM & Odómetro real', 'Combustível & Temperatura', 'Tensão da bateria', 'Códigos DTC'],
    body: 'Compatível com dispositivos como o Teltonika FMC003, o Trackfy lê diretamente o barramento OBD-II: RPM, odómetro real, nível e consumo de combustível, temperatura do motor, tensão da bateria, velocidade real e códigos de falha. Diagnóstico e telemetria de nível oficinal — sem sair da plataforma.',
  },
  {
    eyebrow: 'EV Mode · Veículos elétricos',
    title: 'Preparado para a frota elétrica de nova geração',
    tags: ['Estado da bateria (SoC)', 'Autonomia estimada', 'Consumo energético', 'Alertas de carregamento'],
    body: 'Para veículos elétricos, o Trackfy monitoriza o estado real da bateria, autonomia estimada, consumo energético por viagem e ciclos de carga. Alertas automáticos avisam quando é hora de carregar ou quando algo compromete a eficiência da frota EV.',
  },
  {
    eyebrow: 'Alertas inteligentes',
    title: 'Segurança proativa baseada em telemetria e sensores',
    tags: ['Colisão · Reboque', 'Anti-jammer', 'Excesso de velocidade', 'Geofence entrada/saída'],
    body: 'O motor de alertas cruza acelerómetro, GPS, ignição e OBD para detetar colisões, tentativas de reboque, remoção do dispositivo, interferência de sinal (anti-jammer), excesso de velocidade, marcha lenta excessiva, entradas e saídas de geofences, falhas OBD e bateria baixa — em tempo real, no teu telemóvel.',
  },
  {
    eyebrow: 'Driver Score · Comportamento',
    title: 'Avalia, compara e melhora a condução de toda a equipa',
    tags: ['Travagens & acelerações', 'Curvas agressivas', 'Condução ecológica', 'Ranking de condutores'],
    body: 'Cada viagem gera um Driver Score baseado em travagens bruscas, acelerações fortes, curvas agressivas, excesso de velocidade e condução ecológica. Nas frotas, um ranking claro compara condutores e ajuda a reduzir custos de combustível, desgaste e sinistralidade.',
  },
  {
    eyebrow: 'Relatórios & Frotas',
    title: 'Relatórios estratégicos e gestão completa da frota',
    tags: ['Consumo & custo por viagem', 'Mapa de calor', 'Manutenção preventiva', 'Eficiência EV'],
    body: 'Relatórios avançados de consumo, custo estimado, quilómetros diários, tempo parado vs. em movimento, velocidade máxima e eficiência energética. Para gestores de frota: ranking de condutores, custos por veículo, mapas de calor de utilização e alertas de manutenção preventiva.',
  },
  {
    eyebrow: 'Diagnóstico & sensores',
    title: 'Saúde do veículo, do dispositivo e sensores Bluetooth',
    tags: ['Sinal GPS · LTE', 'Firmware & logs', 'Temperatura · Humidade', 'Beacons & inventário'],
    body: 'Vê o estado geral do motor, DTCs, tensão da linha OBD e saúde da bateria. Acompanha o próprio dispositivo — sinal GPS, LTE, bateria interna, firmware, consumo de dados e logs. Adiciona sensores Bluetooth para temperatura, humidade, beacons e inventário inteligente na cadeia logística.',
  },
  {
    eyebrow: 'Plataforma · Segurança · Multilingue',
    title: 'Pagamentos, geofences automáticos e segurança de nível empresarial',
    tags: ['Stripe · PayPal · MBWay', 'Multi-tenant + RBAC', 'Criptografia ponta a ponta', '11 idiomas'],
    body: 'Assinaturas mensais ou anuais com Stripe, PayPal e MBWay, renovação automática, faturas e bloqueio por falta de pagamento. Geofences automáticos para casa, trabalho e zonas frequentes. Dados isolados por cliente (multi-tenant), criptografia ponta a ponta, logs de auditoria e controlo por perfil (RBAC). Disponível em 11 idiomas — pt-PT, pt-BR, es, en, fr, de, it, ja, ko, vi, ar.',
  },
];

const TrackfyLanding = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Trackfy — Rastreamento GPS, Telemetria OBD-II e Gestão de Frotas | Getboost Digital"
        description="O Trackfy combina rastreamento GPS multi-constelação, telemetria OBD-II, EV Mode, Driver Score e gestão de frotas numa plataforma segura, multilingue e acessível."
        canonical="/trackfy"
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
            Trackfy · GPS · Telemetria · Frotas
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
            O Trackfy é um SaaS de rastreamento veicular de nova geração — hardware inteligente,
            telemetria OBD-II, IA, alertas automáticos e gestão de frotas numa plataforma{' '}
            <em className="not-italic text-white">simples, segura e acessível</em>. Para particulares,
            PMEs e frotas que querem visibilidade total.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/demo?produto=trackfy"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Pedir Demonstração
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              Falar com um consultor
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '4', v: 'Constelações GNSS (GPS · GLONASS · Galileo · BeiDou)' },
              { k: 'OBD-II', v: 'Telemetria profunda do veículo' },
              { k: 'EV', v: 'Modo veículos elétricos incluído' },
              { k: '11', v: 'Idiomas suportados' },
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

      {/* FEATURES */}
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

      {/* VALUE STATEMENT */}
      <section className="bg-[#0a0603] text-white py-24 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="text-2xl md:text-3xl leading-relaxed text-white/85 font-light">
            Trackfy é mais do que rastreamento — é{' '}
            <span style={{ color: ACCENT }}>inteligência veicular</span> ao serviço da{' '}
            <span style={{ color: ACCENT }}>segurança, eficiência e economia</span> de quem depende
            dos seus veículos todos os dias.
          </p>
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
            Pronto para ter os teus veículos{' '}
            <span style={{ color: ACCENT }}>sempre sob controlo</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Pedir demonstração Trackfy'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'trackfy',
              name: 'Trackfy',
              accent: ACCENT,
              eyebrow: 'Demonstração · Trackfy',
              headline: 'Vamos colocar a tua frota no mapa — literalmente.',
              subhead: 'Conta-nos quantos veículos tens, se são combustão ou EV e o que queres monitorizar. Agendamos uma demonstração personalizada do Trackfy.',
              goalOptions: [
                'Rastrear veículo particular',
                'Gerir uma pequena frota (2–10 veículos)',
                'Gerir frota média/grande (10+ veículos)',
                'Monitorizar frota elétrica (EV)',
                'Reduzir custos e sinistralidade',
                'Migrar de outra plataforma de tracking',
              ],
              messagePlaceholder: 'Nº de veículos, tipo (combustão/EV), objetivo principal, plataforma actual (se aplicável)…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default TrackfyLanding;
