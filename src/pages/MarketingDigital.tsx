import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { PillarLanding } from '@/components/pillars/PillarLanding';
import { PILLARS } from '@/components/pillars/pillarData';

/**
 * Wave 3D — Growth pillar experience.
 * Mounts at the canonical /solucoes/marketing-digital route through
 * the shared PillarLanding layout. SEO props preserved.
 */
const MarketingDigital = () => {
  const { i18n } = useTranslation();

  return (
    <Layout>
      <SEO
        title="Marketing Digital — Estratégia Integrada e Receita Previsível | Getboost Digital"
        description="Marketing digital ponta a ponta: estratégia, aquisição multi-canal, retenção, analytics e otimização contínua. Menos táticas soltas, mais receita mensurável."
        canonical="/solucoes/marketing-digital"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />
      <PillarLanding pillar={PILLARS.growth} />
    </Layout>
  );
};

export default MarketingDigital;
