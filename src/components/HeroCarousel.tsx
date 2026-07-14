import { useEffect, useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';


export interface HeroSlide {
  id: string;
  image_url: string;
  title: string;
  subtitle: string | null;
  badge_new: boolean;
  badge_label: string | null;
  cta_primary_label: string | null;
  cta_primary_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  order_index: number;
  is_active: boolean;
}

interface Props {
  fallback: ReactNode;
  checks?: string[];
  autoPlayMs?: number;
}

export default function HeroCarousel({ fallback, checks, autoPlayMs = 6000 }: Props) {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(5)
      .then(({ data }) => setSlides((data as HeroSlide[]) ?? []));
  }, []);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    timer.current = window.setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      autoPlayMs,
    );
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, slides, autoPlayMs]);

  if (slides === null) return null;
  if (slides.length === 0) return <>{fallback}</>;

  const slide = slides[index];
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <section className="relative overflow-hidden bg-background hero-wave-clip">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={slide.image_url}
            alt={slide.title}
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      </AnimatePresence>

      <div className="relative flex flex-col items-center text-center max-w-4xl mx-auto px-6 pt-36 md:pt-48 pb-40 md:pb-56">
        {(slide.badge_new || slide.badge_label) && (
          <motion.div
            key={`badge-${slide.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
          >
            {slide.badge_new && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                Novo
              </span>
            )}
            {slide.badge_label && (
              <span className="text-sm font-medium text-white/80">{slide.badge_label}</span>
            )}
          </motion.div>
        )}

        <motion.h1
          key={`title-${slide.id}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] text-white"
        >
          {slide.title}
        </motion.h1>

        {slide.subtitle && (
          <motion.p
            key={`sub-${slide.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-base md:text-lg text-white/70 mt-6 max-w-2xl leading-relaxed"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {(slide.cta_primary_label || slide.cta_secondary_label) && (
          <motion.div
            key={`ctas-${slide.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mt-10"
          >
            {slide.cta_primary_label && slide.cta_primary_href && (
              <Link
                to={slide.cta_primary_href}
                data-cta="hero_slide_primary"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-medium transition-all"
                style={{ background: '#f5f3ef', color: '#1a0a00' }}
              >
                {slide.cta_primary_label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {slide.cta_secondary_label && slide.cta_secondary_href && (
              <Link
                to={slide.cta_secondary_href}
                data-cta="hero_slide_secondary"
                className="inline-flex items-center px-8 py-3.5 rounded-full border border-white/35 bg-white/10 text-white text-base font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                {slide.cta_secondary_label}
              </Link>
            )}
          </motion.div>
        )}

        {checks && checks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mt-12"
          >
            {checks.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/60">
                <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-white/70" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            aria-label="Anterior"
            onClick={() => go(-1)}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Próximo"
            onClick={() => go(1)}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-24 md:bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Ir para slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
      
    </section>
  );
}
