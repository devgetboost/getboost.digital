import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Building2, TrendingUp, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { supabase } from '@/integrations/supabase/client';

type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  gallery: string[];
  tags: string[];
  year: string;
  client: string;
  results: string;
};

function ProjectGallery({ images, title }: { images: string[]; title: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  if (images.length === 1) {
    return (
      <div className="rounded-2xl overflow-hidden">
        <img src={images[0]} alt={title} className="w-full aspect-[16/9] object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 7000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent>
          {images.map((img, i) => (
            <CarouselItem key={i}>
              <div className="rounded-2xl overflow-hidden">
                <img src={img} alt={`${title} - ${i + 1}`} className="w-full aspect-[16/9] object-cover" loading="lazy" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {/* Dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === current ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
            aria-label={`Ir para imagem ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const PortfolioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      // Get all published projects for navigation
      const { data: all } = await supabase
        .from('projects')
        .select('id, slug, title, category, description, image, gallery, tags, year, client, results')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      const projects = all || [];
      setAllProjects(projects);

      // Find by slug first, then id
      let found = projects.find(p => p.slug === id);
      if (!found) found = projects.find(p => p.id === id);

      if (!found) {
        setNotFound(true);
      } else {
        setProject(found);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></Layout>;
  }
  if (notFound || !project) return <Navigate to="/portfolio" replace />;

  const projectIndex = allProjects.findIndex(p => p.id === project.id);
  const prevProject = projectIndex > 0 ? allProjects[projectIndex - 1] : null;
  const nextProject = projectIndex < allProjects.length - 1 ? allProjects[projectIndex + 1] : null;

  const categoryLabel = project.category === 'branding' ? 'Branding' : project.category === 'web' ? 'Web' : 'Estratégia';

  // Build gallery: use gallery array if available, otherwise fall back to main image
  const galleryImages = project.gallery && project.gallery.length > 0 ? project.gallery : [project.image];

  return (
    <Layout>
      <SEO
        title={project.title}
        description={project.description}
        canonical={`/portfolio/${project.slug}`}
        image={project.image}
      />
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.85) 50%, hsl(var(--primary)) 100%)' }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-sm" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5 blur-sm" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-20 md:pb-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/portfolio" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-8">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Portfolio
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <Badge className="bg-white/10 text-white/90 border-white/20 mb-4 text-sm">{categoryLabel}</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">{project.title}</h1>
            <p className="text-lg md:text-xl text-white/75 mt-4 max-w-2xl leading-relaxed">{project.description}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="flex flex-wrap items-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-white/80"><Building2 className="w-4 h-4" /><span className="text-sm">{project.client}</span></div>
            <div className="flex items-center gap-2 text-white/80"><Calendar className="w-4 h-4" /><span className="text-sm">{project.year}</span></div>
            <div className="flex items-center gap-2 text-white/80"><TrendingUp className="w-4 h-4" /><span className="text-sm font-semibold">{project.results}</span></div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Project Gallery */}
      <section className="section-padding">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <ProjectGallery images={galleryImages} title={project.title} />
          </motion.div>
        </div>
      </section>

      {/* Details */}
      <section className="section-padding">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-2 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">Sobre o Projeto</h2>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>
            <p className="text-muted-foreground leading-relaxed">
              Trabalhamos em conjunto com a equipa da {project.client} para desenvolver uma solução integrada que combinasse criatividade com dados e performance.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cliente</h3>
              <p className="font-medium">{project.client}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ano</h3>
              <p className="font-medium">{project.year}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resultados</h3>
              <p className="font-semibold text-primary">{project.results}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Prev / Next */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2">
          {prevProject ? (
            <Link to={`/portfolio/${prevProject.slug}`} className="group flex items-center gap-4 p-8 md:p-12 hover:bg-secondary/30 transition-colors border-r border-border">
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Anterior</span>
                <p className="font-semibold group-hover:text-primary transition-colors mt-1">{prevProject.title}</p>
              </div>
            </Link>
          ) : <div />}
          {nextProject ? (
            <Link to={`/portfolio/${nextProject.slug}`} className="group flex items-center justify-end gap-4 p-8 md:p-12 hover:bg-secondary/30 transition-colors text-right">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Próximo</span>
                <p className="font-semibold group-hover:text-primary transition-colors mt-1">{nextProject.title}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          ) : <div />}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Queres resultados semelhantes?</h2>
          <p className="text-muted-foreground mb-8">Agenda uma consulta gratuita e vamos definir a melhor estratégia para o teu negócio.</p>
          <Button asChild size="lg" className="rounded-[12px] px-8 text-base font-semibold">
            <Link to="/booking">Agendar Consulta Gratuita <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default PortfolioDetail;
