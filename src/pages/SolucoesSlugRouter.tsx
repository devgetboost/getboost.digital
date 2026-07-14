import { lazy } from 'react';
import { useParams } from 'react-router-dom';
import { SOLUCOES_PLACEHOLDER_SLUGS } from '@/data/solucoesSubmenu';

const SolucaoPlaceholder = lazy(() => import('./SolucaoPlaceholder'));
const ServiceDetail = lazy(() => import('./ServiceDetail'));

/**
 * Despacha /solucoes/:slug:
 * - Se o slug está na whitelist do submenu (excluindo os que têm href próprio),
 *   mostra a página placeholder "em breve".
 * - Caso contrário, cai na ServiceDetail existente (que trata o fallback).
 */
export default function SolucoesSlugRouter() {
  const { slug = '' } = useParams();
  if (SOLUCOES_PLACEHOLDER_SLUGS.has(slug)) {
    return <SolucaoPlaceholder />;
  }
  return <ServiceDetail />;
}
