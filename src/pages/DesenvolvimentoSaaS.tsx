import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { PillarLanding } from '@/components/pillars/PillarLanding';
import { PILLARS } from '@/components/pillars/pillarData';

/**
 * Wave 3D — Software pillar experience.
 * Mounts at the canonical /solucoes/desenvolvimento-software route
 * through the shared PillarLanding layout. SEO props preserved.
 */
const DesenvolvimentoSaaS = () => {
  const { i18n } = useTranslation();

  return (
    <Layout>
      <SEO
        title="Desenvolvimento SaaS — Plataformas Multi-Tenant e Produtos Digitais | Getboost Digital"
        description="Construímos plataformas SaaS multi-tenant escaláveis: MVP, billing, IA integrada e operação pronta para SLA."
        canonical="/solucoes/desenvolvimento-software"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />
      <PillarLanding pillar={PILLARS.software} />
    </Layout>
  );
};

export default DesenvolvimentoSaaS;
