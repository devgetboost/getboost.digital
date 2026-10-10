import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { PillarLanding } from '@/components/pillars/PillarLanding';
import { PILLARS } from '@/components/pillars/pillarData';

/**
 * Wave 3D — Automation pillar experience.
 * Mounts at the canonical /solucoes/integracoes-erp-crm route through
 * the shared PillarLanding layout. SEO props preserved.
 */
const IntegracoesErpCrm = () => {
  const { i18n } = useTranslation();

  return (
    <Layout>
      <SEO
        title="Integrações ERP e CRM — Sistemas Sincronizados em Tempo Real | Getboost Digital"
        description="Ligamos ERP, CRM, e-commerce e ferramentas verticais com middleware auditável, sincronização bidireccional e SLA. Fim dos silos e dos dados duplicados."
        canonical="/solucoes/integracoes-erp-crm"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />
      <PillarLanding pillar={PILLARS.automation} />
    </Layout>
  );
};

export default IntegracoesErpCrm;
