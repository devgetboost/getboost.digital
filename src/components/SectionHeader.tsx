import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface SectionHeaderProps {
  badge?: string;
  title: string;
  /** Substring of title rendered in primary color. Takes precedence over highlightLast. */
  accent?: string;
  /** Colors the last N words of the title in primary. Ignored when accent is provided. */
  highlightLast?: number;
  subtitle?: React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
  titleClassName?: string;
  /** Override the accent (highlighted words) color class. */
  accentClassName?: string;
  /** Use light typography for dark/colored backgrounds (e.g., orange). */
  tone?: 'default' | 'onColor';
}

/**
 * Shared section header: outlined pill badge + large tight title with an
 * orange accent segment + optional subtitle. Reused across the site so all
 * sections share the same rhythm and typographic scale.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  title,
  accent,
  highlightLast,
  subtitle,
  align = 'center',
  className = '',
  titleClassName = '',
  accentClassName,
  tone = 'default',
}) => {
  const isCenter = align === 'center';
  const onColor = tone === 'onColor';
  const accentClass = accentClassName ?? 'text-primary';

  let titleNode: React.ReactNode = title;
  if (accent && title.includes(accent)) {
    const idx = title.indexOf(accent);
    const before = title.slice(0, idx);
    const after = title.slice(idx + accent.length);
    titleNode = (
      <>
        {before}
        <span className={accentClass}>{accent}</span>
        {after}
      </>
    );
  } else if (highlightLast && highlightLast > 0) {
    const words = title.split(' ');
    if (words.length > highlightLast) {
      const head = words.slice(0, -highlightLast).join(' ');
      const tail = words.slice(-highlightLast).join(' ');
      titleNode = (
        <>
          {head}{' '}
          <span className={accentClass}>{tail}</span>
        </>
      );
    }
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className={`${isCenter ? 'text-center' : 'text-left'} mb-12 md:mb-16 ${className}`}
    >
      {badge && (
        <motion.span
          variants={fadeUp}
          custom={0}
          className={`inline-flex items-center rounded-full px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] mb-6 ${
            onColor
              ? 'border border-white/70 bg-transparent text-white'
              : 'border border-primary/60 bg-primary/5 text-primary'
          }`}
        >
          {badge}
        </motion.span>
      )}
      <motion.h2
        variants={fadeUp}
        custom={1}
        className={`text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight ${
          onColor ? 'text-white' : 'text-foreground'
        } ${isCenter ? 'max-w-4xl mx-auto' : ''} ${titleClassName}`}
      >
        {titleNode}
      </motion.h2>
      {subtitle && (
        <motion.div
          variants={fadeUp}
          custom={2}
          className={`mt-5 text-base md:text-lg leading-relaxed ${
            onColor ? 'text-white/90' : 'text-muted-foreground'
          } ${isCenter ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}
        >
          {subtitle}
        </motion.div>
      )}
    </motion.div>
  );
};

export default SectionHeader;
