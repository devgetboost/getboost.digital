import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Getboost"
const LOGO_URL = "https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png"

interface Props {
  name?: string
  product?: string
}

const Email = ({ name, product }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Pedido de demonstração recebido</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
        </Section>
        <Heading style={h1}>{name ? `Olá ${name},` : 'Olá,'}</Heading>
        <Text style={text}>
          Recebemos o teu pedido de demonstração{product ? ` de ${product}` : ''}. Um membro
          da nossa equipa vai contactar-te em menos de 24 horas úteis para agendar a sessão
          num horário que te seja conveniente.
        </Text>
        <Text style={text}>
          Enquanto esperas, se quiseres partilhar mais contexto sobre o teu projecto,
          basta responder a este email.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Adoraria conhecer o teu projecto e trabalhar contigo.<br />Equipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Pedido de demonstração recebido — Getboost',
  displayName: 'Confirmação de pedido de demo',
  previewData: { name: 'Pedro', product: 'Qook' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0', lineHeight: '1.5' }
