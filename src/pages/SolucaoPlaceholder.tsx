import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import PageHero from '@/components/PageHero';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { SOLUCOES_SUBMENU_MAP } from '@/data/solucoesSubmenu';

const ACCENT = '#ff4000';

export default function SolucaoPlaceholder() {
  const { slug = '' } = useParams();
  const item = SOLUCOES_SUBMENU_MAP[slug];
  const title = item?.title ?? 'Solução';
  const [contactOpen, setContactOpen] = useState(true);

  return (
    <Layout>
      <SEO
        title={`${title} — Em desenvolvimento | Getboost`}
        description={`Página da solução ${title} em desenvolvimento. Fala com um especialista para saber mais.`}
        canonical={`/solucoes/${slug}`}
      />

      <PageHero
        badge="Em breve"
        badgeAccent="Novo"
        title={title}
        subtitle="Estamos a preparar esta página com todos os detalhes."
        description="Entretanto, deixa o teu contacto e um especialista fala contigo em menos de 24h úteis."
        cta={{
          i18nKey: 'cta.talk_specialist',
          label: 'Falar com especialista',
          href: '#contacto-solucao',
          category: 'solucao_placeholder',
          ctaType: 'primary_hero',
        }}
        secondaryCta={{
          i18nKey: 'cta.see_all_solutions',
          label: 'Ver todas as soluções',
          href: '/solucoes',
          category: 'solucao_placeholder',
          ctaType: 'secondary_hero',
        }}
      />

      <section id="contacto-solucao" className="bg-black text-white py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,6vw,5rem)]">
            Falar sobre <span style={{ color: ACCENT }}>{title}</span>
          </h2>
          <p className="mt-6 text-white/70 max-w-2xl mx-auto">
            Conta-nos o teu contexto. Analisamos e respondemos em menos de 24h úteis
            com uma proposta de próximo passo — sem compromisso.
          </p>

          <div className="mt-10">
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {contactOpen ? 'Fechar formulário' : 'Pedir contacto'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

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
      </section>
    </Layout>
  );
}
