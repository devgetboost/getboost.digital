import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, Calendar, ArrowRight, User, Phone, Building2, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';

type SubmissionState = {
  name?: string;
  email?: string;
  phone?: string | null;
  companySize?: string | null;
  productName?: string;
  productSlug?: string;
  submittedAt?: string;
  emailDelivered?: boolean;
};

const PRODUCT_NAMES: Record<string, { name: string; backHref: string }> = {
  pikto: { name: 'Pikto', backHref: '/pikto' },
  prosafe360: { name: 'ProSafe360', backHref: '/prosafe360' },
  motivae: { name: 'Motivae', backHref: '/motivae' },
  qook: { name: 'Qook', backHref: '/qook' },
  hostify: { name: 'Hostify PMS', backHref: '/solucoes/hostify' },
  trackfy: { name: 'Trackfy', backHref: '/trackfy' },
};

export default function DemoThankYou() {
  const [params] = useSearchParams();
  const location = useLocation();
  const submission = (location.state ?? {}) as SubmissionState;
  const slug = (submission.productSlug || params.get('produto') || '').toLowerCase();
  const product = useMemo(
    () => PRODUCT_NAMES[slug] ?? { name: submission.productName || 'Getboost', backHref: '/' },
    [slug, submission.productName],
  );

  const submittedAt = submission.submittedAt ? new Date(submission.submittedAt) : null;
  const submittedLabel = submittedAt
    ? submittedAt.toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' })
    : null;

  const hasSummary = Boolean(submission.name || submission.email);

  const steps = [
    {
      icon: Mail,
      title: submission.emailDelivered === false ? 'Confirmação por e-mail (pendente)' : 'Confirmação por e-mail',
      desc:
        submission.emailDelivered === false
          ? 'Registámos o teu pedido, mas o e-mail de confirmação automático falhou. Não te preocupes — a equipa foi notificada e vai responder-te manualmente.'
          : 'Recebes já um e-mail com o resumo do teu pedido e os próximos passos.',
    },
    {
      icon: Calendar,
      title: 'Agendamento (até 1 dia útil)',
      desc: `Um especialista de ${product.name} entra em contacto para marcar a demonstração num horário que te dê jeito.`,
    },
    {
      icon: CheckCircle2,
      title: 'Demonstração personalizada',
      desc: 'Uma sessão à medida das tuas necessidades, com plano concreto de adoção no final.',
    },
  ];

  return (
    <Layout>
      <SEO
        title={`Pedido recebido — ${product.name}`}
        description={`Recebemos o teu pedido de demonstração de ${product.name}. Entramos em contacto em breve.`}
        canonical={`/demo/obrigado?produto=${slug || 'geral'}`}
        noIndex
      />

      <section className="relative overflow-hidden bg-background py-20 md:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[620px] h-[620px] rounded-full bg-primary/15 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15"
          >
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </motion.div>

          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-[0.14em] uppercase text-primary">
            Referência: {product.name}
          </span>

          <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Pedido recebido com sucesso
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {submission.name ? (
              <>
                Obrigado, <span className="font-semibold text-foreground">{submission.name.split(' ')[0]}</span>! O teu pedido de demonstração de{' '}
                <span className="font-semibold text-foreground">{product.name}</span> foi registado.
              </>
            ) : (
              <>
                Obrigado! O teu pedido de demonstração de{' '}
                <span className="font-semibold text-foreground">{product.name}</span> foi registado. A nossa equipa entra em contacto muito em breve.
              </>
            )}
          </p>

          {/* Summary card */}
          {hasSummary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-10 text-left rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Resumo do pedido</h2>
                {submittedLabel && <span className="text-xs text-muted-foreground">{submittedLabel}</span>}
              </div>
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {submission.name && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <dt className="text-xs text-muted-foreground">Nome</dt>
                      <dd className="font-medium text-foreground break-words">{submission.name}</dd>
                    </div>
                  </div>
                )}
                {submission.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">E-mail</dt>
                      <dd className="font-medium text-foreground truncate">{submission.email}</dd>
                    </div>
                  </div>
                )}
                {submission.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <dt className="text-xs text-muted-foreground">Telefone</dt>
                      <dd className="font-medium text-foreground">{submission.phone}</dd>
                    </div>
                  </div>
                )}
                {submission.companySize && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <dt className="text-xs text-muted-foreground">Tamanho da empresa</dt>
                      <dd className="font-medium text-foreground">{submission.companySize}</dd>
                    </div>
                  </div>
                )}
              </dl>

              {submission.emailDelivered === false && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>O e-mail automático de confirmação não foi entregue, mas o teu pedido está guardado. A equipa vai responder-te manualmente.</span>
                </div>
              )}
            </motion.div>
          )}

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Link to={product.backHref}>
                Voltar para {product.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/">Ir para a página inicial</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
