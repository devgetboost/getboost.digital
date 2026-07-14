import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Getboost"
const LOGO_URL = "https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png"

interface Props {
  name?: string
  message?: string
}

const Email = ({ name, message }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Recebemos a tua mensagem — obrigado pelo contacto</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
        </Section>
        <Heading style={h1}>{name ? `Olá ${name},` : 'Olá,'}</Heading>
        <Text style={text}>
          Obrigado por entrares em contacto com a {SITE_NAME}. Recebemos a tua mensagem
          e vamos responder-te em menos de 24 horas úteis.
        </Text>
        {message && (
          <Section style={box}>
            <Text style={label}>A tua mensagem:</Text>
            <Text style={quote}>{message}</Text>
          </Section>
        )}
        <Text style={text}>
          Se precisares de falar connosco de imediato, responde diretamente a este email.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Adoraria conhecer o teu projecto e trabalhar contigo.<br />Equipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Recebemos a tua mensagem — Getboost',
  displayName: 'Confirmação de contacto',
  previewData: { name: 'Maria', message: 'Gostaria de saber mais sobre marketing digital.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const box = { backgroundColor: '#faf8f5', borderRadius: '12px', padding: '20px 24px', margin: '0 0 24px', border: '1px solid #e8e4de' }
const label = { fontSize: '12px', color: '#888', margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const quote = { fontSize: '14px', color: '#1a1a1a', lineHeight: '1.6', margin: '0', fontStyle: 'italic' as const }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0', lineHeight: '1.5' }
