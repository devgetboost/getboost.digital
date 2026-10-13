import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { getCase } from '@/data/cases';
import { analytics } from '@/lib/analytics';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const Reveal = ({ children, i = 0 }: { children: React.ReactNode; i?: number }) => (
  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
    {children}
  </motion.div>
);

export interface CaseProofStripProps {
  /** Case slugs (product slugs) to show — resolved from the shared engine. */
  slugs: string[];
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Pillar tokens for accents. Defaults to brand. */
  tint?: string;
  strong?: string;
  /** Analytics location prefix for card clicks. */
  trackingLocation?: string;
}

/**
 * R20.15 — distributed proof strip. Renders shipped case narratives with
 * their metric tags and links — no invented content. Unknown slugs render
 * nothing (never a placeholder claim).
 */
export const CaseProofStrip = ({
  slugs,
  eyebrow = 'Resultados de clientes',
  title = 'Já construímos isto — e funcionou',
  description,
  tint = 'var(--gb-brand-50)',
  strong = 'var(--gb-brand-600)',
  trackingLocation = 'case_strip',
}: CaseProofStripProps) => {
  const cases = slugs
    .map((slug) => ({ slug, c: getCase(slug) }))
    .filter((row): row is { slug: string; c: NonNullable<ReturnType<typeof getCase>> } => Boolean(row.c));
  if (cases.length === 0) return null;

  return (
    <div>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {cases.map(({ slug, c }, i) => (
          <Reveal key={slug} i={i % 2}>
            <article className="gb-surface-card gb-card-lift h-full">
              <p className="gb-eyebrow text-ink-tertiary">{c.eyebrow}</p>
              <h3 className="gb-text-h3 mt-3 !text-xl text-ink-primary">{c.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="gb-chip" style={{ background: tint, borderColor: tint }}>
                    <Check className="h-3.5 w-3.5" style={{ color: strong }} />
                    {tag}
                  </span>
                ))}
              </div>
              {c.to && (
                <Link
                  to={c.to}
                  onClick={() => analytics.trackClick(trackingLocation, `case_${slug}`, 'consideration')}
                  className="gb-link-more mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600"
                >
                  Ver o caso <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </article>
          </Reveal>
        ))}
      </div>
      <div className="mt-8">
        <Link
          to="/casos-de-sucesso"
          onClick={() => analytics.trackClick(trackingLocation, 'cases_hub', 'consideration')}
          className="gb-link-more inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-tertiary"
        >
          Todos os casos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default CaseProofStrip;
