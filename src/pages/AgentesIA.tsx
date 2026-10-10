import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { PillarLanding } from '@/components/pillars/PillarLanding';
import { PILLARS } from '@/components/pillars/pillarData';

/**
 * Wave 3D — AI pillar experience.
 * Mounts at the canonical /agentes-ia route through the shared
 * PillarLanding layout. SEO props preserved from the pre-3D page.
 */
const AgentesIA = () => {
  const { i18n } = useTranslation();

  return (
    <Layout>
      <SEO
        title="Agentic AI — Agentes de IA Autónomos | Getboost Digital"
        description="Agentes de inteligência artificial que compreendem o teu negócio, resolvem problemas complexos e executam tarefas de forma autónoma, 24/7."
        canonical="/agentes-ia"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />
      <PillarLanding pillar={PILLARS.ai} />
    </Layout>
  );
};

export default AgentesIA;
