import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { StandardCTA } from '@/components/StandardCTA';




interface PageHeroProps {
  badge?: string;
  badgeAccent?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  description?: string;
  stats?: { label: string; value: string }[];
  cta?: { 
    label?: string; 
    i18nKey: string;
    href: string; 
    category: string;
    ctaType: string;
    onClick?: () => void 
  };
  secondaryCta?: { 
    label?: string; 
    i18nKey: string;
    href: string; 
    category: string;
    ctaType: string;
    onClick?: () => void 
  };
  features?: string[];
  checkmarks?: string[];
  backgroundImage?: string;
}

const PageHero = ({ badge, badgeAccent, title, highlight, subtitle, description, stats, cta, secondaryCta, features, checkmarks, backgroundImage }: PageHeroProps) => (
  <section className="relative overflow-hidden hero-wave-clip" style={{ background: 'linear-gradient(135deg, #2d1400 0%, #1a0a00 40%, #3d1a00 70%, #1a0a00 100%)' }}>
    {/* Background image with lighter warm overlay */}
    {backgroundImage && (
      <div className="absolute inset-0">
        <img src={backgroundImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(45,20,0,0.55) 0%, rgba(60,25,0,0.50) 35%, rgba(80,35,0,0.45) 65%, rgba(45,20,0,0.58) 100%)' }} />
      </div>
    )}

    {/* Warm orange gradient blobs — brighter */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-[-20%] left-[10%] w-[700px] h-[700px] rounded-full blur-[200px]" style={{ background: 'rgba(255, 90, 20, 0.22)' }} />
      <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full blur-[180px]" style={{ background: 'rgba(255, 120, 40, 0.15)' }} />
      <div className="absolute bottom-[-10%] left-[40%] w-[600px] h-[600px] rounded-full blur-[200px]" style={{ background: 'rgba(220, 80, 10, 0.25)' }} />
    </div>

    {/* Subtle grain overlay */}
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

    {/* Content */}
    <div className="relative flex flex-col items-center text-center max-w-4xl mx-auto px-6 pt-28 md:pt-36 pb-32 md:pb-40">
      {/* Badge */}
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
        >
          {badgeAccent && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'hsl(15 100% 50%)', color: '#fff' }}>
              {badgeAccent}
            </span>
          )}
          <span className="text-sm font-medium text-white/80">{badge}</span>
        </motion.div>
      )}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] text-white"
      >
        {title}
        {highlight && (
          <>
            <br className="hidden sm:block" />
            <span>{highlight}</span>
          </>
        )}
      </motion.h1>


      {/* Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-base md:text-lg text-white/60 mt-6 max-w-2xl leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="text-sm text-white/45 mt-3 max-w-xl leading-relaxed"
        >
          {description}
        </motion.p>
      )}

      {/* Feature tags */}
      {features && features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2 mt-6"
        >
          {features.map((feat, i) => (
            <span key={i} className="px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/10 text-sm text-white/70 backdrop-blur-sm">
              {feat}
            </span>
          ))}
        </motion.div>
      )}

      {/* CTA Buttons */}
      {(cta || secondaryCta) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mt-10"
        >
          {cta && (
            <StandardCTA
              i18nKey={cta.i18nKey}
              href={cta.href}
              category={cta.category}
              ctaType={cta.ctaType}
              onClick={cta.onClick}
              showArrow
              className="px-6 md:px-8 py-3.5 h-auto rounded-full text-sm md:text-base font-medium transition-all max-w-full"
              style={{ background: '#f5f3ef', color: '#1a0a00' }}
            />
          )}
          {secondaryCta && (
            <StandardCTA
              i18nKey={secondaryCta.i18nKey}
              href={secondaryCta.href}
              category={secondaryCta.category}
              ctaType={secondaryCta.ctaType}
              onClick={secondaryCta.onClick}
              showArrow
              variant="outline"
              className="px-6 md:px-8 py-3.5 h-auto rounded-full border-white/35 bg-white/10 text-white text-sm md:text-base font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all max-w-full"
            />
          )}
        </motion.div>
      )}

      {/* Checkmark stats row */}
      {checkmarks && checkmarks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mt-10"
        >
          {checkmarks.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-white/60">
              <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white/70" />
              </div>
              <span className="text-sm" dangerouslySetInnerHTML={{ __html: item }} />
            </div>
          ))}
        </motion.div>
      )}

      {/* Stats row (legacy support) */}
      {stats && stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-wrap justify-center items-center gap-10 mt-10 pt-8 border-t border-white/10"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
              <span className="text-sm text-white/50 mt-0.5">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>

  </section>
);

export default PageHero;
