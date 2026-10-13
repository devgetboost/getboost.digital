import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import { ScrollDepth } from '@/components/ScrollDepth';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { analytics } from '@/lib/analytics';
import { SOLUCOES_SUBMENU_MAP } from '@/data/solucoesSubmenu';

const ACCENT = '#ff4000';

export default function SolucaoPlaceholder() {
  const { slug = '' } = useParams();
  const item = SOLUCOES_SUBMENU_MAP[slug];
  const title = item?.title ?? 'Solução';
  const [contactOpen, setContactOpen] = useState(true);

  return (
    <Layout>
      <ScrollDepth location="solucao_placeholder" />
      <SEO
        title={`${title} — Em desenvolvimento | Getboost`}
        description={`Página da solução ${title} em desenvolvimento. Fala com um especialista para saber mais.`}
        canonical={`/solucoes/${slug}`}
      />

      {/* Hero — frozen system */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Em breve · Novo</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Estamos a preparar esta página com todos os detalhes. Entretanto, deixa o teu contacto e um especialista fala contigo em menos de 24h úteis.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button size="lg" onClick={() => { setContactOpen(true); analytics.trackClick('solucao_placeholder', 'placeholder_contact', 'consideration'); }}>
                  Falar com especialista
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/solucoes" onClick={() => analytics.trackClick('solucao_placeholder', 'placeholder_all', 'consideration')}>
                    Ver todas as soluções
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {['Resposta em 24h úteis', 'Sem compromisso', 'Plano concreto'].map((chip) => (
                  <span key={chip} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {chip}
                  </span>
                ))}
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="gb-card !p-6 !shadow-lg">
                <span className="gb-eyebrow text-ink-tertiary">Como funciona</span>
                <MiniFlow
                  steps={['Contacto', 'Contexto', 'Proposta', 'Arranque']}
                  tint="var(--gb-brand-50)"
                  strong="var(--gb-brand-600)"
                />
              </div>
            </motion.div>
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      <section id="contacto-solucao" className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
            <div className="relative">
              <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                Falar sobre <span style={{ color: ACCENT }}>{title}</span>
              </h2>
              <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                Conta-nos o teu contexto. Analisamos e respondemos em menos de 24h úteis
                com uma proposta de próximo passo — sem compromisso.
              </p>

              <div className="mt-10">
                <Button
                  size="lg"
                  onClick={() => setContactOpen((v) => !v)}
                >
                  {contactOpen ? 'Fechar formulário' : 'Pedir contacto'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mx-auto mt-10 max-w-3xl text-left">
                <ConsultantContactForm
                  open={contactOpen}
                  service={{
                    slug,
                    name: title,
                    accent: ACCENT,
                    eyebrow: 'Pedido de contacto',
                    headline: `Vamos falar sobre ${title.toLowerCase()}.`,
                    subhead:
                      'Partilha o contexto e os objectivos. Preparamos uma resposta com plano e investimento indicativo.',
                    goalOptions: [
                      'Perceber se faz sentido',
                      'Pedir proposta',
                      'Auditoria / diagnóstico',
                      'Implementação end-to-end',
                    ],
                    messagePlaceholder: `O que procuras em ${title.toLowerCase()}? Ferramentas actuais, prazos, budget indicativo…`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
