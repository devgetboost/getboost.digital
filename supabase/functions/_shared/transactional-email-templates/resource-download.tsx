import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Getboost"
const LOGO_URL = "https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png"

interface Props {
  name?: string
  resourceTitle?: string
  downloadUrl?: string
}

const Email = ({ name, resourceTitle, downloadUrl }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>O teu recurso está pronto para download</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
        </Section>
        <Heading style={h1}>{name ? `Olá ${name},` : 'Olá,'}</Heading>
        <Text style={text}>
          Aqui está o teu acesso ao recurso <strong>{resourceTitle || 'solicitado'}</strong>.
          Clica no botão abaixo para fazer o download.
        </Text>
        {downloadUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
            <Button href={downloadUrl} style={button}>Descarregar recurso</Button>
          </Section>
        )}
        <Text style={text}>
          Se tiveres dúvidas ou quiseres discutir como aplicar estas ideias no teu negócio,
          responde a este email — estamos aqui para ajudar.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Equipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: any) => `O teu recurso: ${d?.resourceTitle || 'download disponível'}`,
  displayName: 'Recurso — Link de download',
  previewData: { name: 'Ana', resourceTitle: 'Guia SEO Local 2026', downloadUrl: 'https://getboost.digital/recursos/exemplo.pdf' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#ff4000', color: '#ffffff', padding: '12px 28px', borderRadius: '999px', textDecoration: 'none', fontWeight: 'bold' as const, fontSize: '14px', display: 'inline-block' }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0', lineHeight: '1.5' }
