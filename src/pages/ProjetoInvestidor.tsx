import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, TrendingUp, BarChart3, Layers, Calendar, Users, Shield, Target, Rocket, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { investorProjects } from '@/data/investorProjects';
import NotFound from './NotFound';
import fundadorImage from '@/assets/nuno-cruz-fundador.webp';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const investmentTypes = [
  { title: 'Investimento Anjo', icon: Users, desc: 'Capital inicial em troca de equity. Ideal para investidores individuais.' },
  { title: 'SAFE', icon: Shield, desc: 'Investimento convertível sem avaliação imediata. Simples e rápido.' },
  { title: 'Equity Direto', icon: Target, desc: 'Participação direta no capital social da empresa.' },
  { title: 'Seed Investment', icon: Rocket, desc: 'Rondas pré-seed/seed para acelerar desenvolvimento e validação.' },
];

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const ProjetoInvestidor = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = investorProjects.find(p => p.slug === slug);

  if (!project) return <NotFound />;

  const Icon = project.icon;

  return (
    <Layout>
      <SEO
        title={`Investir em ${project.name} | Gestão SaaS e Automação`}
        description={`Descubra o potencial de investimento em ${project.name}. ${project.tagline} Oportunidade única no mercado de ${project.subtitle}.`}
        canonical={`/investidores/${project.slug}`}
        image={fundadorImage}
        type="article"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': `Investir em ${project.name}`,
            'url': `https://getboost.digital/investidores/${project.slug}`,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': project.name,
            'url': `https://getboost.digital/investidores/${project.slug}`,
            'logo': `https://getboost.digital/assets/logos/logo-${project.slug}.svg`,
            'description': project.tagline,
            'founder': {
              '@type': 'Person',
              'name': 'Getboost Digital',
              'url': 'https://getboost.digital/about'
            },
            'sameAs': [
              'https://www.linkedin.com/in/nunocruz',
              'https://www.instagram.com/getboost.digital'
            ]
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': `O que é o ${project.name}?`,
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': project.description[0]
                }
              },
              {
                '@type': 'Question',
                'name': 'Qual é o tamanho do mercado?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': project.market.size
                }
              },
              {
                '@type': 'Question',
                'name': 'Qual é o ticket mínimo de investimento?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': `O ticket mínimo de investimento é ${project.investment.ticketMin}.`
                }
              },
              {
                '@type': 'Question',
                'name': 'Como funciona a automação no Hostify?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'O Hostify automatiza a gestão de reservas, channel manager e housekeeping, integrando plataformas como Booking e Airbnb numa única interface eficiente.'
                }
              },
              {
                '@type': 'Question',
                'name': 'É seguro investir em startups SaaS no Brasil?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Sim, o mercado SaaS no Brasil está em forte expansão, especialmente em setores pouco digitalizados como o turismo e alojamento local.'
                }
              }
            ]
          }
        ]}
      />
      {/* Hero */}
      <section className="relative min-h-[75vh] flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-24">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link to="/investidores" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" /> Voltar aos Projetos
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className={`inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br ${project.color} items-center justify-center mb-6`}>
            <Icon className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
            Investe no {project.name}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            {project.tagline}
          </motion.p>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className={`inline-block text-sm font-medium px-4 py-1.5 rounded-full bg-gradient-to-r ${project.color} text-white mb-8`}>
            {project.statusLabel}
          </motion.span>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => scrollTo('cta-final')} className="gap-2">Solicitar Apresentação <ArrowRight className="h-4 w-4" /></Button>
            <Button size="lg" variant="outline" onClick={() => window.open('/booking', '_self')}>Agendar Reunião</Button>
          </motion.div>
        </div>
      </section>

      {/* O que é */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold text-foreground mb-6">O que é o {project.name}</motion.h2>
            {project.description.map((p, i) => (
              <motion.p key={i} variants={fadeUp} custom={i + 1} className="text-muted-foreground leading-relaxed mb-4">{p}</motion.p>
            ))}
            <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
              {project.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 border border-border/50">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mercado */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Mercado e Oportunidade</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div variants={fadeUp} custom={1}>
                <Card className="h-full border-border/50"><CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Tamanho do mercado</h3>
                  <p className="text-sm text-muted-foreground">{project.market.size}</p>
                </CardContent></Card>
              </motion.div>
              <motion.div variants={fadeUp} custom={2}>
                <Card className="h-full border-border/50"><CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Crescimento</h3>
                  <p className="text-sm text-muted-foreground">{project.market.growth}</p>
                </CardContent></Card>
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={3} className="mt-6">
              <Card className="border-border/50"><CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">Tendências</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {project.market.trends.map((t, i) => (
                    <div key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /><span className="text-sm text-muted-foreground">{t}</span></div>
                  ))}
                </div>
              </CardContent></Card>
            </motion.div>
            <motion.p variants={fadeUp} custom={4} className="mt-6 text-muted-foreground font-medium bg-primary/5 rounded-xl p-5 border border-primary/10">{project.market.potential}</motion.p>
          </motion.div>
        </div>
      </section>

      {/* Modelo de Negócio */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Modelo de Negócio</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: 'Receita', value: project.business.revenue },
                { label: 'Preços', value: project.business.pricing },
                { label: 'Escalabilidade', value: project.business.scalability },
                { label: 'Público-alvo', value: project.business.audience },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i + 1}>
                  <Card className="h-full border-border/50"><CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </CardContent></Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-8">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Roadmap</h2>
            </motion.div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-primary/20 hidden md:block" />
              <div className="space-y-8">
                {project.roadmap.map((phase, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i + 1} className="flex gap-6">
                    <div className="hidden md:flex flex-col items-center">
                      <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${project.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{i + 1}</div>
                    </div>
                    <Card className="flex-1 border-border/50"><CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-3">{phase.phase}</h3>
                      <ul className="space-y-2">
                        {phase.items.map((item, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{item}
                          </li>
                        ))}
                      </ul>
                    </CardContent></Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Oportunidade de Investimento */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-4">
              <Layers className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Oportunidade de Investimento</h2>
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8">Ticket mínimo: <span className="font-bold text-foreground">{project.investment.ticketMin}</span></motion.p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {investmentTypes.map((t, i) => (
                <motion.div key={i} variants={fadeUp} custom={i + 2}>
                  <Card className="h-full border-border/50 hover:shadow-lg transition-shadow"><CardContent className="p-6 flex gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><t.icon className="h-5 w-5 text-primary" /></div>
                    <div><h3 className="font-semibold text-foreground mb-1">{t.title}</h3><p className="text-sm text-muted-foreground">{t.desc}</p></div>
                  </CardContent></Card>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div variants={fadeUp} custom={6}>
                <Card className="h-full border-border/50"><CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">O que o investidor recebe</h3>
                  <ul className="space-y-2">{project.investment.returns.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{r}</li>
                  ))}</ul>
                </CardContent></Card>
              </motion.div>
              <motion.div variants={fadeUp} custom={7}>
                <Card className="h-full border-border/50"><CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">Alocação do investimento</h3>
                  <ul className="space-y-2">{project.investment.allocation.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{a}</li>
                  ))}</ul>
                </CardContent></Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sobre o Fundador */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} custom={0}>
              <img src={fundadorImage} alt="Getboost Digital - Fundador" className="rounded-2xl w-full max-w-sm mx-auto" />
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <h2 className="text-3xl font-bold text-foreground mb-4">Sobre o Fundador</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Getboost Digital tem mais de 20 anos de experiência em marketing digital, desenvolvimento web e transformação digital. Com mais de 1500 projetos entregues, combina visão estratégica com execução técnica.</p>
              <p className="text-muted-foreground leading-relaxed mb-6">Lidera o desenvolvimento de um ecossistema de startups SaaS com IA integrada, focadas em mercados de alto crescimento.</p>
              <Button onClick={() => window.open('/booking', '_self')} className="gap-2">Agendar Reunião <ArrowRight className="h-4 w-4" /></Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Secção Otimizada para SEO */}
      <section className="py-20 bg-section-alt">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground mb-10 text-center">Perguntas Frequentes sobre o {project.name}</h2>
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Como é que a automação beneficia a minha pousada?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  A automação elimina tarefas manuais repetitivas, reduz erros humanos em reservas e sincroniza calendários em tempo real, permitindo que se foque na hospitalidade e não em burocracia.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">O Hostify integra-se com quais plataformas?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Oferecemos um Channel Manager robusto que se integra com Booking.com, Airbnb, Expedia e outras OTAs principais, centralizando tudo num único dashboard.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">É necessário conhecimento técnico para usar a plataforma?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Não. O Hostify foi desenhado para ser intuitivo e simples de usar, com um processo de onboarding guiado para que qualquer pessoa possa gerir o seu negócio digitalmente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="cta-final" className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Queres investir no {project.name}?
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground mb-10">
            Solicita o pitch deck completo ou agenda uma reunião com o fundador.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => window.open('/investidores#formulario', '_self')} className="gap-2">Solicitar Pitch Deck <ArrowRight className="h-4 w-4" /></Button>
            <Button size="lg" variant="outline" onClick={() => window.open('/booking', '_self')}>Agendar Reunião</Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ProjetoInvestidor;
