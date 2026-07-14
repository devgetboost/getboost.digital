import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Resource } from '@/data/resources';

export const categoryStyles: Record<
  Resource['category'],
  { bg: string; fg: string; label: string }
> = {
  guides: { bg: '#ff4000', fg: '#ffffff', label: 'GUIA · GETBOOST' },
  templates: { bg: '#0a0603', fg: '#ff4000', label: 'TEMPLATE · GETBOOST' },
  tools: { bg: '#ffb494', fg: '#0a0603', label: 'FERRAMENTA · GETBOOST' },
};

interface ResourceCardProps {
  resource: Resource;
  index?: number;
}

const ResourceCard = ({ resource, index = 0 }: ResourceCardProps) => {
  const { t } = useTranslation();
  const s = categoryStyles[resource.category];
  const isTool = resource.category === 'tools';
  const title = t(`resourceDetail.items.${resource.id}.headline`, {
    defaultValue: resource.title,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        to={`/resources/${resource.id}`}
        className="group block h-full border border-white/10 rounded-2xl overflow-hidden hover:border-[#ff4000]/50 transition-all"
      >
        <div
          className="relative aspect-[4/5] overflow-hidden flex flex-col justify-between p-6"
          style={{ background: s.bg, color: s.fg }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${s.fg} 1px, transparent 1px), linear-gradient(90deg, ${s.fg} 1px, transparent 1px)`,
              backgroundSize: '44px 44px',
            }}
          />
          <div className="relative font-mono text-[10px] tracking-[0.28em]" style={{ opacity: 0.85 }}>
            {s.label}
          </div>
          <div className="relative">
            <h4 className="font-black leading-[0.95] text-[clamp(1.5rem,3vw,2.25rem)] line-clamp-3">
              {title}
            </h4>
            <div className="mt-4 font-mono text-[10px] tracking-[0.24em]" style={{ opacity: 0.85 }}>
              {t(`resources.filters.${resource.category}`).toUpperCase()} · 100% GRÁTIS · PDF
            </div>
            <div className="mt-4 h-px w-full" style={{ background: s.fg, opacity: 0.5 }} />
            <div className="mt-4 flex items-center justify-between font-mono text-[11px] tracking-[0.24em]">
              <span>{isTool ? 'ACEDER AGORA' : 'FAZER DOWNLOAD'}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ResourceCard;
