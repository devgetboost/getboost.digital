import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';

/**
 * R19 execution — the one process timeline on the site.
 *
 * Seven pages (AI agents, ERP/CRM, marketing, the three product landings,
 * web and SaaS development) each carried a near-identical copy of this
 * section, differing only in the pillar hue and two hard-coded insets that
 * were wrong for anything but six steps. One component now serves them all;
 * the geometry is derived from the step count, so 5, 6 or 7 steps all align.
 *
 * The hue is always a frozen pillar token (`--gb-ai-*`, `--gb-automation-*`,
 * `--gb-software-*`, `--gb-growth-*`) — never a raw hex.
 */

export interface TimelineStep {
  /** Mono label rendered above the title (existing page copy). */
  step: string;
  title: string;
}

export interface ProcessTimelineProps {
  eyebrow?: string;
  title: string;
  description?: string;
  steps: TimelineStep[];
  /** Pillar hue tokens: base (rule), strong (numbers), tint (dots). */
  hue: { base: string; strong: string; tint: string };
}

const ProcessTimeline = ({ eyebrow = 'Implementação', title, description, steps, hue }: ProcessTimelineProps) => {
  const columns = steps.length;
  // Each column occupies 100/columns %; the rail spans the first/last column
  // centres, so the insets have to follow the count instead of being fixed.
  const inset = `${(50 / columns).toFixed(2)}%`;

  return (
    <section className="gb-surface-page gb-section">
      <div className="gb-container">
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />

        <div aria-hidden="true" className="relative mb-2 mt-12 hidden lg:block">
          <div
            className="absolute top-1/2 h-px -translate-y-1/2 bg-black/10"
            style={{ left: inset, right: inset }}
          />
          <div
            aria-hidden="true"
            className="absolute top-1/2 h-px -translate-y-1/2"
            style={{ left: inset, width: `${(100 / columns).toFixed(2)}%`, background: `linear-gradient(90deg, ${hue.base}, ${hue.tint})` }}
          />
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {steps.map((t, ti) => (
              <div key={t.step} className="flex justify-center">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white font-mono text-xs font-bold"
                  style={{ borderColor: hue.base, color: hue.strong }}
                >
                  {String(ti + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(var(--timeline-columns),minmax(0,1fr))] lg:!mt-0"
          style={{ '--timeline-columns': columns } as React.CSSProperties}
        >
          {steps.map((t, i) => (
            <Reveal key={t.step} i={i % 3}>
              <div className="gb-card gb-card-lift h-full !p-6">
                <div className="font-mono text-sm tracking-[0.22em]" style={{ color: hue.strong }}>
                  {t.step}
                </div>
                <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{t.title}</h3>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessTimeline;
