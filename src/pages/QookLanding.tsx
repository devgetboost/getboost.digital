import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import ConsultantContactForm from '@/components/ConsultantContactForm';

const ACCENT = '#ff4000';

const manifestoLines = ['Já não geres um restaurante.', 'Comandas uma operação.'];

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const features: Feature[] = [
  {
    eyebrow: 'Pedidos · Sala · Balcão · Delivery',
    title: 'Gestão de Pedidos ponta a ponta',
    tags: ['Comanda digital', 'QR Code na mesa', 'Tablet do funcionário', 'Painel KDS', 'Delivery próprio'],
    body: 'Um fluxo único que liga o cliente, a sala, a cozinha e a entrega. O pedido nasce na mesa (QR, tablet ou balcão), entra automaticamente no KDS, sai preparado no tempo certo e fecha no pagamento — sem papel, sem retrabalho, sem enganos.',
  },
  {
    eyebrow: 'Ementa Digital Inteligente',
    title: 'Ementa que vende por ti',
    tags: ['Fotos e descrições', 'Atualização real-time', 'Extras & modificadores', 'Esgotados', 'Upsell automático'],
    body: 'Menus digitais editáveis em segundos, com combinações, extras e sugestões de upsell geradas pela plataforma. Marca um prato como esgotado e desaparece de todos os canais no mesmo instante — QR, delivery e balcão.',
  },
  {
    eyebrow: 'Pagamentos Integrados',
    title: 'Fecha a conta em qualquer lado',
    tags: ['MB WAY', 'Cartão', 'Multibanco', 'Carteira digital', 'Divisão de conta', 'Pré-pagamento takeaway'],
    body: 'Aceita todos os métodos que os clientes portugueses usam. Pagamento na mesa, divisão automática entre amigos, cobrança antecipada para takeaway e conciliação financeira no fim do dia — tudo integrado no mesmo sistema.',
  },
  {
    eyebrow: 'Stock, Compras e Ficha Técnica',
    title: 'Custo por prato sempre debaixo de olho',
    tags: ['Baixa por receita', 'Alertas de reposição', 'Fornecedores', 'Ficha técnica', 'Margem real'],
    body: 'Cada venda desconta os ingredientes certos com base na ficha técnica. Vês margem real por prato, alertas quando o stock cai, e um histórico de compras que negoceia melhor com fornecedores.',
  },
  {
    eyebrow: 'KDS · Painel da Cozinha',
    title: 'Cozinha organizada por prioridade',
    tags: ['Tempo de confeção', 'Alertas de atraso', 'Impressoras térmicas', 'Modo dark kitchen'],
    body: 'A cozinha recebe pedidos ordenados por prioridade, com contadores de tempo, avisos de atraso e integração com impressoras térmicas. Ideal para restauração de volume e para dark kitchens que operam vários canais em simultâneo.',
  },
  {
    eyebrow: 'Equipa · Escalas · Permissões',
    title: 'Uma equipa alinhada, sem gritos ao balcão',
    tags: ['Perfis & permissões', 'Escalas', 'Registo de desempenho', 'Avaliação de produtividade'],
    body: 'Define quem pode fazer o quê, cria escalas, mede desempenho por colaborador e dá visibilidade a quem gere. Menos fricção, mais responsabilidade e turnos que fecham no tempo previsto.',
  },
  {
    eyebrow: 'Automação e IA',
    title: 'Inteligência que trabalha por trás do balcão',
    tags: ['Previsão de vendas', 'Sugestões de ementa', 'Deteção de desperdício', 'Recomendações de compra'],
    body: 'A Qook analisa o histórico, cruza sazonalidade e sugere o que comprar, o que promover e onde estás a perder dinheiro. Insights automáticos entregues ao gestor — sem folhas de Excel, sem adivinhação.',
  },
  {
    eyebrow: 'Relatórios & Inteligência Operacional',
    title: 'Decisões suportadas por dados reais',
    tags: ['Faturação diária/semanal/mensal', 'Top de pratos', 'Margem por produto', 'Tempo médio', 'Performance da equipa'],
    body: 'Um painel executivo que mostra faturação, pratos vencedores, margem, tempo médio de atendimento e desempenho por turno. A previsão de procura por IA ajuda-te a comprar melhor e a escalar equipa com antecedência.',
  },
  {
    eyebrow: 'Segurança & Multiplataforma',
    title: 'Confiável, isolado e em todo o lado',
    tags: ['Multi-tenant', 'Criptografia ponta a ponta', 'Backups automáticos', 'Web · Tablet · Mobile · QR'],
    body: 'Cada restaurante tem os seus dados totalmente isolados, com criptografia, logs de auditoria e backups automáticos. Funciona em Web, tablet, mobile, QR Code e impressoras térmicas — do café de bairro à cadeia com várias lojas.',
  },
];

const QookLanding = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <SEO
        title="Qook — Sistema tudo-em-um para restaurantes | Getboost"
        description="Qook centraliza pedidos, ementa digital, pagamentos, stock, KDS, equipa e IA num único SaaS pensado para restaurantes, cafés, bares e dark kitchens em Portugal."
        canonical="/qook"
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
            Restaurantes · Cafés · Bares · Takeaway · Dark Kitchens
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
                  <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>{line}</span>
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
            A Qook centraliza pedidos, ementa digital, pagamentos, stock, cozinha, equipa e IA num
            único sistema. Menos ferramentas, menos erros, mais margem — pensado para a realidade
            da restauração portuguesa.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/demo?produto=qook"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Pedir demonstração
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
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
              { k: '1', v: 'Sistema para toda a operação' },
              { k: '<5min', v: 'Setup de uma nova mesa/QR' },
              { k: '0', v: 'Papel entre sala e cozinha' },
              { k: '24/7', v: 'Pedidos online sem parar' },
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

      {/* FEATURE LIST — accordion */}
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
            Vamos transformar a tua <span style={{ color: ACCENT }}>cozinha</span> num{' '}
            <span style={{ color: ACCENT }}>negócio previsível</span>?
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
              {contactOpen ? 'Fechar formulário' : 'Falar com um consultor'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'qook',
              name: 'Qook',
              accent: ACCENT,
              eyebrow: 'Briefing · Qook',
              headline: 'Vamos desenhar a operação do teu restaurante.',
              subhead:
                'Diz-nos que tipo de negócio tens (restaurante, café, bar, takeaway, dark kitchen), quantas mesas/pedidos por dia e que sistemas usas hoje. Preparamos uma demonstração personalizada.',
              goalOptions: [
                'Digitalizar pedidos (QR / KDS)',
                'Integrar pagamentos (MB WAY, cartão, MB)',
                'Controlar stock e custo por prato',
                'Gerir várias unidades / dark kitchens',
                'Ainda a explorar',
              ],
              messagePlaceholder:
                'Tipo de negócio, número de mesas/pedidos por dia, sistemas actuais (POS, delivery), integrações necessárias…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default QookLanding;
