import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { formatBookingEmailTimeLine } from '../formatBookingEmailTimeLine.ts'

const SITE_NAME = "Getboost"
const LOGO_URL = "https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png"

interface BookingConfirmationProps {
  name?: string
  meetingType?: string
  meetingDate?: string
  meetingTime?: string
  meetingTimeLisbon?: string
  timezone?: string
  timezoneLabel?: string
  company?: string
  meetingLink?: string
  bookingId?: string
  startAtUtc?: string
  endAtUtc?: string
  language?: 'pt' | 'en' | 'es'
}

const SUPABASE_FN_BASE = "https://asqdfrzhakgnlfhnzfyu.supabase.co/functions/v1"

function toGCalStamp(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

const translations = {
  pt: {
    subject: "A sua reunião está confirmada",
    preview: `A sua reunião com ${SITE_NAME} está confirmada`,
    greeting: (name?: string) => name ? `Olá ${name}, a sua reunião está confirmada!` : 'A sua reunião está confirmada!',
    intro: "Obrigado por agendar uma reunião connosco. Aqui estão os detalhes:",
    type: "Tipo",
    date: "Data",
    time: "Hora",
    company: "Empresa",
    link: "Link da reunião",
    linkNote: "Aceda à videochamada pelo link acima. Se precisar de reagendar ou cancelar, responda a este email.",
    calendar: "Adicionar ao calendário",
    calendarGoogle: "Google Calendar",
    calendarIcs: "Descarregar .ics (Apple / Outlook)",
    closing: "Com os melhores cumprimentos,",
    team: "Getboost",
  },
  en: {
    subject: "Your meeting is confirmed",
    preview: `Your meeting with ${SITE_NAME} is confirmed`,
    greeting: (name?: string) => name ? `Hello ${name}, your meeting is confirmed!` : 'Your meeting is confirmed!',
    intro: "Thank you for scheduling a meeting with us. Here are the details:",
    type: "Type",
    date: "Date",
    time: "Time",
    company: "Company",
    link: "Meeting link",
    linkNote: "Join the video call using the link above. If you need to reschedule or cancel, please reply to this email.",
    calendar: "Add to calendar",
    calendarGoogle: "Google Calendar",
    calendarIcs: "Download .ics (Apple / Outlook)",
    closing: "Best regards,",
    team: "Getboost",
  },
  es: {
    subject: "Tu reunión está confirmada",
    preview: `Tu reunión con ${SITE_NAME} está confirmada`,
    greeting: (name?: string) => name ? `¡Hola ${name}, tu reunión está confirmada!` : '¡Tu reunión está confirmada!',
    intro: "Gracias por programar una reunión con nosotros. Aquí están los detalles:",
    type: "Tipo",
    date: "Fecha",
    time: "Hora",
    company: "Empresa",
    link: "Enlace de la reunión",
    linkNote: "Únete a la videollamada mediante el enlace de arriba. Si necesitas reprogramar o cancelar, responde a este correo electrónico.",
    calendar: "Añadir al calendario",
    calendarGoogle: "Google Calendar",
    calendarIcs: "Descargar .ics (Apple / Outlook)",
    closing: "Saludos cordiales,",
    team: "Getboost",
  },
}

const BookingConfirmationEmail = ({
  name,
  meetingType,
  meetingDate,
  meetingTime,
  meetingTimeLisbon,
  timezone,
  timezoneLabel,
  company,
  meetingLink,
  bookingId,
  startAtUtc,
  endAtUtc,
  language: _ignoredLanguage = 'pt',
}: BookingConfirmationProps) => {
  const t = translations.pt
  const start = toGCalStamp(startAtUtc)
  const end = toGCalStamp(endAtUtc)
  const TZ_MAP: Record<string, string> = {
    lisbon: 'Europe/Lisbon',
    madeira: 'Atlantic/Madeira',
    azores: 'Atlantic/Azores',
    brazil: 'America/Sao_Paulo',
  }
  const ctz = TZ_MAP[(timezone ?? 'lisbon').toLowerCase()] ?? 'Europe/Lisbon'
  const gcalTitle = encodeURIComponent(`${SITE_NAME} — ${meetingType ?? 'Reunião'}`)
  const descriptionParts = [
    name ? `${t.greeting(name)}` : t.intro,
    meetingType ? `${t.type}: ${meetingType}` : null,
    company ? `${t.company}: ${company}` : null,
    meetingLink ? `${t.link}: ${meetingLink}` : null,
    timezoneLabel ? `Timezone: ${timezoneLabel} (${ctz})` : `Timezone: ${ctz}`,
  ].filter(Boolean).join('\n')
  const gcalDetails = encodeURIComponent(descriptionParts)
  const gcalLocation = encodeURIComponent(meetingLink ?? '')
  const googleUrl = start && end
    ? `https://www.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${start}/${end}&details=${gcalDetails}&location=${gcalLocation}&ctz=${encodeURIComponent(ctz)}`
    : null
  const icsUrl = bookingId ? `${SUPABASE_FN_BASE}/booking-ics?id=${encodeURIComponent(bookingId)}` : null
  return (
    <Html lang="pt" dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
          </Section>

          <Heading style={h1}>{t.greeting(name)}</Heading>
          <Text style={text}>{t.intro}</Text>

          <Section style={detailsBox}>
            {meetingType && (
              <Text style={detailRow}><span style={detailLabel}>{t.type}:</span> {meetingType}</Text>
            )}
            {meetingDate && (
              <Text style={detailRow}><span style={detailLabel}>{t.date}:</span> {meetingDate}</Text>
            )}
            {meetingTime && (
              <Text style={detailRow}>
                <span style={detailLabel}>{t.time}:</span>{' '}
                {formatBookingEmailTimeLine({ meetingTime, timezoneLabel, timezone, meetingTimeLisbon })}
              </Text>
            )}
            {company && (
              <Text style={detailRow}><span style={detailLabel}>{t.company}:</span> {company}</Text>
            )}
            {meetingLink && (
              <Text style={detailRow}>
                <span style={detailLabel}>{t.link}:</span>{' '}
                <a href={meetingLink} style={{ color: '#ff4000', textDecoration: 'underline' }}>{meetingLink}</a>
              </Text>
            )}
          </Section>

          {(googleUrl || icsUrl) && (
            <Section style={detailsBox}>
              <Text style={{ ...detailRow, fontWeight: '600' as const }}>{t.calendar}:</Text>
              {googleUrl && (
                <Text style={detailRow}>
                  <a href={googleUrl} style={{ color: '#ff4000', textDecoration: 'underline' }}>{t.calendarGoogle}</a>
                </Text>
              )}
              {icsUrl && (
                <Text style={detailRow}>
                  <a href={icsUrl} style={{ color: '#ff4000', textDecoration: 'underline' }}>{t.calendarIcs}</a>
                </Text>
              )}
            </Section>
          )}

          <Text style={text}>{t.linkNote}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            {t.closing}<br />
            {t.team}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingConfirmationEmail,
  subject: () => translations.pt.subject,
  displayName: 'Confirmação de agendamento',
  previewData: {
    name: 'Maria Silva',
    meetingType: 'Consulta de Descoberta (30 min)',
    meetingDate: '15 de Janeiro, 2026',
    meetingTime: '10:00',
    company: 'Empresa Exemplo',
    language: 'pt',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = {
  backgroundColor: '#faf8f5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
  border: '1px solid #e8e4de',
}
const detailRow = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const detailLabel = { color: '#888888', fontWeight: '500' as const }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5' }
