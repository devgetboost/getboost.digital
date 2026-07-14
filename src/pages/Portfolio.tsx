import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import PageHero from '@/components/PageHero';
import heroStrategy from '@/assets/hero-strategy.jpg';
import { supabase } from '@/integrations/supabase/client';
import {
  ScrollXCarousel,
  ScrollXCarouselContainer,
  ScrollXCarouselProgress,
  ScrollXCarouselWrap,
} from '@/components/ui/scroll-x-carousel';
import {
  CardHoverReveal,
  CardHoverRevealContent,
  CardHoverRevealMain,
} from '@/components/ui/reveal-on-hover';
import { Badge } from '@/components/ui/badge';

type Project = { id: string; slug: string; title: string; category: string; description: string; image: string; tags: string[]; year: string; client: string; results: string; };

const sampleProjects: Project[] = [
  {
    id: 'sample-1',
    slug: 'aguas-regiao-aveiro',
    title: 'Fornecer ao cidadão uma nova experiência para gerir a água.',
    category: 'web',
    description: 'Plataforma digital para gestão de serviços de água.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
    tags: ['React', 'TypeScript', 'Tailwind', 'Supabase', 'Node.js', 'PostgreSQL'],
    year: '2024',
    client: 'Águas de Aveiro',
    results: '+45% engagement',
  },
  {
    id: 'sample-2',
    slug: 'motivae-app',
    title: 'Uma app que transforma hábitos em conquistas diárias.',
    category: 'branding',
    description: 'Aplicação mobile de produtividade e bem-estar.',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&q=80',
    tags: ['React Native', 'Figma', 'Branding', 'UI/UX'],
    year: '2024',
    client: 'Motivae',
    results: '10k+ downloads',
  },
];

const Portfolio = () => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const filters = ['all', 'branding', 'web', 'strategy'] as const;

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('id, slug, title, category, description, image, tags, year, client, results').eq('status', 'published').order('created_at', { ascending: false });
      setProjects(data && data.length > 0 ? data : sampleProjects);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.category === filter);

  return (
    <Layout>
      <SEO title={`${t('portfolio.title')} — Marketing Digital`} description={t('portfolioPage.heroSubtitle')} canonical="/portfolio" lang={i18n.language as 'pt' | 'en' | 'es'} />
      <PageHero
        badge={t('portfolioPage.badge')}
        title={t('portfolioPage.heroTitle')}
        highlight={t('portfolioPage.heroHighlight')}
        subtitle={t('portfolioPage.heroSubtitle')}
        cta={{ i18nKey: 'portfolioPage.heroCta', href: '/booking', category: 'portfolio', ctaType: 'hero_cta' }}
        secondaryCta={{ i18nKey: 'portfolioPage.heroSecondaryCta', href: '/solucoes', category: 'portfolio', ctaType: 'hero_secondary_cta' }}
        checkmarks={[t('portfolioPage.checkClients'), t('portfolioPage.checkGrowth'), t('portfolioPage.checkLeads')]}
        backgroundImage={heroStrategy}
      />

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary mb-3">PORTFÓLIO</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">Trabalhos selecionados</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                {t(`portfolio.filters.${f}`)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Sem projetos nesta categoria.</div>
          ) : null}
        </div>

        {!loading && filtered.length > 0 && (
          <ScrollXCarousel className="h-[150vh]">
            <ScrollXCarouselContainer className="h-dvh place-content-center flex flex-col gap-8 py-12">
              <div className="pointer-events-none w-[12vw] h-[103%] absolute inset-[0_auto_0_0] z-10 bg-[linear-gradient(90deg,_hsl(var(--background))_35%,_transparent)]" />
              <div className="pointer-events-none bg-[linear-gradient(270deg,_hsl(var(--background))_35%,_transparent)] w-[15vw] h-[103%] absolute inset-[0_0_0_auto] z-10" />

              <ScrollXCarouselWrap className="flex space-x-8 [&>*:first-child]:ml-8">
                {filtered.map((project) => (
                  <Link to={`/portfolio/${project.slug}`} key={project.id} className="block">
                    <CardHoverReveal className="min-w-[70vw] md:min-w-[38vw] shadow-xl border xl:min-w-[30vw] rounded-xl aspect-[4/5]">
                      <CardHoverRevealMain>
                        <img
                          alt={project.title}
                          src={project.image}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      </CardHoverRevealMain>
                      <CardHoverRevealContent className="space-y-4 rounded-2xl bg-[rgba(0,0,0,.55)] backdrop-blur-3xl p-4">
                        <div className="space-y-2">
                          <h3 className="text-sm text-white/80">Cliente</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="capitalize rounded-full bg-primary text-primary-foreground">
                              {project.client}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm text-white/80">Tecnologias</h3>
                          <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="capitalize rounded-full">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2 mt-2">
                          <h3 className="text-white capitalize font-medium">{project.title}</h3>
                          <p className="text-white/80 text-sm">{project.description}</p>
                        </div>
                      </CardHoverRevealContent>
                    </CardHoverReveal>
                  </Link>
                ))}
              </ScrollXCarouselWrap>
              <ScrollXCarouselProgress
                className="bg-secondary mx-8 h-1 rounded-full overflow-hidden"
                progressStyle="size-full bg-primary rounded-full"
              />
            </ScrollXCarouselContainer>
          </ScrollXCarousel>
        )}
      </section>
    </Layout>
  );
};

export default Portfolio;
