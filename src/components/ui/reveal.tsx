import { motion, useReducedMotion } from 'framer-motion';

/**
 * Getboost 2027 — R19 motion primitives (frozen).
 *
 * Before R19 execution, 32 pages each carried a byte-identical local copy of
 * `Reveal` and 38 carried a local copy of `fadeUp`. The motion system is one
 * system: it lives here, once.
 *
 * Semantics (unchanged from the per-page copies, so nothing moves differently):
 *  - `fadeUp` fades and lifts 30px on enter, with a per-index delay;
 *  - `Reveal` fires once, in view, and honours `prefers-reduced-motion`;
 *  - `stagger` is the parent variant used with `Reveal` children.
 */

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export interface RevealProps {
  children: React.ReactNode;
  /** Position in the stagger order — drives the entrance delay. */
  i?: number;
  className?: string;
  /** Render as something other than a div (e.g. a list item). */
  as?: 'div' | 'li' | 'article' | 'section';
}

/**
 * Scroll-triggered entrance used by every public section. One observer per
 * instance, once-only, and a no-op under reduced motion — the frozen
 * behaviour every page already had.
 */
export const Reveal = ({ children, i = 0, className, as = 'div' }: RevealProps) => {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];
  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={i}
      className={className}
    >
      {children}
    </Tag>
  );
};

Reveal.displayName = 'Reveal';
