import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analytics } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { pt, es, enGB } from 'date-fns/locale';
import {
  CalendarIcon, Clock, Check, ArrowLeft, ArrowRight, Video, Clock3, ShieldCheck,
  ChevronRight, Globe, User, Mail, Phone, Building2, Zap,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
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
      const { data } = await supabase
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

  // Reagendamento direto via WhatsApp/email: ?reschedule=<booking_id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rid = params.get('reschedule') || params.get('booking_id');
    if (!rid) return;
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('id, name, email, phone, company, website, meeting_type, challenges, timezone')
        .eq('id', rid)
        .maybeSingle();
      if (!data) return;
      setExistingBookingId(data.id);
      setIsRescheduling(true);
      setMeetingType(data.meeting_type || '');
      setForm((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        email: data.email ?? prev.email,
        phone: data.phone ?? prev.phone,
        company: data.company ?? prev.company,
        website: data.website ?? prev.website,
        challenges: data.challenges ?? prev.challenges,
        timezone: data.timezone ?? prev.timezone,
      }));
    })();
  }, []);

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
  const panelClass = 'border border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-2xl';
  const inputClass = 'bg-white/[0.03] border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#ff4000]/40';
  const labelClass = 'font-mono text-[11px] uppercase tracking-[0.22em] text-white/60 mb-2 block';

  const runSubmit = async () => {
    setSubmitting(true);
    const normalizedPhone = confirmedPhone;
    const isReschedule = !!existingBookingId;
    const bookingId = existingBookingId ?? crypto.randomUUID();
    const meetingDateStr = date ? format(date, 'yyyy-MM-dd') : '';
    // On reschedule, always mint a fresh Jitsi room so the new confirmation
    // ships an updated link (and the old one becomes stale).
    const jitsiRoom = (!isReschedule && previewMeetingLink)
      ? previewMeetingLink.replace('https://meet.jit.si/', '')
      : `getboost-${bookingId.slice(0, 8)}-${Date.now().toString(36)}`;
    const meetingLink = `https://meet.jit.si/${jitsiRoom}`;

    // Snapshot previous slot before the update, then log the reschedule.
    let previous: { meeting_date: string | null; meeting_time: string | null; timezone: string | null; meeting_link: string | null } | null = null;
    if (isReschedule) {
      const { data: prev } = await supabase
        .from('bookings')
        .select('meeting_date, meeting_time, timezone, meeting_link')
        .eq('id', bookingId)
        .maybeSingle();
      previous = prev ?? null;
    }

    const { error } = isReschedule
      ? await supabase.from('bookings').update({
          meeting_date: meetingDateStr,
          meeting_time: time,
          timezone: form.timezone,
          jitsi_room: jitsiRoom,
          meeting_link: meetingLink,
          status: 'pending',
        }).eq('id', bookingId)
      : await supabase.from('bookings').insert({
          id: bookingId,
          meeting_type: meetingType,
          meeting_date: meetingDateStr,
          meeting_time: time,
          name: form.name,
          email: form.email,
          phone: normalizedPhone,
          company: form.company || null,
          website: form.website || null,
          challenges: form.challenges,
          timezone: form.timezone,
          jitsi_room: jitsiRoom,
          meeting_link: meetingLink,
          language: i18n.language,
          lead_status: 'new',
        });

    if (!error && isReschedule) {
      await supabase.from('booking_reschedule_history').insert({
        booking_id: bookingId,
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
      });
      analytics.trackForm('booking', 'booking_form_success', {
        meeting_type: meetingType,
        meeting_date: meetingDateStr,
        meeting_time: time,
        email: form.email,
        phone: normalizedPhone,
        company: form.company || null,
      });
      const meetingLabels: Record<string, string> = {
        discovery: t('booking.confirmLabels.discovery'),
        strategy: t('booking.confirmLabels.strategy'),
      };
      const displayTime = date ? convertSlotToTz(date, time, form.timezone) : time;
      const timezoneLabel = t(`booking.timezones.${form.timezone}`);
      let startAtUtc: string | undefined;
      let endAtUtc: string | undefined;
      if (date) {
        const [hh, mm] = time.split(':').map(Number);
        const guess = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm));
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
        startAtUtc = new Date(startMs).toISOString();
        endAtUtc = new Date(startMs + durationMin * 60_000).toISOString();
      }
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'booking-confirmation',
            recipientEmail: form.email,
            idempotencyKey: isReschedule ? `booking-reschedule-${bookingId}-${meetingDateStr}-${time}` : `booking-confirm-${bookingId}`,
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
              bookingId,
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
      supabase.functions.invoke('notify-booking', {
        body: {
          templateName: 'booking-confirmation',
          recipientEmail: form.email,
          idempotencyKey: isReschedule ? `booking-reschedule-${bookingId}-${meetingDateStr}-${time}` : `booking-confirm-${bookingId}`,
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
      supabase.functions.invoke('notify-booking', {
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
      setExistingBookingId(bookingId);
      setIsRescheduling(false);
      setStep(5);
      if (isReschedule) toast.success(t('booking.rescheduleSuccess', 'Reunião reagendada com sucesso'));
    }
    setSubmitting(false);
    setConfirmOpen(false);
  };


  return (
    <Layout>
      <SEO
        title={`${t('booking.heroBadge')} — ${t('booking.title')}`}
        description={t('booking.heroSubtitle')}
        canonical="/booking"
      />

      {/* HERO — manifesto style (agentes-ia) */}
      <section className="relative overflow-hidden bg-[#0a0603] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)',
          }}
        />
        <motion.div
          aria-hidden
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent"
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            {t('booking.heroBadge')}
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.5rem,7vw,6rem)]">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="block"
            >
              {t('booking.heroTitle')}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.27 }}
              className="block"
              style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}
            >
              {t('booking.heroHighlight')}
            </motion.span>
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 h-px w-40 origin-left"
            style={{ background: `${ACCENT}b3` }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75"
          >
            {t('booking.heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              { icon: Clock3, label: t('booking.check30min') },
              { icon: ShieldCheck, label: t('booking.checkNoCommitment') },
              { icon: Video, label: t('booking.checkVideo') },
            ].map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border border-white/10 bg-white/[0.03] rounded-xl px-5 py-4"
              >
                <c.icon className="h-5 w-5 shrink-0" style={{ color: ACCENT }} />
                <span className="text-sm text-white/80">{c.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WIZARD — dark canvas */}
      <section className="bg-[#0a0603] text-white pb-28 pt-4">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {/* Benefits strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 border border-white/10 bg-white/[0.02] rounded-xl px-5 py-3">
                <b.icon className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/70">{b.label}</span>
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
                      isCompleted && 'border-[#ff4000] bg-[#ff4000] text-white',
                      isCurrent && 'border-[#ff4000] text-[#ff4000] bg-transparent',
                      !isCompleted && !isCurrent && 'border-white/15 text-white/40 bg-transparent'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={cn('w-10 h-px mx-1', stepNum < step ? 'bg-[#ff4000]' : 'bg-white/15')} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Back button */}
          {step > 1 && step <= 4 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors mb-6"
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
                            : 'border-white/15 bg-transparent hover:border-[#ff4000]/50 hover:bg-white/[0.03]'
                        )}
                      >
                        <div className="w-11 h-11 rounded-lg border border-[#ff4000]/40 bg-[#ff4000]/10 flex items-center justify-center shrink-0">
                          <Video className="h-5 w-5" style={{ color: ACCENT }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white">{mt.title}</h3>
                            <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-[#ff4000] transition-colors shrink-0" />
                          </div>
                          <p className="text-sm text-white/60 mt-1">{mt.desc}</p>
                          <div className="flex items-center gap-1.5 mt-3 text-xs font-mono uppercase tracking-[0.18em] text-white/50">
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
                    <div className="mb-4 rounded-lg border border-[#ff4000]/40 bg-[#ff4000]/10 px-4 py-3 text-sm text-white/90">
                      {t('booking.rescheduleHint', 'A escolher uma nova hora para a tua reunião. O agendamento anterior será atualizado.')}
                    </div>
                  )}
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                    02 · Data
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-6">{t('booking.selectDate')}</h2>
                  <div className="flex justify-center">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2 [&_.rdp]:text-white [&_button]:text-white [&_.rdp-day_selected]:!bg-[#ff4000] [&_.rdp-day_selected]:!text-white [&_.rdp-day]:hover:!bg-white/10 [&_.rdp-day_today]:!text-[#ff4000] [&_.rdp-nav_button]:!text-white/70 [&_.rdp-head_cell]:!text-white/50">
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
                    <div className="mt-6 flex items-center gap-3 border border-white/10 bg-white/[0.03] rounded-xl px-5 py-4">
                      <Video className="h-5 w-5 shrink-0" style={{ color: ACCENT }} />
                      <div>
                        <p className="font-semibold text-sm text-white">{selectedMeeting.title}</p>
                        <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/50 mt-0.5">
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
                    <div className="mb-4 rounded-lg border border-[#ff4000]/40 bg-[#ff4000]/10 px-4 py-3 text-sm text-white/90">
                      {t('booking.rescheduleHint', 'A escolher uma nova hora para a tua reunião. O agendamento anterior será atualizado.')}
                    </div>
                  )}
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                    03 · Horário
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2">{t('booking.selectTime2')}</h2>
                  <p className="text-sm text-white/60 mb-6 mt-1">
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
                      <p className="text-xs text-white/50 mt-2">
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
                              ? 'bg-[#ff4000] text-white border-[#ff4000]'
                              : 'bg-transparent text-white/80 border-white/15 hover:border-[#ff4000]/60 hover:text-white'
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
                    className="mt-8 w-full inline-flex items-center justify-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
                    style={{ borderColor: ACCENT, color: '#ffb494' }}
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
                  <div className="border border-white/10 bg-white/[0.03] rounded-xl p-4 mb-8 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <CalendarIcon className="h-4 w-4" style={{ color: ACCENT }} />
                      <span>{date && formatDateLocalized(date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Clock className="h-4 w-4" style={{ color: ACCENT }} />
                      <span>
                        {date && time ? convertSlotToTz(date, time, form.timezone) : time} ({selectedMeeting?.duration} min)
                        <span className="text-white/50 ml-1">· {t(`booking.timezones.${form.timezone}`)}</span>
                        {form.timezone !== 'lisbon' && (
                          <span className="text-white/50 ml-1">({time} Lx)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>{t('booking.name')} *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder={t('booking.namePlaceholder')} maxLength={100} className={cn(inputClass, 'pl-10', errors.name && 'border-destructive')} aria-invalid={!!errors.name} />
                      </div>
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>{t('booking.email')} *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder={t('booking.emailPlaceholder')} maxLength={255} className={cn(inputClass, 'pl-10', errors.email && 'border-destructive')} aria-invalid={!!errors.email} />
                      </div>
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{t('booking.phone')}</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                          <Input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder={t('booking.phonePlaceholder')} maxLength={30} className={cn(inputClass, 'pl-10', errors.phone && 'border-destructive')} aria-invalid={!!errors.phone} />
                        </div>
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>{t('booking.company')}</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
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
                        <p className="text-xs text-white/40 font-mono">{form.challenges.length}/1000</p>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{t('booking.timezone')}</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 z-10" />
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
                      className="mt-4 w-full inline-flex items-center justify-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white disabled:opacity-60"
                      style={{ borderColor: ACCENT, color: '#ffb494' }}
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
                const canConfirm = parsed.success && hasDateTime && !!confirmedPhone && !submitting;
                const Row = ({ label, value, optional }: { label: string; value: React.ReactNode; optional?: boolean }) => (
                  <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-white/50 text-xs uppercase tracking-wider font-mono">
                      {label}{optional && <span className="ml-1 normal-case tracking-normal text-white/30">({t('booking.confirmReview.optional', 'opcional')})</span>}
                    </span>
                    <span className="text-white/90 text-right break-all">{value || <span className="text-white/30">—</span>}</span>
                  </div>
                );
                return (
                  <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent className="bg-[#0f0a08] border-white/10 text-white max-h-[90vh] overflow-y-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('booking.confirmReview.title', 'Confirma os teus dados')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          {t('booking.confirmReview.description', 'Verifica se está tudo correto antes de agendar a reunião.')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      {/* Reunião */}
                      <div className="border border-white/10 rounded-lg p-4 bg-white/[0.03]">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-white/40 mb-2 font-mono">
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
                      <div className="border border-white/10 rounded-lg p-4 bg-white/[0.03]">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-white/40 mb-2 font-mono">
                          {t('booking.confirmReview.sectionContact', 'Contacto')}
                        </div>
                        <Row label={t('booking.name', 'Nome')} value={form.name} />
                        <Row label={t('booking.email', 'Email')} value={form.email} />
                        <Row label={t('booking.phone', 'Telefone/WhatsApp')} value={confirmedPhone} />
                        <Row label={t('booking.company', 'Empresa')} value={form.company} optional />
                        <Row label={t('booking.website', 'Website')} value={form.website} optional />
                      </div>

                      {/* Contexto */}
                      <div className="border border-white/10 rounded-lg p-4 bg-white/[0.03]">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-white/40 mb-2 font-mono">
                          {t('booking.confirmReview.sectionContext', 'Contexto')}
                        </div>
                        <p className="text-sm text-white/85 whitespace-pre-wrap">{form.challenges}</p>
                      </div>

                      {/* Link preview */}
                      {previewMeetingLink && (
                        <div className="text-xs border border-white/10 rounded-lg p-4 bg-white/[0.02] break-all">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40 mb-1 font-mono">
                            {t('booking.confirmReview.meetingLink', 'Link da reunião')}
                          </div>
                          <a href={previewMeetingLink} target="_blank" rel="noreferrer" style={{ color: ACCENT }} className="underline">
                            {previewMeetingLink}
                          </a>
                        </div>
                      )}

                      {/* Validation issues */}
                      {(issues.length > 0 || !hasDateTime) && (
                        <div className="border border-red-500/40 bg-red-500/10 rounded-lg p-3 text-xs text-red-100 space-y-1">
                          <div className="font-semibold text-red-200">
                            {t('booking.confirmReview.fixIssues', 'Corrige antes de agendar:')}
                          </div>
                          <ul className="list-disc pl-5">
                            {!hasDateTime && <li>{t('booking.confirmReview.missingDateTime', 'Seleciona data e hora')}</li>}
                            {issues.map((i, idx) => (
                              <li key={idx}><span className="uppercase text-white/60 mr-1">{i.field}:</span>{i.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting} className="bg-transparent border-white/20 text-white hover:bg-white/10">
                          {t('booking.confirmReview.edit', 'Editar')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={!canConfirm}
                          onClick={(e) => { e.preventDefault(); if (canConfirm) runSubmit(); }}
                          style={{ background: canConfirm ? ACCENT : 'rgba(255,64,0,0.4)' }}
                          className="text-white hover:opacity-90 disabled:cursor-not-allowed"
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
                  <p className="text-white/60 mt-3">{t('booking.confirmedMsg')}</p>
                  <div className="mt-8 p-6 rounded-xl border border-white/10 bg-white/[0.03] text-left space-y-2.5">
                    <p className="text-sm text-white/80"><span className="text-white/40 font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.meeting')}</span> {selectedMeeting?.title}</p>
                    <p className="text-sm text-white/80"><span className="text-white/40 font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.date')}</span> {date && formatDateFull(date)}</p>
                    <p className="text-sm text-white/80">
                      <span className="text-white/40 font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.time')}</span>
                      {date && time ? convertSlotToTz(date, time, form.timezone) : time}
                      {' '}<span className="text-white/40">· {t(`booking.timezones.${form.timezone}`)}</span>
                      {form.timezone !== 'lisbon' && <span className="text-white/40"> ({time} Lisboa)</span>}
                    </p>
                    <p className="text-sm text-white/80"><span className="text-white/40 font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.name')}</span> {form.name}</p>
                    <p className="text-sm text-white/80"><span className="text-white/40 font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.email')}</span> {form.email}</p>
                    {form.phone && <p className="text-sm text-white/80"><span className="text-white/40 font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.phone')}</span> {form.phone}</p>}
                    {form.company && <p className="text-sm text-white/80"><span className="text-white/40 font-mono uppercase tracking-wider text-[10px] mr-2">{t('booking.company')}</span> {form.company}</p>}
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
                      className="inline-flex items-center gap-3 border-2 border-white/20 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/80 transition-all hover:border-white/50 hover:text-white"
                    >
                      {t('booking.reschedule', 'Reagendar')}
                    </button>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
                      style={{ borderColor: ACCENT, color: '#ffb494' }}
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
