import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Getboost'
const LOGO_URL = 'https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png'
const SUPABASE_FN_BASE = 'https://asqdfrzhakgnlfhnzfyu.supabase.co/functions/v1'

interface MeetingFollowupProps {
  name?: string
  meetingType?: string
  meetingDate?: string
  meetingTime?: string
  timezoneLabel?: string
  meetingLink?: string
  bookingId?: string
  proposalSummary?: string
  serviceType?: string
  budgetRange?: string
  timeline?: string
}

const MeetingFollowupEmail = ({
  name,
  meetingType,
  meetingDate,
  meetingTime,
  timezoneLabel,
  meetingLink,
  bookingId,
  proposalSummary,
  serviceType,
  budgetRange,
  timeline,
}: MeetingFollowupProps) => {
  const icsUrl = bookingId ? `${SUPABASE_FN_BASE}/booking-ics?id=${encodeURIComponent(bookingId)}` : null
  return (
    <Html lang="pt" dir="ltr">
      <Head />
      <Preview>Resumo da proposta e detalhes da reunião confirmada</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
          </Section>

          <Heading style={h1}>
            {name ? `Olá ${name}, está tudo tratado!` : 'Está tudo tratado!'}
          </Heading>
          <Text style={text}>
            Confirmámos o horário da tua reunião com o nosso Director Comercial. Segue abaixo o resumo da proposta que discutimos e os detalhes de acesso.
          </Text>

          {proposalSummary && (
            <Section style={detailsBox}>
              <Text style={{ ...detailRow, fontWeight: '600' as const, marginBottom: '10px' }}>Resumo da proposta</Text>
              {(serviceType || budgetRange || timeline) && (
                <>
                  {serviceType && <Text style={detailRow}><span style={detailLabel}>Serviço:</span> {serviceType}</Text>}
                  {budgetRange && <Text style={detailRow}><span style={detailLabel}>Orçamento:</span> {budgetRange}</Text>}
                  {timeline && <Text style={detailRow}><span style={detailLabel}>Prazo:</span> {timeline}</Text>}
                </>
              )}
              <Text style={{ ...detailRow, whiteSpace: 'pre-wrap' as const, marginTop: '8px' }}>{proposalSummary}</Text>
            </Section>
          )}

          <Section style={detailsBox}>
            <Text style={{ ...detailRow, fontWeight: '600' as const, marginBottom: '10px' }}>Detalhes da reunião</Text>
            {meetingType && <Text style={detailRow}><span style={detailLabel}>Tipo:</span> {meetingType}</Text>}
            {meetingDate && <Text style={detailRow}><span style={detailLabel}>Data:</span> {meetingDate}</Text>}
            {meetingTime && (
              <Text style={detailRow}>
                <span style={detailLabel}>Hora:</span> {meetingTime}{timezoneLabel ? ` · ${timezoneLabel}` : ''}
              </Text>
            )}
            {meetingLink && (
              <Text style={detailRow}>
                <span style={detailLabel}>Link:</span>{' '}
                <a href={meetingLink} style={{ color: '#ff4000', textDecoration: 'underline' }}>{meetingLink}</a>
              </Text>
            )}
            {icsUrl && (
              <Text style={detailRow}>
                <a href={icsUrl} style={{ color: '#ff4000', textDecoration: 'underline' }}>Adicionar ao calendário (.ics)</a>
              </Text>
            )}
          </Section>

          <Text style={text}>
            Se precisares de reagendar ou tiveres alguma pergunta antes da reunião, responde a este email que voltamos rapidamente.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Com os melhores cumprimentos,<br />
            {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MeetingFollowupEmail,
  subject: 'Resumo da proposta e detalhes da reunião confirmada',
  displayName: 'Follow-up pós confirmação de reunião',
  previewData: {
    name: 'Maria Silva',
    meetingType: 'Consulta de Descoberta (30 min)',
    meetingDate: '15/01/2026',
    meetingTime: '10:00',
    timezoneLabel: 'Lisboa',
    meetingLink: 'https://meet.jit.si/nuno-cruz-abc12345',
    proposalSummary: 'Website institucional em Next.js com CMS headless, integração com CRM e SEO técnico. Entrega em 3 fases.',
    serviceType: 'Website + SEO',
    budgetRange: '5.000€ - 8.000€',
    timeline: '6 semanas',
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
  margin: '0 0 20px',
  border: '1px solid #e8e4de',
}
const detailRow = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const detailLabel = { color: '#888888', fontWeight: '500' as const }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5' }
