import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Getboost"
const LOGO_URL = "https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png"

interface LeadNotificationProps {
  name?: string
  email?: string
  phone?: string
  company?: string
  website?: string
  service?: string
  message?: string
  source?: string
  language?: 'pt' | 'en' | 'es'
}

const LeadNotificationEmail = ({
  name,
  email,
  phone,
  company,
  website,
  service,
  message,
  source,
}: LeadNotificationProps) => {
  return (
    <Html lang="pt" dir="ltr">
      <Head />
      <Preview>Nova Lead: {name} ({source})</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
            <Text style={brandText}>CRM Notification</Text>
          </Section>

          <Heading style={h1}>Nova Lead Recebida</Heading>

          <Text style={text}>
            Uma nova lead foi captada através do website. Aqui estão os detalhes:
          </Text>

          <Section style={detailsBox}>
            <Text style={detailRow}><span style={detailLabel}>Nome:</span> {name}</Text>
            <Text style={detailRow}><span style={detailLabel}>Email:</span> {email}</Text>
            {phone && (<Text style={detailRow}><span style={detailLabel}>Telefone:</span> {phone}</Text>)}
            {company && (<Text style={detailRow}><span style={detailLabel}>Empresa:</span> {company}</Text>)}
            {website && (<Text style={detailRow}><span style={detailLabel}>Website:</span> {website}</Text>)}
            {service && (<Text style={detailRow}><span style={detailLabel}>Serviço/Interesse:</span> {service}</Text>)}
            <Text style={detailRow}><span style={detailLabel}>Origem:</span> {source}</Text>
          </Section>

          {message && (
            <>
              <Heading style={h2}>Mensagem / Desafios:</Heading>
              <Section style={messageBox}>
                <Text style={text}>{message}</Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Esta é uma notificação automática do sistema CRM do website Getboost.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: LeadNotificationEmail,
  subject: (data: any) => `Nova Lead: ${data.name} (${data.source || 'Website'})`,
  displayName: 'Notificação de Nova Lead',
  previewData: {
    name: 'João Silva',
    email: 'joao@exemplo.pt',
    phone: '+351 912 345 678',
    company: 'Exemplo Lda',
    website: 'www.exemplo.pt',
    service: 'Marketing Digital',
    message: 'Gostaria de agendar uma consultoria para a minha empresa.',
    source: 'contacto',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px', marginBottom: '8px' }
const brandText = { fontSize: '13px', fontWeight: '600' as const, color: '#888', margin: '0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '20px 0 10px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = {
  backgroundColor: '#faf8f5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
  border: '1px solid #e8e4de',
}
const messageBox = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #eeeeee',
}
const detailRow = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const detailLabel = { color: '#888888', fontWeight: '500' as const }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5' }
