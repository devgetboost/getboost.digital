import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Getboost"
const LOGO_URL = "https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png"

interface Props {
  name?: string
  webinarTitle?: string
  webinarDate?: string
  webinarTime?: string
  joinUrl?: string
}

const Email = ({ name, webinarTitle, webinarDate, webinarTime, joinUrl }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Inscrição confirmada — {webinarTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
        </Section>
        <Heading style={h1}>{name ? `Olá ${name},` : 'Olá,'}</Heading>
        <Text style={text}>A tua inscrição no webinar está confirmada. Aqui estão os detalhes:</Text>
        <Section style={box}>
          {webinarTitle && (<Text style={row}><span style={label}>Webinar:</span> {webinarTitle}</Text>)}
          {webinarDate && (<Text style={row}><span style={label}>Data:</span> {webinarDate}</Text>)}
          {webinarTime && (<Text style={row}><span style={label}>Hora:</span> {webinarTime} (Lisboa)</Text>)}
        </Section>
        {joinUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
            <Button href={joinUrl} style={button}>Entrar no webinar</Button>
          </Section>
        )}
        <Text style={text}>
          Vais receber um lembrete 24 horas e 1 hora antes do início. Se não puderes assistir,
          responde a este email — enviamos-te a gravação depois.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Equipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: any) => `Inscrição confirmada: ${d?.webinarTitle || 'Webinar Getboost'}`,
  displayName: 'Confirmação de inscrição em webinar',
  previewData: {
    name: 'Rita',
    webinarTitle: 'IA aplicada ao marketing local',
    webinarDate: '20 de Fevereiro, 2026',
    webinarTime: '18:00',
    joinUrl: 'https://getboost.digital/webinars/live',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const box = { backgroundColor: '#faf8f5', borderRadius: '12px', padding: '20px 24px', margin: '0 0 24px', border: '1px solid #e8e4de' }
const row = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const label = { color: '#888', fontWeight: '500' as const }
const button = { backgroundColor: '#ff4000', color: '#ffffff', padding: '12px 28px', borderRadius: '999px', textDecoration: 'none', fontWeight: 'bold' as const, fontSize: '14px', display: 'inline-block' }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0', lineHeight: '1.5' }
