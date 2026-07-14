import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Getboost'
const LOGO_URL = 'https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png'
const ACCENT = '#ff4000'

interface Props {
  name?: string
  websiteUrl?: string
  auditLink?: string
}

const AuditAccessLinkEmail = ({ name, websiteUrl, auditLink }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Confirma o teu email e abre a Auditoria Digital 360º</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
          <Text style={brandText}>Auditoria Digital 360º</Text>
        </Section>

        <Heading style={h1}>Olá {name || 'aí'}, o teu diagnóstico está pronto a correr.</Heading>

        <Text style={text}>
          Clica no botão abaixo para confirmar o teu email e abrir a auditoria completa
          {websiteUrl ? <> de <strong>{websiteUrl}</strong></> : null}. O relatório é gerado
          em segundos com Website, SEO, Tracking, Conversão e Visibilidade em IA.
        </Text>

        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={auditLink} style={button}>
            Abrir a minha auditoria →
          </Button>
        </Section>

        <Text style={small}>
          Ou copia este link no browser:<br />
          <a href={auditLink} style={linkStyle}>{auditLink}</a>
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Este link é válido durante 72 horas. Se não pediste esta auditoria, ignora este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AuditAccessLinkEmail,
  subject: () => 'Confirma o teu email — Auditoria Digital 360º',
  displayName: 'Auditoria Digital · Link de Acesso',
  previewData: {
    name: 'João',
    websiteUrl: 'exemplo.pt',
    auditLink: 'https://getboost.digital/tools/digital-audit?token=demo',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: `2px solid ${ACCENT}`, marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px', marginBottom: '8px' }
const brandText = { fontSize: '13px', fontWeight: '600' as const, color: '#888', margin: '0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const small = { fontSize: '12px', color: '#888', lineHeight: '1.5', margin: '16px 0', wordBreak: 'break-all' as const }
const linkStyle = { color: ACCENT, textDecoration: 'underline' }
const button = {
  backgroundColor: ACCENT,
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  display: 'inline-block',
}
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0', lineHeight: '1.5' }
