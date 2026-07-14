import { useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Download, User, Target, Camera, Rocket, MessageSquare, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const BrandingGuide = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const authorized = (location.state as any)?.authorized;
  const guideRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = useCallback(async () => {
    if (!guideRef.current) return;
    const canvas = await html2canvas(guideRef.current, { scale: 2, useCORS: true, logging: false });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save('Guia_Branding_Pessoal.pdf');
  }, []);

  const fadeIn = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

  if (!authorized) return <Navigate to="/resources/4" replace />;

  return (
    <Layout>
      <SEO title={t('brandingGuide.seoTitle')} description={t('brandingGuide.seoDesc')} canonical="/tools/branding-guide" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,10,0,0.92) 0%, rgba(255,64,0,0.80) 50%, rgba(26,10,0,0.90) 100%)' }} />
        <div className="relative max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-16 md:pb-24 text-center">
          <motion.div {...fadeIn}>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 bg-white/10 px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" /> {t('brandingGuide.badge')}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">{t('brandingGuide.heroTitle')}</h1>
            <p className="text-lg text-white/75 max-w-2xl mx-auto mb-8">{t('brandingGuide.heroSubtitle')}</p>
            <Button size="lg" className="rounded-full h-14 px-8 text-base font-semibold" onClick={handleDownloadPDF}>
              <Download className="w-5 h-5 mr-2" /> {t('brandingGuide.downloadPdf')}
            </Button>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full"><path d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z" fill="hsl(var(--background))" /></svg>
        </div>
      </section>

      {/* Guide Content */}
      <div ref={guideRef}>
        {/* Section 1: Framework de Posicionamento Pessoal */}
        <section className="section-padding">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeIn}>
              <SectionHeader icon={<Target className="w-7 h-7 text-primary" />} number="01" title={t('brandingGuide.s1Title')} subtitle={t('brandingGuide.s1Subtitle')} />
              <div className="space-y-6 mt-8">
                <GuideCard title={t('brandingGuide.s1Step1Title')} items={t('brandingGuide.s1Step1Items', { returnObjects: true }) as string[]} />
                <GuideCard title={t('brandingGuide.s1Step2Title')} items={t('brandingGuide.s1Step2Items', { returnObjects: true }) as string[]} />
                <GuideCard title={t('brandingGuide.s1Step3Title')} items={t('brandingGuide.s1Step3Items', { returnObjects: true }) as string[]} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Estratégia de Conteúdo */}
        <section className="section-padding bg-secondary/30">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeIn}>
              <SectionHeader icon={<MessageSquare className="w-7 h-7 text-primary" />} number="02" title={t('brandingGuide.s2Title')} subtitle={t('brandingGuide.s2Subtitle')} />
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <PlatformCard platform="LinkedIn" items={t('brandingGuide.s2LinkedIn', { returnObjects: true }) as string[]} />
                <PlatformCard platform="Instagram" items={t('brandingGuide.s2Instagram', { returnObjects: true }) as string[]} />
                <PlatformCard platform="Facebook" items={t('brandingGuide.s2Facebook', { returnObjects: true }) as string[]} />
                <PlatformCard platform={t('brandingGuide.s2BlogLabel')} items={t('brandingGuide.s2Blog', { returnObjects: true }) as string[]} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: Templates de Bio e Elevator Pitch */}
        <section className="section-padding">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeIn}>
              <SectionHeader icon={<User className="w-7 h-7 text-primary" />} number="03" title={t('brandingGuide.s3Title')} subtitle={t('brandingGuide.s3Subtitle')} />
              <div className="space-y-6 mt-8">
                <TemplateCard label={t('brandingGuide.s3Bio1Label')} template={t('brandingGuide.s3Bio1Template')} />
                <TemplateCard label={t('brandingGuide.s3Bio2Label')} template={t('brandingGuide.s3Bio2Template')} />
                <TemplateCard label={t('brandingGuide.s3PitchLabel')} template={t('brandingGuide.s3PitchTemplate')} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 4: Fotografia e Identidade Visual */}
        <section className="section-padding bg-secondary/30">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeIn}>
              <SectionHeader icon={<Camera className="w-7 h-7 text-primary" />} number="04" title={t('brandingGuide.s4Title')} subtitle={t('brandingGuide.s4Subtitle')} />
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <GuideCard title={t('brandingGuide.s4Photo')} items={t('brandingGuide.s4PhotoItems', { returnObjects: true }) as string[]} />
                <GuideCard title={t('brandingGuide.s4Visual')} items={t('brandingGuide.s4VisualItems', { returnObjects: true }) as string[]} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 5: Plano de Ação 30 Dias */}
        <section className="section-padding">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeIn}>
              <SectionHeader icon={<Rocket className="w-7 h-7 text-primary" />} number="05" title={t('brandingGuide.s5Title')} subtitle={t('brandingGuide.s5Subtitle')} />
              <div className="space-y-4 mt-8">
                {([1, 2, 3, 4] as const).map((week) => (
                  <WeekCard key={week} week={week} title={t(`brandingGuide.s5Week${week}Title`)} items={t(`brandingGuide.s5Week${week}Items`, { returnObjects: true }) as string[]} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* CTA Download */}
      <section className="section-padding">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('brandingGuide.ctaTitle')}</h2>
          <p className="text-muted-foreground mb-8">{t('brandingGuide.ctaDesc')}</p>
          <Button size="lg" className="rounded-full h-14 px-8 text-base font-semibold" onClick={handleDownloadPDF}>
            <Download className="w-5 h-5 mr-2" /> {t('brandingGuide.downloadPdf')}
          </Button>
        </div>
      </section>
    </Layout>
  );
};

/* Sub-components */
const SectionHeader = ({ icon, number, title, subtitle }: { icon: React.ReactNode; number: string; title: string; subtitle: string }) => (
  <div className="flex items-start gap-4 mb-2">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">{icon}</div>
    <div>
      <span className="text-xs font-bold text-primary tracking-widest">{number}</span>
      <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
    </div>
  </div>
);

const GuideCard = ({ title, items }: { title: string; items: string[] }) => (
  <Card className="bg-background border-border">
    <CardContent className="p-6">
      <h3 className="font-bold text-lg mb-3">{title}</h3>
      <ul className="space-y-2">
        {Array.isArray(items) && items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const PlatformCard = ({ platform, items }: { platform: string; items: string[] }) => (
  <Card className="bg-background border-border">
    <CardContent className="p-6">
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-primary" /> {platform}
      </h3>
      <ul className="space-y-2">
        {Array.isArray(items) && items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const TemplateCard = ({ label, template }: { label: string; template: string }) => (
  <Card className="bg-background border-border">
    <CardContent className="p-6">
      <span className="text-xs font-bold text-primary tracking-widest">{label}</span>
      <p className="mt-2 text-foreground/80 italic leading-relaxed">{template}</p>
    </CardContent>
  </Card>
);

const WeekCard = ({ week, title, items }: { week: number; title: string; items: string[] }) => (
  <Card className="bg-background border-border">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{week}</span>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <ul className="space-y-2 ml-11">
        {Array.isArray(items) && items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default BrandingGuide;
