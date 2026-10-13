import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Zap, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { ScrollDepth } from '@/components/ScrollDepth';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import { openLeadMagnet } from '@/components/LeadMagnetModal';
import { analytics } from '@/lib/analytics';
import { getAssessment } from '@/lib/lead-magnets';
import { useCaseStudy, useCaseStudies } from '@/hooks/useContent';
import { mediaUrl, type CaseStudyView } from '@/lib/contentApi';
import { assessmentForCase, pillarForCase, pillarRoute, presentText, productForClient, renderableResults } from '@/data/case-framework';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string | null;
  tags: string[];
  year: string;
  client: string;
};

/** R1C6: maps a localized case study onto the shape this page renders. */
function toProject(study: CaseStudyView): Project {
  return {
    id: study.id,
    slug: study.slug,
    title: study.title,
    // The legacy `category` column became `industry` on the case-study parent.
    category: study.industry ?? 'web',
    description: study.summary ?? study.challenge ?? '',
    image: mediaUrl(study.heroMediaPath),
    tags: [...study.capabilities, ...study.technologies],
    year: study.publishedAt ? study.publishedAt.slice(0, 4) : '',
    client: study.clientName,
  };
}

/**
 * R20.7 — Case detail on the premium template: Contexto → Desafio →
 * Diagnóstico → Solução → Implementação → Resultado → Próximos Passos.
 * Every narrative section renders ONLY from CMS fields (conditional);
 * nothing is invented. Proof, conversion and tracking follow the frozen
 * systems.
 */
const PortfolioDetail = () => {
  const { id } = useParams<{ id: string }>();
  // R1C6: published case studies from the Clean V1 content tables. The list is
  // fetched for prev/next navigation; the detail is resolved by slug or id.
  const { data: study, loading, error } = useCaseStudy(id);
  const { data: studies } = useCaseStudies();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);

  const allProjects = (studies ?? []).map(toProject);
  const project = study ? toProject(study) : null;
  const notFound = !loading && !error && !project;

  if (loading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></Layout>;
  }
  if (notFound || !project || !study) return <Navigate to="/portfolio" replace />;

  const projectIndex = allProjects.findIndex(p => p.id === project.id);
  const prevProject = projectIndex > 0 ? allProjects[projectIndex - 1] : null;
  const nextProject = projectIndex < allProjects.length - 1 ? allProjects[projectIndex + 1] : null;

  // Framework fields (conditional — absent data renders no section).
  const challenge = presentText(study.challenge);
  const strategy = presentText(study.strategy);
  const solution = presentText(study.solution);
  const resultItems = renderableResults(study.results);
  const capabilities = study.capabilities ?? [];
  const technologies = study.technologies ?? [];
  const categoryLabel = project.category === 'branding' ? 'Branding' : project.category === 'web' ? 'Web' : 'Estratégia';
  // R20.7 — contextual assessment from the case's own capabilities and
  // technologies; neutral operations score when no pillar evidence exists.
  const assessmentId = assessmentForCase(capabilities, technologies);
  const assessmentMeta = getAssessment(assessmentId);
  const casePillar = pillarForCase(capabilities, technologies);
  const casePillarHref = casePillar ? pillarRoute(casePillar) : null;
  // R20.7 Phase 8 — authority links: exact catalog-name match only.
  const caseProduct = productForClient(project.client);
  // Execution flow straight from the case data (capabilities first, then
  // technologies) — the visual the CMS already describes.
  const flowSteps = (capabilities.length > 0 ? capabilities : technologies).slice(0, 5);
  // CMS SEO overrides win when authored; fall back to the visible fields.
  const seoTitle = presentText(study.seoTitle) ?? project.title;
  const seoDescription = presentText(study.seoDescription) ?? project.description;
  const openAssessment = (source: string) => {
    analytics.trackAssessment(assessmentId, 'start', { source });
    openLeadMagnet(assessmentId);
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seoTitle,
      description: seoDescription,
      url: `https://getboost.digital/portfolio/${project.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://getboost.digital/' },
        { '@type': 'ListItem', position: 2, name: 'Portefólio', item: 'https://getboost.digital/portfolio' },
        { '@type': 'ListItem', position: 3, name: project.title, item: `https://getboost.digital/portfolio/${project.slug}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: project.title,
      description: seoDescription,
      datePublished: project.year || undefined,
      author: { '@type': 'Organization', name: 'Getboost Digital' },
    },
  ];

  // R20.7 — every case event is stamped with its slug so the pure case
  // intelligence layer can attribute without identity (PII-free).
  const track = (label: string) =>
    analytics.trackClick('case_detail', label, 'consideration', { case: project.slug });

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={`/portfolio/${project.slug}`}
        image={project.image ?? undefined}
        jsonLd={jsonLd}
      />
      {/* Per-case location so scroll depth ranks cases individually (R20.7). */}
      <ScrollDepth location={`case_${project.slug}`} />

      {/* ==================================================== 01 HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <Link
              to="/portfolio"
              onClick={() => track('back_to_portfolio')}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Portefólio
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 grid items-end gap-10 lg:grid-cols-[1.1fr_1fr]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="gb-chip">{categoryLabel}</span>
                {project.client && <span className="gb-chip">{project.client}</span>}
                {project.year && <span className="gb-chip">{project.year}</span>}
              </div>
              <h1 className="gb-text-display mt-5 text-ink-primary">{project.title}</h1>
              {project.description && (
                <p className="gb-text-body mt-6 max-w-xl text-ink-secondary">{project.description}</p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild size="lg">
                  <Link to="/booking" onClick={() => track('booking')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={() => openAssessment(`case:${project.slug}`)}>
                  {assessmentMeta?.cta ?? 'Fazer avaliação gratuita'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link
                  to="/contact"
                  onClick={() => track('contact')}
                  className="text-sm font-medium text-ink-secondary underline decoration-black/15 underline-offset-4 transition-colors hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  Falar com Especialista
                </Link>
              </div>
              {assessmentMeta && (
                <p className="gb-text-small mt-4 text-ink-tertiary">
                  {assessmentMeta.category} · {assessmentMeta.benefit}
                </p>
              )}
              {(casePillarHref || caseProduct?.to) && (
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {casePillarHref && (
                    <Link
                      to={casePillarHref}
                      onClick={() => track('case_pillar')}
                      className="gb-link-more inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600"
                    >
                      Ver o pilar por trás deste projeto <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {caseProduct?.to && (
                    <Link
                      to={caseProduct.to}
                      onClick={() => analytics.trackProduct(caseProduct.slug, 'click', 'case_detail')}
                      className="gb-link-more inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-tertiary transition-colors hover:text-ink-primary"
                    >
                      {caseProduct.name} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <Link
                    to="/casos-de-sucesso"
                    onClick={() => track('cases_hub')}
                    className="gb-link-more inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-tertiary transition-colors hover:text-ink-primary"
                  >
                    Todos os casos <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
            {project.image && (
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] shadow-premium">
                <img src={project.image} alt={project.title} className="block w-full object-cover" loading="eager" />
              </div>
            )}
          </motion.div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ==================================================== 02 RESUMO */}
      <section className="gb-surface-subtle gb-section !py-14">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { k: 'Cliente', v: project.client },
                { k: 'Setor', v: categoryLabel },
                { k: 'Ano', v: project.year || '—' },
              ].map((fact) => (
                <div key={fact.k} className="gb-card !p-6 text-center">
                  <p className="gb-eyebrow text-ink-tertiary">{fact.k}</p>
                  <p className="gb-text-h3 mt-2 !text-xl text-ink-primary">{fact.v}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 03 DESAFIO */}
      {challenge && (
        <section className="gb-surface-page gb-section">
          <div className="gb-container max-w-4xl">
            <SectionHeader eyebrow="Desafio" title="O ponto de partida" />
            <Reveal i={0}>
              <p className="gb-text-body mt-8 text-ink-secondary">{challenge}</p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ==================================================== 04 ABORDAGEM */}
      {strategy && (
        <section className="gb-surface-section gb-section">
          <div className="gb-container max-w-4xl">
            <SectionHeader eyebrow="Abordagem" title="O diagnóstico antes da solução" />
            <Reveal i={0}>
              <p className="gb-text-body mt-8 text-ink-secondary">{strategy}</p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ==================================================== 05 ARQUITETURA */}
      {(capabilities.length > 0 || technologies.length > 0) && (
        <section className="gb-surface-page gb-section">
          <div className="gb-container">
            <SectionHeader
              eyebrow="Arquitetura"
              title="Capacidades e tecnologias aplicadas"
              description="O que este projeto mobilizou — sem jargão, só o essencial."
            />
            <Reveal i={0}>
              <div className="gb-card mt-12">
                {capabilities.length > 0 && (
                  <div>
                    <p className="gb-eyebrow text-ink-tertiary">Capacidades</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {capabilities.map((capability) => (
                        <span key={capability} className="gb-chip">{capability}</span>
                      ))}
                    </div>
                  </div>
                )}
                {technologies.length > 0 && (
                  <div className={capabilities.length > 0 ? 'mt-6' : ''}>
                    <p className="gb-eyebrow text-ink-tertiary">Tecnologias</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {technologies.map((technology) => (
                        <span key={technology} className="rounded-md bg-black/[0.04] px-2 py-1 font-mono text-[11px] text-ink-secondary">
                          {technology}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* R20.7 Phase 7 — execution flow from the case's own
                    capabilities/technologies. Never invented; hidden when
                    the case carries fewer than two steps. */}
                {flowSteps.length >= 2 && (
                  <div className="mt-6 border-t border-black/[0.06] pt-5">
                    <p className="gb-eyebrow text-ink-tertiary">Fluxo de execução</p>
                    <div className="mt-4">
                      <MiniFlow steps={flowSteps} tint="var(--gb-brand-50)" strong="var(--gb-brand-600)" />
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ==================================================== 06 EXECUÇÃO */}
      {solution && (
        <section className="gb-surface-section gb-section">
          <div className="gb-container max-w-4xl">
            <SectionHeader eyebrow="Execução" title="O que foi construído" />
            <Reveal i={0}>
              <p className="gb-text-body mt-8 text-ink-secondary">{solution}</p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ==================================================== 07 RESULTADO */}
      {resultItems.length > 0 && (
        <section className="gb-surface-page gb-section">
          <div className="gb-container max-w-4xl">
            <SectionHeader eyebrow="Resultado" title="O que mudou" />
            <div className="mt-8 flex flex-col gap-3">
              {resultItems.map((result, i) => (
                <Reveal key={`${result.slice(0, 24)}-${i}`} i={i}>
                  <div className="gb-surface-card-elevated">
                    <p className="gb-text-h3 !text-xl text-ink-primary">{result}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================== 07B LIÇÕES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container max-w-4xl">
          <SectionHeader eyebrow="Lições" title="O que este projeto nos ensinou" />
          <Reveal i={0}>
            <div className="gb-card mt-8">
              <p className="gb-text-body text-ink-secondary">
                Estamos a documentar as lições deste projeto — o que correu mal antes de correr bem.
                Queres saber o que evitar no teu caso? Fala connosco numa sessão de 30 minutos.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button asChild variant="outline">
                  <Link to="/contact" onClick={() => track('lessons_contact')}>
                    Pedir as lições deste caso
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 08 CTA */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  Queres um caso destes no teu negócio?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Diagnóstico gratuito de 30 minutos — saís com um plano concreto.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to="/booking" onClick={() => track('booking_final')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to="/contact" onClick={() => track('contact_final')}>
                      Falar com Especialista
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => openAssessment(`case_final:${project.slug}`)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  <Zap className="h-4 w-4" />
                  ou faz a avaliação gratuita de 3 min
                </button>
                <button
                  type="button"
                  onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-white/40 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  <Calendar className="h-4 w-4" />
                  ou a auditoria grátis de 7 min
                </button>
              </div>
            </div>
          </Reveal>
          <div className="mt-8 grid grid-cols-2">
            {prevProject ? (
              <Link
                to={`/portfolio/${prevProject.slug}`}
                onClick={() => track('prev_case')}
                className="group flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:p-8"
              >
                <ArrowLeft className="h-5 w-5 shrink-0 text-ink-tertiary transition-colors group-hover:text-brand-600" />
                <span>
                  <span className="gb-eyebrow text-ink-tertiary">Anterior</span>
                  <span className="gb-text-h3 mt-1 block !text-lg text-ink-primary">{prevProject.title}</span>
                </span>
              </Link>
            ) : <div />}
            {nextProject ? (
              <Link
                to={`/portfolio/${nextProject.slug}`}
                onClick={() => track('next_case')}
                className="group flex items-center justify-end gap-4 rounded-2xl border border-black/[0.06] bg-white p-6 text-right transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:p-8"
              >
                <span>
                  <span className="gb-eyebrow text-ink-tertiary">Próximo</span>
                  <span className="gb-text-h3 mt-1 block !text-lg text-ink-primary">{nextProject.title}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-ink-tertiary transition-colors group-hover:text-brand-600" />
              </Link>
            ) : <div />}
          </div>
        </div>
      </section>

      <CommercialAuditModal
        open={auditOpen}
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
        trackingSource="case_detail"
      />
    </Layout>
  );
};

export default PortfolioDetail;
