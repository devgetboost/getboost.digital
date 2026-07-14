import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface AlertItem { agent: string; kind: 'error_rate' | 'latency'; value: string; threshold: string; runs: number }
interface Props { windowHours?: number; items?: AlertItem[]; dashboardUrl?: string }

const AgenticAlertEmail = ({ windowHours = 24, items = [], dashboardUrl = 'https://getboost.digital/admin/agentic-ai/monitoring' }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>{items.length} alerta(s) nos agentes IA nas últimas {windowHours}h</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandText}>Agentic AI — Alertas</Text>
        <Heading style={h1}>
          {items.length} alerta{items.length === 1 ? '' : 's'} nas últimas {windowHours}h
        </Heading>
        <Text style={text}>Foram detetadas execuções acima dos limiares definidos:</Text>
        <Section style={box}>
          {items.map((it, i) => (
            <Text key={i} style={row}>
              <strong>{it.agent}</strong> — {it.kind === 'error_rate' ? 'taxa de erro' : 'latência média'}:{' '}
              <strong>{it.value}</strong> (limiar {it.threshold}, {it.runs} execuções)
            </Text>
          ))}
        </Section>
        <Text style={text}>
          Abrir o painel: <a href={dashboardUrl} style={link}>{dashboardUrl}</a>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Notificação automática do sistema de monitorização de agentes Getboost.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AgenticAlertEmail,
  subject: (data: any) => `⚠️ ${data.items?.length ?? 0} alerta(s) nos agentes IA (${data.windowHours ?? 24}h)`,
  displayName: 'Alerta de Agentes IA',
  previewData: {
    windowHours: 24,
    items: [
      { agent: 'Lead Qualifier', kind: 'error_rate', value: '12.5%', threshold: '5%', runs: 40 },
      { agent: 'WhatsApp Concierge', kind: 'latency', value: '5200 ms', threshold: '4000 ms', runs: 120 },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandText = { fontSize: '13px', fontWeight: '600' as const, color: '#ff4000', margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const box = { backgroundColor: '#faf8f5', borderRadius: '12px', padding: '16px 20px', margin: '0 0 20px', border: '1px solid #e8e4de' }
const row = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const link = { color: '#ff4000', textDecoration: 'underline' }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
