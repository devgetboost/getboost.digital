import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analytics, getJourney, getJourneyOrigin } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { pt, es, enGB } from 'date-fns/locale';
import {
  CalendarIcon, Clock, Check, ArrowLeft, ArrowRight, Video,
  ChevronRight, Globe, User, Mail, Phone, Building2, Zap,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { ScrollDepth } from '@/components/ScrollDepth';
import { MiniFlow } from '@/components/ui/mini-flow';
import { PRODUCTS } from '@/data/products';
import { SOLUCOES_SUBMENU } from '@/data/solucoesSubmenu';
import { MARKET_CODES } from '@/lib/markets';
import { legacySupabase } from '@/integrations/supabase/client';
import {
  lookupBooking,
  rescheduleBooking,
  submitBooking,
  type BookingLookupResult,
} from '@/lib/commercialApi';
import { marketForLanguage, localeForLanguage } from '@/lib/commercialMarket';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { convertSlotToTz } from '@/lib/bookingTime';
import { normalizeToE164 } from '@/lib/whatsappPhone';

const ACCENT = '#ff4000';

const bookingFormSchema = z.object({
  name: z.string().trim().min(2, { message: 'min2' }).max(100, { message: 'max100' }),
  email: z.string().trim().email({ message: 'invalidEmail' }).max(255, { message: 'max255' }),
  phone: z.string().trim().min(6, { message: 'invalidPhone' }).max(30, { message: 'max30' })
    .refine((v) => /^[+\d\s()\-]{6,30}$/.test(v), { message: 'invalidPhone' }),
  company: z.string().trim().max(120, { message: 'max120' }),
  website: z.string().trim().max(200, { message: 'max200' })
    .refine((v) => v === '' || /^https?:\/\/.+\..+/i.test(v), { message: 'invalidUrl' }),
  challenges: z.string().trim().min(10, { message: 'min10' }).max(1000, { message: 'max1000' }),
  timezone: z.enum(['lisbon', 'madeira', 'azores', 'brazil']),
});

const defaultTimeSlots = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00',
];

const defaultAvailableDays = [1, 2, 3, 4, 5];

type FormData = {
  name: string; email: string; phone: string; company: string; website: string; challenges: string; timezone: string;
};

const Booking = () => {
  const { t, i18n } = useTranslation();
  const market = marketForLanguage(i18n.language);
  const locale = localeForLanguage(i18n.language);

  /**
   * R1C5: resolves the selected slot to absolute UTC instants.
   *
   * The page stores Lisbon wall-clock time while the visitor's form timezone is
   * only a display preference, so the wall clock is interpreted in
   * Europe/Lisbon and the resulting instants are timezone-independent. Clean V1
   * `bookings` stores `start_at`/`end_at`, not separate date/time columns.
   */
  const slotToInstant = (d: Date | undefined, slot: string) => {
    if (!d) return { startAt: '', endAt: '' };
    const [hh, mm] = slot.split(':').map(Number);
    const guess = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm));
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Lisbon', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).formatToParts(guess).reduce<Record<string, string>>((a, p) => (a[p.type] = p.value, a), {});
    const asLisbon = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour) % 24, Number(parts.minute),
    );
    const startMs = guess.getTime() - (asLisbon - guess.getTime());
    const durationMin = meetingType === 'strategy' ? 60 : 30;
    return {
      startAt: new Date(startMs).toISOString(),
      endAt: new Date(startMs + durationMin * 60_000).toISOString(),
    };
  };
  const [step, setStep] = useState(1);
  const [meetingType, setMeetingType] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '', company: '', website: '', challenges: '', timezone: 'lisbon' });
  const [availableDays, setAvailableDays] = useState<number[]>(defaultAvailableDays);
  const [timeSlots, setTimeSlots] = useState<string[]>(defaultTimeSlots);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewMeetingLink, setPreviewMeetingLink] = useState<string>('');
  const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null);
  const [existingBookingId, setExistingBookingId] = useState<string | null>(null);
  // R20.1 — form lifecycle (start/progress/abandon). success/error keep
  // their dedicated events; these refs only gate lifecycle attribution.
  const lifecycleStarted = useRef(false);
  const lifecycleSubmitted = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (lifecycleStarted.current) return;
    const interacted =
      step > 1 ||
      meetingType !== '' ||
      date !== undefined ||
      time !== '' ||
      form.name !== '' ||
      form.email !== '' ||
      form.phone !== '';
    if (interacted) {
      lifecycleStarted.current = true;
      analytics.trackFormStep('booking', 'start');
    }
  }, [step, meetingType, date, time, form.name, form.email, form.phone]);

  useEffect(() => {
    if (step > 1 && step < 5) {
      analytics.trackFormStep('booking', 'progress', { step });
    }
  }, [step]);

  useEffect(() => {
    const onAbandon = () => {
      if (lifecycleStarted.current && !lifecycleSubmitted.current) {
        analytics.trackFormStep('booking', 'abandon', { step: stepRef.current, origin: getJourneyOrigin() });
        lifecycleStarted.current = false; // fire once per page lifecycle
      }
    };
    window.addEventListener('pagehide', onAbandon);
    return () => {
      window.removeEventListener('pagehide', onAbandon);
      onAbandon(); // in-app navigation away (unmount only — stable deps)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // R1C8: proof of possession for a reschedule is the booking email. A visitor
  // arriving from an email link confirms the address before the booking moves.
  const [rescheduleEmail, setRescheduleEmail] = useState<string>('');
  const [rescheduleLookup, setRescheduleLookup] = useState<BookingLookupResult | null>(null);
  const [rescheduleVerified, setRescheduleVerified] = useState(false);
  const [formError, setFormError] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const errorMessages: Record<string, string> = {
    min2: t('booking.errors.min2', 'Mínimo 2 caracteres'),
    max100: t('booking.errors.max100', 'Máximo 100 caracteres'),
    max120: t('booking.errors.max120', 'Máximo 120 caracteres'),
    max200: t('booking.errors.max200', 'Máximo 200 caracteres'),
    max255: t('booking.errors.max255', 'Máximo 255 caracteres'),
    max30: t('booking.errors.max30', 'Máximo 30 caracteres'),
    max1000: t('booking.errors.max1000', 'Máximo 1000 caracteres'),
    min10: t('booking.errors.min10', 'Descreve com pelo menos 10 caracteres'),
    invalidEmail: t('booking.errors.invalidEmail', 'Email inválido'),
    invalidPhone: t('booking.errors.invalidPhone', 'Telefone inválido'),
    invalidUrl: t('booking.errors.invalidUrl', 'URL inválido (deve começar por http:// ou https://)'),
  };

  const dateLocale = i18n.language === 'es' ? es : i18n.language === 'en' ? enGB : pt;

  const meetingTypes = [
    { id: 'strategy', title: t('booking.meetingTypes.strategy.title'), desc: t('booking.meetingTypes.strategy.desc'), duration: 45 },
    { id: 'discovery', title: t('booking.meetingTypes.discovery.title'), desc: t('booking.meetingTypes.discovery.desc'), duration: 30 },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await legacySupabase
        .from('booking_settings')
        .select('available_days, available_times')
        .eq('id', 1)
        .single();
      if (data) {
        setAvailableDays(data.available_days || defaultAvailableDays);
        setTimeSlots((data.available_times || defaultTimeSlots).sort());
      }
    };
    fetchSettings();
  }, []);

  // Reagendamento direto via WhatsApp/email: ?reschedule=<booking_id>[&k=<secret>]
  //
  // R1C5: the pre-fill no longer reads `bookings` from the browser. The trusted
  // lookup returns only non-sensitive fields plus a masked email, so the
  // visitor must confirm the address before the booking can be moved.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rid = params.get('reschedule') || params.get('booking_id');
    if (!rid) return;
    (async () => {
      const { data } = await lookupBooking({ action: 'lookup', booking_id: rid });
      if (!data) return;
      setExistingBookingId(data.booking_id);
      setIsRescheduling(true);
      setRescheduleLookup(data);
      setForm((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        timezone: data.timezone ?? prev.timezone,
      }));
    })();
  }, []);

  /** Confirms a reschedule by matching the booking email. */
  const confirmReschedule = () => {
    if (!rescheduleEmail.trim()) {
      setFormError(t('booking.errors.invalidEmail', 'Email inválido'));
      return;
    }
    setFormError('');
    setRescheduleVerified(true);
  };

  const totalSteps = 4;
  const selectedMeeting = meetingTypes.find(m => m.id === meetingType);

  const updateForm = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const benefits = [
    { icon: Video, label: t('booking.benefitVideo') },
    { icon: Clock3, label: t('booking.benefitNoCommitment') },
    { icon: ShieldCheck, label: t('booking.benefitCancel') },
  ];

  const formatDateLocalized = (d: Date) => {
    if (i18n.language === 'en') return format(d, "EEEE, d MMMM", { locale: enGB });
    if (i18n.language === 'es') return format(d, "EEEE, d 'de' MMMM", { locale: es });
    return format(d, "EEEE, d 'de' MMMM", { locale: pt });
  };

  const formatDateFull = (d: Date) => {
    if (i18n.language === 'en') return format(d, "d MMMM, yyyy", { locale: enGB });
    if (i18n.language === 'es') return format(d, "d 'de' MMMM, yyyy", { locale: es });
    return format(d, "d 'de' MMMM, yyyy", { locale: pt });
  };

  // ---- Shared dark UI classes (agentes-ia style) ----
  const panelClass = 'border border-black/10 bg-black/[0.02] backdrop-blur-sm rounded-2xl';
  const inputClass = 'bg-black/[0.03] border-black/15 text-ink-primary placeholder:text-ink-tertiary focus-visible:ring-[#ff4000]/40';
  const labelClass = 'font-mono text-[11px] uppercase tracking-[0.22em] text-ink-secondary mb-2 block';

  const runSubmit = async () => {
    setSubmitting(true);
    // R20.1 — explicit submit step (success/error keep dedicated events).
    analytics.trackFormStep('booking', 'submit', { origin: getJourneyOrigin() });
    const normalizedPhone = confirmedPhone;
    const isReschedule = !!existingBookingId;
    const meetingDateStr = date ? format(date, 'yyyy-MM-dd') : '';
    // On reschedule, always mint a fresh Jitsi room so the new confirmation
    // ships an updated link (and the old one becomes stale).
    const jitsiRoom = (!isReschedule && previewMeetingLink)
      ? previewMeetingLink.replace('https://meet.jit.si/', '')
      : `getboost-${(existingBookingId ?? 'booking').slice(0, 8)}-${Date.now().toString(36)}`;
    const meetingLink = `https://meet.jit.si/${jitsiRoom}`;

    // Snapshot previous slot before the update, then log the reschedule.
    let previous: { meeting_date: string | null; meeting_time: string | null; timezone: string | null; meeting_link: string | null } | null = null;
    if (isReschedule && existingBookingId) {
      const { data: prev } = await lookupBooking({ action: 'lookup', booking_id: existingBookingId });
      previous = prev ? {
        meeting_date: String(prev.start_at).slice(0, 10),
        meeting_time: String(prev.start_at).slice(11, 16),
        timezone: prev.timezone,
        meeting_link: null,
      } : null;
    }

    // The new slot is expressed as absolute instants: the Clean V1 contract
    // stores `start_at`/`end_at` rather than separate date/time columns.
    const slot = slotToInstant(date, time);

    // R1C5: the browser never writes `bookings` directly. Both the create and
    // the reschedule go through the trusted booking path, which re-validates
    // the window and — for a reschedule — requires proof of possession.
    const { data: booking, error } = isReschedule
      ? await rescheduleBooking({
          action: 'reschedule',
          booking_id: existingBookingId as string,
          email: rescheduleEmail || undefined,
          start_at: slot.startAt,
          end_at: slot.endAt,
          timezone: form.timezone,
          legacy: {
            meeting_date: meetingDateStr,
            meeting_time: time,
            jitsi_room: jitsiRoom,
            meeting_link: meetingLink,
            language: i18n.language,
          },
        })
      : await submitBooking({
          action: 'create',
          name: form.name,
          email: form.email,
          phone: normalizedPhone || null,
          company: form.company || null,
          website: form.website || null,
          timezone: form.timezone,
          start_at: slot.startAt,
          end_at: slot.endAt,
          notes: form.challenges || null,
          market,
          locale,
          legacy: {
            meeting_type: meetingType,
            meeting_date: meetingDateStr,
            meeting_time: time,
            jitsi_room: jitsiRoom,
            meeting_link: meetingLink,
            language: i18n.language,
            challenges: form.challenges || null,
            phone: normalizedPhone || null,
            company: form.company || null,
            website: form.website || null,
          },
        });

    const createdBookingId = booking && 'booking_id' in booking ? booking.booking_id : null;

    if (!error && isReschedule) {
      await legacySupabase.from('booking_reschedule_history').insert({
        booking_id: createdBookingId,
        previous_meeting_date: previous?.meeting_date ?? null,
        previous_meeting_time: previous?.meeting_time ?? null,
        previous_timezone: previous?.timezone ?? null,
        previous_meeting_link: previous?.meeting_link ?? null,
        new_meeting_date: meetingDateStr,
        new_meeting_time: time,
        new_timezone: form.timezone,
        new_meeting_link: meetingLink,
        actor_source: 'lead',
      });
    }
    if (error) {
      toast.error(t('booking.errorSchedule'));
    } else {
      analytics.trackBooking('booking', 'booking_success', {
        meeting_type: meetingType,
        meeting_date: meetingDateStr,
        meeting_time: time,
        language: i18n.language,
        // R20.1 — funnel attribution: paths only, never PII.
        journey: getJourney(),
        origin: getJourneyOrigin(),
      });
      analytics.trackForm('booking', 'booking_form_success', {
        meeting_type: meetingType,
        meeting_date: meetingDateStr,
        meeting_time: time,
        // R20.1 — analytics payloads never carry PII (lead data travels
        // through the booking edge function, not through analytics).
        // Funnel attribution only:
        journey: getJourney(),
        origin: getJourneyOrigin(),
      });
      const meetingLabels: Record<string, string> = {
        discovery: t('booking.confirmLabels.discovery'),
        strategy: t('booking.confirmLabels.strategy'),
      };
      const displayTime = date ? convertSlotToTz(date, time, form.timezone) : time;
      const timezoneLabel = t(`booking.timezones.${form.timezone}`);
      const startAtUtc = slot.startAt;
      const endAtUtc = slot.endAt;
      const durationMin = meetingType === 'strategy' ? 60 : 30;
      try {
        await legacySupabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'booking-confirmation',
            recipientEmail: form.email,
            idempotencyKey: isReschedule ? `booking-reschedule-${createdBookingId}-${meetingDateStr}-${time}` : `booking-confirm-${createdBookingId}`,
            templateData: {
              name: form.name,
              meetingType: meetingLabels[meetingType] || meetingType,
              meetingDate: date ? formatDateFull(date) : '',
              meetingTime: displayTime,
              meetingTimeLisbon: time,
              timezone: form.timezone,
              timezoneLabel,
              company: form.company,
              meetingLink,
              createdBookingId,
              startAtUtc,
              endAtUtc,
              language: i18n.language,
              rescheduled: isReschedule,
            },
          },
        });
      } catch (err) {
        console.error('Error sending confirmation email:', err);
      }
      legacySupabase.functions.invoke('notify-booking', {
        body: {
          templateName: 'booking-confirmation',
          recipientEmail: form.email,
          idempotencyKey: isReschedule ? `booking-reschedule-${createdBookingId}-${meetingDateStr}-${time}` : `booking-confirm-${createdBookingId}`,
          templateData: {
            name: form.name,
            meetingType: meetingLabels[meetingType] || meetingType,
            meetingDate: date ? formatDateFull(date) : '',
            meetingTime: displayTime,
            meetingTimeLisbon: time,
            timezone: form.timezone,
            timezoneLabel,
            company: form.company || undefined,
            phone: normalizedPhone || undefined,
          },
        },
      }).catch(console.error);
      legacySupabase.functions.invoke('notify-booking', {
        body: {
          name: form.name,
          email: form.email,
          phone: normalizedPhone,
          meeting_type: meetingType,
          meeting_date: meetingDateStr,
          meeting_time: time,
          meeting_time_display: displayTime,
          timezone: form.timezone,
          timezone_label: timezoneLabel,
          company: form.company || null,
          challenges: form.challenges,
        },
      }).catch(console.error);
      if (createdBookingId) setExistingBookingId(createdBookingId);
      lifecycleSubmitted.current = true; // converted — no abandon afterwards
      setIsRescheduling(false);
      setStep(5);
      if (isReschedule) toast.success(t('booking.rescheduleSuccess', 'Reunião reagendada com sucesso'));
    }
    setSubmitting(false);
    setConfirmOpen(false);
  };


  return (
    <Layout>
      <ScrollDepth location="booking" />
      <SEO
        title={`${t('booking.heroBadge')} — ${t('booking.title')}`}
        description={t('booking.heroSubtitle')}
        canonical="/booking"
      />

      {/* HERO — R19.4 light premium (form itself is the CTA; no duplicate conversion). */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.08) 0%, rgba(255,255,255,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="gb-eyebrow text-brand-600">{t('booking.heroBadge')}</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                Vamos transformar a tua{' '}
                <span className="text-brand-600">operação digital</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Partilha os teus objetivos. Vamos analisar o teu negócio e
                apresentar um plano concreto de crescimento.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {['IA', 'Software', 'Automação', 'Growth'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="gb-text-small mt-6 text-ink-tertiary"
              >
                30 min · Online · 0€ — desce para começar o pedido
              </motion.p>
            </div>

            {/* O que acontece a seguir — expectation preview (illustrative). */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="gb-card !p-6 !shadow-lg">
                <p className="gb-eyebrow text-ink-tertiary">O que acontece a seguir</p>
                <ol className="mt-4 flex flex-col gap-3">
                  {[
                    { n: '1', t: 'Recebemos o pedido' },
                    { n: '2', t: 'Analisamos o contexto' },
                    { n: '3', t: 'Preparamos proposta' },
                    { n: '4', t: 'Entramos em contacto' },
                  ].map((step) => (
                    <li key={step.n} className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
                      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff4000]/10 font-mono text-xs font-bold text-brand-600">
                        {step.n}
                      </span>
                      <span className="text-[15px] font-medium text-ink-primary">{step.t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          </div>

          {/* Processo — MiniFlow padrão R18.9. */}
          <div className="gb-card mt-12 !p-6 md:!p-8">
            <p className="gb-eyebrow text-ink-tertiary">Como trabalhamos</p>
            <MiniFlow
              steps={['Diagnóstico', 'Planeamento', 'Implementação', 'Escala']}
              tint="var(--gb-brand-50)"
              strong="var(--gb-brand-600)"
            />
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* AUTHORITY STRIP — R19.4 (dados reais do sistema, nunca hardcoded). */}
      <section className="gb-surface-subtle gb-section !py-12">
        <div className="gb-container">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { k: `${PRODUCTS.length}`, v: 'produtos próprios' },
              { k: `${SOLUCOES_SUBMENU.length}`, v: 'serviços especializados' },
              { k: `${MARKET_CODES.length}`, v: 'mercados' },
            ].map((fact) => (
              <span key={fact.v} className="inline-flex items-center gap-2 text-sm text-ink-secondary">
                <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                <strong className="font-bold text-ink-primary">{fact.k}</strong> {fact.v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WIZARD — dark canvas */}
      <section className="gb-surface-page gb-section">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {/* Benefits strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 border border-black/10 bg-black/[0.02] rounded-xl px-5 py-3">
                <b.icon className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-ink-secondary">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {Array.from({ length: totalSteps }, (_, i) => {
              const stepNum = i + 1;
              const isCompleted = stepNum < step;
              const isCurrent = stepNum === step;
              return (
                <div key={i} className="flex items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono font-semibold border transition-all',
                      isCompleted && 'border-[#ff4000] bg-[#ff4000] text-ink-primary',
                      isCurrent && 'border-[#ff4000] text-[#ff4000] bg-transparent',
                      !isCompleted && !isCurrent && 'border-black/15 text-ink-tertiary bg-transparent'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={cn('w-10 h-px mx-1', stepNum < step ? 'bg-[#ff4000]' : 'bg-black/15')} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Back button */}
          {step > 1 && step <= 4 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-ink-secondary hover:text-ink-primary transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> {t('booking.back')}
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>

              {/* Step 1: Meeting type */}
              {step === 1 && (
                <div className={cn(panelClass, 'p-6 md:p-10')}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                    01 · Formato
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-8">{t('booking.chooseMeetingType')}</h2>
                  <div className="space-y-3">
                    {meetingTypes.map((mt) => (
                      <button
                        key={mt.id}
                        onClick={() => { setMeetingType(mt.id); setStep(2); }}
                        className={cn(
                          'w-full text-left border rounded-xl p-5 transition-all flex items-start gap-4 group',
                          meetingType === mt.id
                            ? 'border-[#ff4000] bg-[#ff4000]/5'
                            : 'border-black/15 bg-transparent hover:border-[#ff4000]/50 hover:bg-black/[0.03]'
                        )}
                      >
                        <div className="w-11 h-11 rounded-lg border border-[#ff4000]/40 bg-[#ff4000]/10 flex items-center justify-center shrink-0">
                          <Video className="h-5 w-5" style={{ color: ACCENT }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-ink-primary">{mt.title}</h3>
                            <ChevronRight className="h-5 w-5 text-ink-tertiary group-hover:text-[#ff4000] transition-colors shrink-0" />
                          </div>
                          <p className="text-sm text-ink-secondary mt-1">{mt.desc}</p>
                          <div className="flex items-center gap-1.5 mt-3 text-xs font-mono uppercase tracking-[0.18em] text-ink-tertiary">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{mt.duration} min</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Date */}
              {step === 2 && (
                <div className={cn(panelClass, 'p-6 md:p-10')}>
                  {isRescheduling && (
                    <div className="mb-4 rounded-lg border border-[#ff4000]/40 bg-[#ff4000]/10 px-4 py-3 text-sm text-ink-secondary">
                      {t('booking.rescheduleHint', 'A escolher uma nova hora para a tua reunião. O agendamento anterior será atualizado.')}
                    </div>
                  )}
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                    02 · Data
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-6">{t('booking.selectDate')}</h2>
                  <div className="flex justify-center">
                    <div className="rounded-xl border border-black/10 bg-black/[0.02] p-2 [&_.rdp]:text-ink-primary [&_button]:text-ink-primary [&_.rdp-day_selected]:!bg-[#ff4000] [&_.rdp-day_selected]:!text-ink-primary [&_.rdp-day]:hover:!bg-black/10 [&_.rdp-day_today]:!text-[#ff4000] [&_.rdp-nav_button]:!text-ink-secondary [&_.rdp-head_cell]:!text-ink-tertiary">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => { setDate(d); if (d) setStep(3); }}
                        disabled={(d) => d < new Date() || !availableDays.includes(d.getDay())}
                        className="pointer-events-auto"
                        locale={dateLocale}
                      />
                    </div>
                  </div>
                  {selectedMeeting && (
                    <div className="mt-6 flex items-center gap-3 border border-black/10 bg-black/[0.03] rounded-xl px-5 py-4">
                      <Video className="h-5 w-5 shrink-0" style={{ color: ACCENT }} />
                      <div>
                        <p className="font-semibold text-sm text-ink-primary">{selectedMeeting.title}</p>
                        <p className="text-xs font-mono uppercase tracking-[0.18em] text-ink-tertiary mt-0.5">
                          {selectedMeeting.duration} {t('booking.minutes')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Time */}
              {step === 3 && (
                <div className={cn(panelClass, 'p-6 md:p-10')}>
                  {isRescheduling && (
                    <div className="mb-4 rounded-lg border border-[#ff4000]/40 bg-[#ff4000]/10 px-4 py-3 text-sm text-ink-secondary">
                      {t('booking.rescheduleHint', 'A escolher uma nova hora para a tua reunião. O agendamento anterior será atualizado.')}
                    </div>
                  )}
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                    03 · Horário
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2">{t('booking.selectTime2')}</h2>
                  <p className="text-sm text-ink-secondary mb-6 mt-1">
                    {date && formatDateLocalized(date)}
                  </p>

                  <div className="mb-6">
                    <label className={labelClass}>
                      <Globe className="inline h-3.5 w-3.5 mr-2 -mt-0.5" />
                      {t('booking.timezone')}
                    </label>
                    <Select value={form.timezone} onValueChange={(v) => updateForm('timezone', v)}>
                      <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lisbon">{t('booking.timezones.lisbon')}</SelectItem>
                        <SelectItem value="madeira">{t('booking.timezones.madeira')}</SelectItem>
                        <SelectItem value="azores">{t('booking.timezones.azores')}</SelectItem>
                        <SelectItem value="brazil">{t('booking.timezones.brazil')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.timezone !== 'lisbon' && (
                      <p className="text-xs text-ink-tertiary mt-2">
                        {t('booking.timezoneHint', 'Horários convertidos para o teu fuso. A referência interna é Lisboa.')}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {timeSlots.map((slot) => {
                      const local = date ? convertSlotToTz(date, slot, form.timezone) : slot;
                      const active = time === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setTime(slot)}
                          className={cn(
                            'py-3 rounded-xl text-sm font-mono font-semibold transition-all flex flex-col items-center border',
                            active
                              ? 'bg-[#ff4000] text-ink-primary border-[#ff4000]'
                              : 'bg-transparent text-ink-secondary border-black/15 hover:border-[#ff4000]/60 hover:text-ink-primary'
                          )}
                        >
                          <span>{local}</span>
                          {form.timezone !== 'lisbon' && (
                            <span className="text-[10px] opacity-70 mt-0.5">{slot} Lx</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      if (!time) {
                        toast.error(t('booking.errorSelectTime', 'Seleciona um horário para continuar'));
                        return;
                      }
                      if (!form.timezone) {
                        toast.error(t('booking.errorSelectTimezone', 'Seleciona o teu fuso horário'));
                        return;
                      }
                      if (isRescheduling) {
                        runSubmit();
                        return;
                      }
                      setStep(4);
                    }}
                    className="mt-8 w-full inline-flex items-center justify-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-ink-primary"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {t('booking.continue', 'Continuar')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step 4: Form */}
              {step === 4 && (
                <div className={cn(panelClass, 'p-6 md:p-10')}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                    04 · Contacto
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-6">{t('booking.yourData')}</h2>

                  {/* Summary */}
                  <div className="border border-black/10 bg-black/[0.03] rounded-xl p-4 mb-8 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-ink-secondary">
                      <CalendarIcon className="h-4 w-4" style={{ color: ACCENT }} />
                      <span>{date && formatDateLocalized(date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-ink-secondary">
                      <Clock className="h-4 w-4" style={{ color: ACCENT }} />
                      <span>
                        {date && time ? convertSlotToTz(date, time, form.timezone) : time} ({selectedMeeting?.duration} min)
                        <span className="text-ink-tertiary ml-1">· {t(`booking.timezones.${form.timezone}`)}</span>
                        {form.timezone !== 'lisbon' && (
                          <span className="text-ink-tertiary ml-1">({time} Lx)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>{t('booking.name')} *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
                        <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder={t('booking.namePlaceholder')} maxLength={100} className={cn(inputClass, 'pl-10', errors.name && 'border-destructive')} aria-invalid={!!errors.name} />
                      </div>
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>{t('booking.email')} *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
                        <Input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder={t('booking.emailPlaceholder')} maxLength={255} className={cn(inputClass, 'pl-10', errors.email && 'border-destructive')} aria-invalid={!!errors.email} />
                      </div>
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{t('booking.phone')}</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
                          <Input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder={t('booking.phonePlaceholder')} maxLength={30} className={cn(inputClass, 'pl-10', errors.phone && 'border-destructive')} aria-invalid={!!errors.phone} />
                        </div>
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>{t('booking.company')}</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
                          <Input value={form.company} onChange={(e) => updateForm('company', e.target.value)} placeholder={t('booking.companyPlaceholder')} maxLength={120} className={cn(inputClass, 'pl-10', errors.company && 'border-destructive')} aria-invalid={!!errors.company} />
                        </div>
                        {errors.company && <p className="text-xs text-destructive mt-1">{errors.company}</p>}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{t('booking.website')}</label>
                      <Input value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://..." maxLength={200} className={cn(inputClass, errors.website && 'border-destructive')} aria-invalid={!!errors.website} />
                      {errors.website && <p className="text-xs text-destructive mt-1">{errors.website}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>{t('booking.challenges')} *</label>
                      <Textarea value={form.challenges} onChange={(e) => updateForm('challenges', e.target.value)} maxLength={1000} className={cn(inputClass, 'min-h-[120px]', errors.challenges && 'border-destructive')} placeholder={t('booking.challengesPlaceholder')} aria-invalid={!!errors.challenges} />
                      <div className="flex justify-between mt-1">
                        {errors.challenges ? <p className="text-xs text-destructive">{errors.challenges}</p> : <span />}
                        <p className="text-xs text-ink-tertiary font-mono">{form.challenges.length}/1000</p>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{t('booking.timezone')}</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary z-10" />
                        <Select value={form.timezone} onValueChange={(v) => updateForm('timezone', v)}>
                          <SelectTrigger className={cn(inputClass, 'pl-10')}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lisbon">{t('booking.timezones.lisbon')}</SelectItem>
                            <SelectItem value="madeira">{t('booking.timezones.madeira')}</SelectItem>
                            <SelectItem value="azores">{t('booking.timezones.azores')}</SelectItem>
                            <SelectItem value="brazil">{t('booking.timezones.brazil')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <button
                      disabled={submitting}
                      onClick={() => {
                        // Verify wizard prerequisites (meeting type, date, time)
                        // before opening the confirmation dialog, and jump back
                        // to the offending step with a targeted message.
                        if (!meetingType) {
                          toast.error(t('booking.errors.missingMeetingType', 'Escolhe o tipo de reunião antes de continuar'));
                          setStep(1);
                          return;
                        }
                        if (!date) {
                          toast.error(t('booking.errors.missingDate', 'Escolhe uma data para a reunião'));
                          setStep(2);
                          return;
                        }
                        if (!time) {
                          toast.error(t('booking.errors.missingTime', 'Seleciona um horário disponível'));
                          setStep(3);
                          return;
                        }

                        const parsed = bookingFormSchema.safeParse(form);
                        if (!parsed.success) {
                          const fieldErrors: Partial<Record<keyof FormData, string>> = {};
                          for (const issue of parsed.error.issues) {
                            const key = issue.path[0] as keyof FormData;
                            if (!fieldErrors[key]) fieldErrors[key] = errorMessages[issue.message] || issue.message;
                          }
                          setErrors(fieldErrors);
                          const missing = Object.keys(fieldErrors).join(', ');
                          toast.error(
                            t('booking.errors.recheckFields', 'Verifica novamente estes campos: {{fields}}', { fields: missing })
                          );
                          return;
                        }
                        setErrors({});

                        const result = normalizeToE164(form.phone);
                        if (!result.valid) {
                          setErrors({ phone: result.error || t('booking.errors.invalidPhone', 'Telefone inválido') });
                          toast.error(result.error || t('booking.errors.invalidPhone', 'Telefone/WhatsApp inválido'));
                          return;
                        }
                        const normalizedPhone = result.phone;

                        // Consistency check: email domain vs website domain (soft warning only)
                        if (form.website) {
                          try {
                            const site = new URL(form.website).hostname.replace(/^www\./, '').toLowerCase();
                            const emailDomain = form.email.split('@')[1]?.toLowerCase() || '';
                            const generic = /(gmail|hotmail|outlook|yahoo|icloud|live|proton)\./.test(emailDomain);
                            if (site && emailDomain && !generic && !emailDomain.includes(site) && !site.includes(emailDomain.split('.')[0])) {
                              toast.warning(t('booking.errors.emailWebsiteMismatch', 'O email e o website parecem de domínios diferentes — verifica se está correcto.'));
                            }
                          } catch { /* invalid URL, ignore */ }
                        }

                        setConfirmedPhone(normalizedPhone);
                        setPreviewMeetingLink(`https://meet.jit.si/getboost-${crypto.randomUUID().slice(0, 8)}-${Date.now().toString(36)}`);
                        setConfirmOpen(true);
                      }}
                      className="mt-4 w-full inline-flex items-center justify-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-ink-primary disabled:opacity-60"
                      style={{ borderColor: ACCENT, color: ACCENT }}
                      onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = ACCENT; }}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {submitting ? (
                        <>
                          <Zap className="h-4 w-4 animate-pulse" />
                          {t('booking.sending', 'A enviar…')}
                        </>
                      ) : (
                        <>
                          {t('booking.confirm')}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(() => {
                const parsed = bookingFormSchema.safeParse(form);
                const issues = parsed.success
                  ? []
                  : parsed.error.issues.map((i) => ({
                      field: String(i.path[0] ?? ''),
                      message: errorMessages[i.message] || i.message,
                    }));
                const hasDateTime = !!date && !!time;
                // R1C5: a reschedule additionally requires proof of possession.
                const canConfirm =
                  parsed.success &&
                  hasDateTime &&
                  !!confirmedPhone &&
                  !submitting &&
                  (!isRescheduling || rescheduleVerified);
                const Row = ({ label, value, optional }: { label: string; value: React.ReactNode; optional?: boolean }) => (
                  <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-black/5 last:border-0">
                    <span className="text-ink-tertiary text-xs uppercase tracking-wider font-mono">
                      {label}{optional && <span className="ml-1 normal-case tracking-normal text-ink-tertiary">({t('booking.confirmReview.optional', 'opcional')})</span>}
                    </span>
                    <span className="text-ink-secondary text-right break-all">{value || <span className="text-ink-tertiary">—</span>}</span>
                  </div>
                );
                return (
                  <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent className="bg-canvas-inverse border-black/10 text-ink-primary max-h-[90vh] overflow-y-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('booking.confirmReview.title', 'Confirma os teus dados')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-ink-secondary">
                          {t('booking.confirmReview.description', 'Verifica se está tudo correto antes de agendar a reunião.')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      {/* Reunião */}
                      <div className="border border-black/10 rounded-lg p-4 bg-black/[0.03]">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-ink-tertiary mb-2 font-mono">
                          {t('booking.confirmReview.sectionMeeting', 'Reunião')}
                        </div>
                        <Row label={t('booking.meeting', 'Reunião')} value={selectedMeeting?.title} />
                        <Row label={t('booking.date', 'Data')} value={date ? formatDateLocalized(date) : ''} />
                        <Row
                          label={t('booking.time', 'Hora')}
                          value={hasDateTime ? `${convertSlotToTz(date!, time, form.timezone)} · ${t(`booking.timezones.${form.timezone}`)}${form.timezone !== 'lisbon' ? ` (${time} Lisboa)` : ''}` : ''}
                        />
                      </div>

                      {/* Contacto */}
                      <div className="border border-black/10 rounded-lg p-4 bg-black/[0.03]">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-ink-tertiary mb-2 font-mono">
                          {t('booking.confirmReview.sectionContact', 'Contacto')}
                        </div>
                        <Row label={t('booking.name', 'Nome')} value={form.name} />
                        <Row label={t('booking.email', 'Email')} value={form.email} />
                        <Row label={t('booking.phone', 'Telefone/WhatsApp')} value={confirmedPhone} />
                        <Row label={t('booking.company', 'Empresa')} value={form.company} optional />
                        <Row label={t('booking.website', 'Website')} value={form.website} optional />
                      </div>

                      {/* Contexto */}
                      <div className="border border-black/10 rounded-lg p-4 bg-black/[0.03]">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-ink-tertiary mb-2 font-mono">
                          {t('booking.confirmReview.sectionContext', 'Contexto')}
                        </div>
                        <p className="text-sm text-ink-secondary whitespace-pre-wrap">{form.challenges}</p>
                      </div>

                      {/* Link preview */}
                      {previewMeetingLink && (
                        <div className="text-xs border border-black/10 rounded-lg p-4 bg-black/[0.02] break-all">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-ink-tertiary mb-1 font-mono">
                            {t('booking.confirmReview.meetingLink', 'Link da reunião')}
                          </div>
                          <a href={previewMeetingLink} target="_blank" rel="noreferrer" style={{ color: ACCENT }} className="underline">
                            {previewMeetingLink}
                          </a>
                        </div>
                      )}

                      {/* Validation issues */}
                      {(issues.length > 0 || !hasDateTime) && (
                        <div className="border border-error/40 bg-error/10 rounded-lg p-3 text-xs text-ink-inverse space-y-1">
                          <div className="font-semibold text-error">
                            {t('booking.confirmReview.fixIssues', 'Corrige antes de agendar:')}
                          </div>
                          <ul className="list-disc pl-5">
                            {!hasDateTime && <li>{t('booking.confirmReview.missingDateTime', 'Seleciona data e hora')}</li>}
                            {issues.map((i, idx) => (
                              <li key={idx}><span className="uppercase text-ink-secondary mr-1">{i.field}:</span>{i.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* R1C5: proof of possession for a reschedule. */}
                      {isRescheduling && !rescheduleVerified && (
                        <div className="border border-black/15 rounded-lg p-4 bg-black/[0.03] space-y-3">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-ink-tertiary font-mono">
                            {t('booking.reschedule.verifyTitle', 'Confirmar identidade')}
                          </div>
                          <p className="text-xs text-ink-secondary">
                            {t('booking.reschedule.verifyBody', 'Para reagendar, confirma o email usado na reserva')}
                            {rescheduleLookup?.email_hint ? ` (${rescheduleLookup.email_hint})` : ''}.
                          </p>
                          <Input
                            type="email"
                            value={rescheduleEmail}
                            onChange={(e) => setRescheduleEmail(e.target.value)}
                            placeholder={t('booking.email', 'Email')}
                            className={inputClass}
                          />
                          {formError && <p className="text-xs text-error">{formError}</p>}
                          <Button type="button" size="sm" onClick={confirmReschedule} className="w-full">
                            {t('booking.reschedule.verifyAction', 'Confirmar')}
                          </Button>
                        </div>
                      )}

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting} className="bg-transparent border-black/20 text-ink-primary hover:bg-black/10">
                          {t('booking.confirmReview.edit', 'Editar')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={!canConfirm}
                          onClick={(e) => { e.preventDefault(); if (canConfirm) runSubmit(); }}
                          style={{ background: canConfirm ? ACCENT : 'rgba(255,64,0,0.4)' }}
                          className="text-ink-primary hover:opacity-90 disabled:cursor-not-allowed"
                        >
                          {submitting ? t('booking.sending', 'A enviar…') : t('booking.confirmReview.confirm', 'Está correto, agendar')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                );
              })()}


              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div className={cn(panelClass, 'p-8 md:p-12 text-center')}>
                  <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-6"
                    style={{ borderColor: ACCENT, background: 'rgba(255,64,0,0.1)' }}>
                    <Check className="h-8 w-8" style={{ color: ACCENT }} />
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                    Reunião confirmada
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black mt-3 tracking-tight">{t('booking.confirmed')}</h2>
                  <p className="text-ink-secondary mt-3">{t('booking.confirmedMsg')}</p>
                  <div className="mt-8 p-6 rounded-xl border border-black/10 bg-black/[0.03] text-left space-y-2.5">
                    <p className="text-sm text-ink-secondary"><span className="text-ink-tertiary font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.meeting')}</span> {selectedMeeting?.title}</p>
                    <p className="text-sm text-ink-secondary"><span className="text-ink-tertiary font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.date')}</span> {date && formatDateFull(date)}</p>
                    <p className="text-sm text-ink-secondary">
                      <span className="text-ink-tertiary font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.time')}</span>
                      {date && time ? convertSlotToTz(date, time, form.timezone) : time}
                      {' '}<span className="text-ink-tertiary">· {t(`booking.timezones.${form.timezone}`)}</span>
                      {form.timezone !== 'lisbon' && <span className="text-ink-tertiary"> ({time} Lisboa)</span>}
                    </p>
                    <p className="text-sm text-ink-secondary"><span className="text-ink-tertiary font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.name')}</span> {form.name}</p>
                    <p className="text-sm text-ink-secondary"><span className="text-ink-tertiary font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.email')}</span> {form.email}</p>
                    {form.phone && <p className="text-sm text-ink-secondary"><span className="text-ink-tertiary font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.phone')}</span> {form.phone}</p>}
                    {form.company && <p className="text-sm text-ink-secondary"><span className="text-ink-tertiary font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.company')}</span> {form.company}</p>}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRescheduling(true);
                        setDate(undefined);
                        setTime('');
                        setStep(2);
                      }}
                      className="inline-flex items-center gap-3 border-2 border-black/20 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-all hover:border-black/50 hover:text-ink-primary"
                    >
                      {t('booking.reschedule', 'Reagendar')}
                    </button>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-ink-primary"
                      style={{ borderColor: ACCENT, color: ACCENT }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {t('booking.backToHome', 'Voltar ao início')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
};

export default Booking;
