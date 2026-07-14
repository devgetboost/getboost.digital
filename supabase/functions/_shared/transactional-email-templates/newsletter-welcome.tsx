import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Getboost"
const LOGO_URL = "https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png"
const SITE_URL = "https://getboost.digital"

interface Props {
  name?: string
}

const Email = ({ name }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Bem-vindo à comunidade VIP Getboost</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
        </Section>
        <Heading style={h1}>{name ? `Bem-vindo, ${name}!` : 'Bem-vindo!'}</Heading>
        <Text style={text}>
          Acabaste de te juntar à comunidade VIP da {SITE_NAME}. A partir de agora vais receber
          conteúdos exclusivos sobre marketing digital, casos de sucesso, ferramentas e insights
          que não partilhamos em mais lado nenhum.
        </Text>
        <Text style={text}>O que esperar:</Text>
        <Section style={box}>
          <Text style={li}>• Artigos e guias práticos sobre crescimento digital</Text>
          <Text style={li}>• Convites antecipados para webinars e workshops</Text>
          <Text style={li}>• Descontos exclusivos em serviços e formação</Text>
          <Text style={li}>• Análises de tendências e novas tecnologias</Text>
        </Section>
        <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
          <Button href={`${SITE_URL}/recursos`} style={button}>Explorar recursos</Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Equipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Bem-vindo à comunidade VIP Getboost',
  displayName: 'Boas-vindas Newsletter/VIP',
  previewData: { name: 'João' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const box = { backgroundColor: '#faf8f5', borderRadius: '12px', padding: '20px 24px', margin: '0 0 8px', border: '1px solid #e8e4de' }
const li = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.6' }
const button = { backgroundColor: '#ff4000', color: '#ffffff', padding: '12px 28px', borderRadius: '999px', textDecoration: 'none', fontWeight: 'bold' as const, fontSize: '14px', display: 'inline-block' }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0', lineHeight: '1.5' }
