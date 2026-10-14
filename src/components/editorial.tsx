import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from '@/components/ui/reveal';

/**
 * R22 — editorial section language.
 *
 * Novair-inspired dynamics on Getboost content and tokens: numbered kickers,
 * oversized display headlines with serif-italic accents, stat rows, process
 * lists, film-strip proof galleries and a marquee band. One accent colour
 * only (brand); surfaces stay on the frozen sand/ink scales.
 */

export const EditorialKicker = ({ index, label, className = '' }: { index: string; label: string; className?: string }) => (
  <Reveal>
    <p className={`ed-kicker text-ink-secondary ${className}`}>
      <span className="ed-kicker-num">({index})</span>
      <span>{label}</span>
    </p>
  </Reveal>
);

export const Display = ({
  as: Tag = 'h2',
  children,
  className = '',
}: {
  as?: 'h1' | 'h2' | 'h3';
  children: React.ReactNode;
  className?: string;
}) => (
  <Reveal>
    <Tag className={`ed-display text-ink-primary text-[clamp(2.75rem,7vw,6.5rem)] ${className}`}>
      {children}
    </Tag>
  </Reveal>
);

/** Image that settles from a slight zoom — the editorial reveal. */
export const ZoomImage = ({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <img src={src} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} />;
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className={`overflow-hidden ${className}`}
    >
      <img src={src} alt={alt} className="h-full w-full object-cover" loading={eager ? 'eager' : 'lazy'} />
    </motion.div>
  );
};

export interface EditorialStat {
  value: string;
  label: string;
}

export const StatRow = ({ stats }: { stats: EditorialStat[] }) => (
  <div className="grid grid-cols-2 gap-8 border-t border-ink-primary/15 pt-8 lg:grid-cols-4">
    {stats.map((s, i) => (
      <Reveal key={s.label} i={i}>
        <p className="ed-stat-value text-ink-primary">{s.value}</p>
        <p className="gb-text-small mt-2 font-medium uppercase tracking-[0.14em] text-ink-secondary">{s.label}</p>
      </Reveal>
    ))}
  </div>
);

export interface ProcessStep {
  title: string;
  desc: string;
}

export const ProcessList = ({ steps }: { steps: ProcessStep[] }) => (
  <ol className="border-t border-ink-primary/15">
    {steps.map((s, i) => (
      <Reveal key={s.title} i={0}>
        <li className="group grid grid-cols-[auto_1fr] items-baseline gap-6 border-b border-ink-primary/15 py-6 md:grid-cols-[80px_1fr_1fr] md:gap-10">
          <span className="font-mono text-sm tracking-[0.2em] text-brand-600">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="gb-text-h3 text-ink-primary transition-transform duration-300 group-hover:translate-x-2">
            {s.title}
          </span>
          <span className="gb-text-body col-span-2 text-ink-secondary md:col-span-1">{s.desc}</span>
        </li>
      </Reveal>
    ))}
  </ol>
);

export interface FilmFrame {
  src: string;
  alt: string;
  caption: string;
}

export const FilmStrip = ({ frames }: { frames: FilmFrame[] }) => (
  <div
    className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4"
    role="list"
    aria-label="Galeria"
  >
    {frames.map((f, i) => (
      <figure key={f.src} role="listitem" className="ed-frame w-[78vw] shrink-0 sm:w-[46vw] lg:w-[30vw]">
        <div className="aspect-[4/5] overflow-hidden">
          <img src={f.src} alt={f.alt} loading="lazy" className="h-full w-full object-cover" />
        </div>
        <figcaption className="flex items-center justify-between px-5 py-4">
          <span className="gb-text-small text-ink-secondary">{f.caption}</span>
          <span className="font-mono text-xs tracking-[0.2em] text-ink-tertiary">
            Fr {String(i + 1).padStart(3, '0')}
          </span>
        </figcaption>
      </figure>
    ))}
  </div>
);

export const Marquee = ({ items }: { items: string[] }) => {
  const row = [...items, ...items];
  return (
    <div aria-hidden className="overflow-hidden border-y border-ink-primary/15 py-5">
      <div className="ed-marquee-track gap-10">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center gap-10">
            {row.map((item, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-10 whitespace-nowrap">
                <span className="font-display text-3xl italic text-ink-primary md:text-4xl">{item}</span>
                <span aria-hidden className="h-2 w-2 rounded-full bg-brand-500" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
