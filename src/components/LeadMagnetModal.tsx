import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { analytics, getJourney } from '@/lib/analytics';
import { captureLead, CommercialWriteError } from '@/lib/commercialApi';
import { marketForLanguage, localeForLanguage } from '@/lib/commercialMarket';
import {
  ASSESSMENTS,
  getAssessment,
  pillarBreakdown,
  scoreAssessment,
  type AssessmentScore,
} from '@/lib/lead-magnets';

/** Global opener: `openLeadMagnet('ai-readiness')` from anywhere, no props drilling. */
export const LEAD_MAGNET_EVENT = 'gb:open-lead-magnet';
export const openLeadMagnet = (assessmentId?: string): void => {
  try {
    window.dispatchEvent(new CustomEvent(LEAD_MAGNET_EVENT, { detail: { assessmentId } }));
  } catch {
    // non-browser or closed env — no-op by design
  }
};

type View = 'picker' | 'intro' | 'quiz' | 'score' | 'lead' | 'analysis';

const CATEGORY_TINT: Record<string, { bg: string; fg: string }> = {
  AI: { bg: 'var(--gb-ai-tint)', fg: 'var(--gb-ai-strong)' },
  Automation: { bg: 'var(--gb-automation-tint)', fg: 'var(--gb-automation-strong)' },
  Software: { bg: 'var(--gb-software-tint)', fg: 'var(--gb-software-strong)' },
  Growth: { bg: 'var(--gb-growth-tint)', fg: 'var(--gb-growth-strong)' },
  'Digital Operations': { bg: 'var(--gb-brand-50)', fg: 'var(--gb-brand-600)' },
};

/**
 * R20.4 — assessment modal. Value first: questions → score, then the lead
 * gate unlocks the full analysis. Minimal capture (name/email/company +
 * explicit consent), no silent capture, no excess fields.
 */
export const LeadMagnetModal = ({
  open,
  onClose,
  initialAssessment,
}: {
  open: boolean;
  onClose: () => void;
  initialAssessment?: string;
}) => {
  const { i18n } = useTranslation();
  const [view, setView] = useState<View>(initialAssessment ? 'intro' : 'picker');
  const [assessmentId, setAssessmentId] = useState<string | null>(initialAssessment ?? null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<AssessmentScore | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const assessment = assessmentId ? getAssessment(assessmentId) : undefined;

  // Fresh run on every opening.
  useEffect(() => {
    if (open) {
      const initial = initialAssessment ?? null;
      setAssessmentId(initial);
      setView(initial ? 'intro' : 'picker');
      setAnswers({});
      setScore(null);
      setName('');
      setEmail('');
      setCompany('');
      setConsent(false);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, initialAssessment]);

  const begin = useCallback(
    (id: string) => {
      setAssessmentId(id);
      setAnswers({});
      setView('quiz');
      analytics.trackAssessment(id, 'start');
    },
    [],
  );

  const answer = useCallback(
    (questionId: string, points: number) => {
      if (!assessment) return;
      const next = { ...answers, [questionId]: points };
      setAnswers(next);
      analytics.trackAssessment(assessment.id, 'progress', {
        answered: Object.keys(next).length,
        total: assessment.questions.length,
      });
      if (Object.keys(next).length >= assessment.questions.length) {
        const result = scoreAssessment(assessment, next);
        setScore(result);
        setView('score');
        analytics.trackAssessment(assessment.id, 'complete', {
          score: result.percentage,
          tier: result.tier,
        });
      }
    },
    [answers, assessment],
  );

  const submitLead = useCallback(async () => {
    if (!assessment || !score) return;
    if (!name.trim() || !email.trim()) {
      setFormError('Preenche o nome e o email para receberes a análise.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Esse email parece inválido — confirma por favor.');
      return;
    }
    if (!consent) {
      setFormError('Precisamos do teu consentimento para enviar a análise.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const { error } = await captureLead({
        source: `lead-magnet:${assessment.id}`,
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || null,
        service_interest: assessment.category,
        market: marketForLanguage(i18n.language),
        locale: localeForLanguage(i18n.language),
        consent: { marketing: true },
        legacy: {
          assessment: assessment.id,
          score: String(score.percentage),
          tier: score.tier,
        },
      }).then(
        () => ({ error: null as null }),
        (err: CommercialWriteError) => ({ error: err }),
      );
      if (error) {
        setFormError('Não foi possível enviar. Tenta novamente.');
        return;
      }
      // R20.9 — the journey (paths only, no PII) joins the lead capture so
      // the qualification engine can attribute landing → case → assessment
      // → lead end-to-end, exactly as booking/contact already do.
      analytics.trackAssessment(assessment.id, 'lead_capture', {
        score: score.percentage,
        tier: score.tier,
        journey: getJourney(),
      });
      setView('analysis');
      analytics.trackAssessment(assessment.id, 'result_view', {
        score: score.percentage,
        tier: score.tier,
      });
    } finally {
      setSubmitting(false);
    }
  }, [assessment, score, name, email, company, consent, i18n.language]);

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = assessment?.questions.find((q) => !(q.id in answers)) ?? null;
  const tierCopy = assessment && score ? assessment.tiers[score.tier] : null;
  const breakdown = assessment && score ? pillarBreakdown(assessment, answers) : {};

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="gb-text-h3 text-ink-primary">
            {assessment ? assessment.headline : 'Avaliações gratuitas'}
          </DialogTitle>
          <DialogDescription className="gb-text-small text-ink-secondary">
            {assessment ? assessment.benefit : 'Escolhe uma avaliação — demora 3 minutos.'}
          </DialogDescription>
        </DialogHeader>

        {view === 'picker' && (
          <div className="flex flex-col gap-3 pt-2">
            {ASSESSMENTS.map((item) => {
              const tint = CATEGORY_TINT[item.category] ?? CATEGORY_TINT['Digital Operations'];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAssessmentId(item.id);
                    setView('intro');
                  }}
                  className="rounded-2xl border border-black/[0.06] bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  <span
                    className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: tint.bg, color: tint.fg }}
                  >
                    {item.category} · {item.timeEstimate}
                  </span>
                  <span className="gb-text-body mt-2 block font-semibold text-ink-primary">{item.headline}</span>
                </button>
              );
            })}
          </div>
        )}

        {view === 'intro' && assessment && (
          <div className="flex flex-col gap-4 pt-2">
            <p className="gb-text-body text-ink-secondary">{assessment.benefit}</p>
            <p className="gb-text-small text-ink-tertiary">
              {assessment.questions.length} perguntas · {assessment.timeEstimate} · sem compromisso
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => (initialAssessment ? onClose() : setView('picker'))}>
                Voltar
              </Button>
              <Button onClick={() => begin(assessment.id)} className="flex-1">
                {assessment.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {view === 'quiz' && assessment && currentQuestion && (
          <div className="flex flex-col gap-4 pt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[#ff4000] transition-all duration-300"
                style={{ width: `${Math.round((answeredCount / assessment.questions.length) * 100)}%` }}
              />
            </div>
            <p className="gb-text-small font-medium text-ink-tertiary">
              Pergunta {answeredCount + 1} de {assessment.questions.length}
            </p>
            <h3 className="gb-text-h3 text-ink-primary">{currentQuestion.text}</h3>
            <div className="flex flex-col gap-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => answer(currentQuestion.id, option.points)}
                  className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-left text-[15px] text-ink-primary transition-all duration-150 hover:-translate-y-px hover:border-[#ff4000]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'score' && assessment && score && tierCopy && (
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <div className="gb-text-display text-brand-600">{score.percentage}%</div>
            <h3 className="gb-text-h3 text-ink-primary">{tierCopy.title}</h3>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => begin(assessment.id)}>
                Repetir
              </Button>
              <Button onClick={() => setView('lead')}>
                Ver análise completa
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {view === 'lead' && assessment && score && (
          <div className="flex flex-col gap-3 pt-2">
            <p className="gb-text-body text-ink-secondary">
              Deixa os teus dados para receberes a análise completa de <strong>{tierCopy?.title}</strong> ({score.percentage}%).
            </p>
            <Input
              type="text"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={submitting}
              aria-label="Nome"
            />
            <Input
              type="email"
              placeholder="Email profissional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              disabled={submitting}
              aria-label="Email"
            />
            <Input
              type="text"
              placeholder="Empresa (opcional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={120}
              disabled={submitting}
              aria-label="Empresa"
            />
            <label className="flex cursor-pointer items-start gap-2.5 pt-1">
              <Checkbox
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                disabled={submitting}
                className="mt-0.5 shrink-0"
              />
              <span className="text-xs leading-snug text-ink-secondary">
                Aceito ser contactado pela Getboost com a análise e próximos passos.
              </span>
            </label>
            {formError && (
              <p role="alert" className="text-sm font-medium text-error">
                {formError}
              </p>
            )}
            <Button onClick={submitLead} disabled={submitting} loading={submitting}>
              Receber análise
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {view === 'analysis' && assessment && score && tierCopy && (
          <div className="flex flex-col gap-4 pt-2">
            <h3 className="gb-text-h3 text-ink-primary">
              {tierCopy.title} · {score.percentage}%
            </h3>
            <p className="gb-text-body text-ink-secondary">{tierCopy.analysis}</p>
            {Object.keys(breakdown).length > 0 && (
              <div className="flex flex-col gap-2">
                {Object.entries(breakdown).map(([pillar, pct]) => (
                  <div key={pillar} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
                      {pillar}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                      <div className="h-full rounded-full bg-[#ff4000]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs font-bold text-ink-primary">{pct}%</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <p className="gb-eyebrow text-ink-tertiary">Oportunidades</p>
              {assessment.opportunities.map((opportunity) => (
                <p key={opportunity} className="flex items-start gap-2 text-sm text-ink-primary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {opportunity}
                </p>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to="/booking" onClick={onClose}>
                  Agendar diagnóstico
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/demo" onClick={onClose}>
                  Pedir demonstração
                </Link>
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-ink-tertiary">
              <Clock className="h-3.5 w-3.5" />
              Diagnóstico gratuito de 30 minutos, sem compromisso.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Global host: mount once (App) to enable `openLeadMagnet(id)` from
 * anywhere without prop drilling. Renders nothing until opened.
 */
export const LeadMagnetHost = () => {
  const [open, setOpen] = useState(false);
  const [initialAssessment, setInitialAssessment] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { assessmentId?: string } | undefined;
      setInitialAssessment(detail?.assessmentId);
      setOpen(true);
    };
    window.addEventListener(LEAD_MAGNET_EVENT, handler);
    return () => window.removeEventListener(LEAD_MAGNET_EVENT, handler);
  }, []);

  if (!open) return null;
  return (
    <LeadMagnetModal
      open={open}
      onClose={() => setOpen(false)}
      initialAssessment={initialAssessment}
    />
  );
};
