import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProjectCardData {
  slug: string;
  name: string;
  subtitle: string;
  tagline: string;
  color: string;
  phase: number;
  phaseLabel: string;
  flags: { emoji: string; label: string }[];
  valuation?: string;
  investorInfo: { label: string; value: string }[];
  badges: string[];
  logo?: string;
}

function ProgressBar({ phase }: { phase: number }) {
  const { t } = useTranslation();
  const phaseNames = [
    t('investors.phaseNames.ideation'),
    t('investors.phaseNames.mvp'),
    t('investors.phaseNames.beta'),
    t('investors.phaseNames.launch'),
    t('investors.phaseNames.scale'),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">{phaseNames[phase - 1]}</span>
        <span className="text-xs text-muted-foreground">{phase}/5</span>
      </div>
      <div className="flex gap-1">
        {phaseNames.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < phase ? 'bg-primary' : 'bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {phaseNames.map((name, i) => (
          <span key={name} className={`text-[9px] ${i < phase ? 'text-primary font-medium' : 'text-muted-foreground/50'}`}>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function InvestorProjectCard({ project }: { project: ProjectCardData }) {
  const { t } = useTranslation();
  const scrollToForm = () => document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="group relative bg-white dark:bg-card border border-border/50 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col">
      {/* Gradient top bar */}
      <div className={`h-1.5 bg-gradient-to-r ${project.color}`} />

      <div className="p-6 md:p-8 flex flex-col flex-1 gap-5">
        {/* Header: Logo or Name + Flags */}
        <div>
          {project.logo ? (
            <div className="mb-1">
              <img src={project.logo} alt={`${project.name} logo`} className="h-16 max-w-[270px] object-contain" />
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-foreground">{project.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{project.subtitle}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {project.flags.map((f) => (
                  <span key={f.label} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    <span>{f.emoji}</span> {f.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phase progress */}
        <ProgressBar phase={project.phase} />

        {/* Tagline */}
        <p className="text-sm text-muted-foreground leading-relaxed">{project.tagline}</p>

        {/* Valuation */}
        {project.valuation && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <DollarSign className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('investors.currentValuation')}</p>
              <p className="text-lg font-bold text-primary">{project.valuation}</p>
            </div>
          </div>
        )}

        {/* Investor info */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-2">
          {project.investorInfo.map((info) => (
            <div key={info.label} className="flex items-start gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span><span className="font-semibold text-foreground">{info.label}:</span> <span className="text-muted-foreground">{info.value}</span></span>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {project.badges.map((badge) => (
            <Badge key={badge} variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {badge}
            </Badge>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-auto pt-2 flex flex-col gap-3">
          <Button asChild className="w-full gap-2">
            <Link to={`/investidores/${project.slug}`}>
              {t('investors.viewProject')} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={scrollToForm}>
            {t('investors.ctaPresentation')} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ProjectCardData };
