import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Getboost'
const LOGO_URL = 'https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png'

interface Gap { title: string; detail: string }
interface Rec { title: string; impact: string; effort: string; detail: string }
interface Projection { revenueUplift?: string; timeSaved?: string; paybackMonths?: string }

interface Props {
  name?: string
  company?: string
  industry?: string
  score?: number
  verdict?: string
  strengths?: string[]
  gaps?: Gap[]
  recommendations?: Rec[]
  projection?: Projection
  nextStep?: string
}

const AuditReportEmail = ({
  name, company, industry, score, verdict, strengths = [], gaps = [], recommendations = [], projection, nextStep,
}: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>O teu relatório de Auditoria Comercial (score {score ?? '—'}/100)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
          <Text style={brandText}>Auditoria Comercial · CRM & Sales Intelligence</Text>
        </Section>

        <Heading style={h1}>Olá {name || 'aí'}, aqui está o teu relatório</Heading>
        {(company || industry) && (
          <Text style={subtle}>{[company, industry].filter(Boolean).join(' · ')}</Text>
        )}

        <Section style={scoreBox}>
          <Text style={scoreNum}>{score ?? '—'}<span style={scoreSuffix}>/100</span></Text>
          <Text style={scoreLabel}>Maturidade comercial estimada</Text>
        </Section>

        {verdict && (
          <Section style={verdictBox}>
            <Text style={verdictText}>{verdict}</Text>
          </Section>
        )}

        {strengths.length > 0 && (
          <>
            <Heading style={h2}>Pontos fortes</Heading>
            {strengths.map((s, i) => (
              <Text key={i} style={bullet}>✓ {s}</Text>
            ))}
          </>
        )}

        {gaps.length > 0 && (
          <>
            <Heading style={h2}>Gaps identificados</Heading>
            {gaps.map((g, i) => (
              <Section key={i} style={itemBox}>
                <Text style={itemTitle}>{g.title}</Text>
                <Text style={itemDetail}>{g.detail}</Text>
              </Section>
            ))}
          </>
        )}

        {recommendations.length > 0 && (
          <>
            <Heading style={h2}>Recomendações prioritárias</Heading>
            {recommendations.map((r, i) => (
              <Section key={i} style={itemBox}>
                <Text style={itemTitle}>{i + 1}. {r.title}</Text>
                <Text style={metaLine}>Impacto: {r.impact} · Esforço: {r.effort}</Text>
                <Text style={itemDetail}>{r.detail}</Text>
              </Section>
            ))}
          </>
        )}

        {projection && (projection.revenueUplift || projection.timeSaved || projection.paybackMonths) && (
          <>
            <Heading style={h2}>Projeção a 6 meses</Heading>
            <Section style={projBox}>
              {projection.revenueUplift && <Text style={projRow}><span style={projLabel}>Aumento de receita:</span> {projection.revenueUplift}</Text>}
              {projection.timeSaved && <Text style={projRow}><span style={projLabel}>Tempo poupado:</span> {projection.timeSaved}</Text>}
              {projection.paybackMonths && <Text style={projRow}><span style={projLabel}>Payback:</span> {projection.paybackMonths}</Text>}
            </Section>
          </>
        )}

        {nextStep && (
          <Section style={nextBox}>
            <Text style={nextLabel}>Próximo passo sugerido</Text>
            <Text style={nextText}>{nextStep}</Text>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Relatório gerado pela Getboost com base nas tuas respostas. Se quiseres discutir os próximos passos,
          responde a este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AuditReportEmail,
  subject: (data: any) => `Relatório da tua Auditoria Comercial (${data.score ?? '—'}/100)`,
  displayName: 'Relatório de Auditoria Comercial',
  previewData: {
    name: 'João Silva',
    company: 'Exemplo Lda',
    industry: 'SaaS B2B',
    score: 62,
    verdict: 'Boa base comercial, mas com fugas claras no follow-up e na qualificação de leads.',
    strengths: ['Equipa motivada', 'CRM implementado'],
    gaps: [
      { title: 'Sem cadência de follow-up', detail: 'Leads mornas ficam sem toque após 48h.' },
    ],
    recommendations: [
      { title: 'Cadência automática 5 toques', impact: '+18% conversão', effort: 'Baixo', detail: 'Email + WhatsApp em 14 dias.' },
    ],
    projection: { revenueUplift: '+22%', timeSaved: '8h/semana', paybackMonths: '3' },
    nextStep: 'Agenda 30min com a Getboost para desenhar o plano de implementação.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '24px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px', marginBottom: '8px' }
const brandText = { fontSize: '13px', fontWeight: '600' as const, color: '#888', margin: '0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 6px' }
const h2 = { fontSize: '16px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '24px 0 10px' }
const subtle = { fontSize: '14px', color: '#888', margin: '0 0 20px' }
const scoreBox = { backgroundColor: '#fff5f0', border: '2px solid #ff4000', borderRadius: '12px', padding: '20px', textAlign: 'center' as const, margin: '0 0 20px' }
const scoreNum = { fontSize: '44px', fontWeight: 'bold' as const, color: '#ff4000', margin: '0', lineHeight: '1' }
const scoreSuffix = { fontSize: '18px', color: '#ff4000', opacity: 0.7 }
const scoreLabel = { fontSize: '12px', color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '8px 0 0' }
const verdictBox = { backgroundColor: '#faf8f5', borderRadius: '10px', padding: '16px 20px', margin: '0 0 24px', border: '1px solid #e8e4de' }
const verdictText = { fontSize: '15px', color: '#1a1a1a', fontWeight: '500' as const, margin: '0', lineHeight: '1.5', fontStyle: 'italic' as const }
const bullet = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 6px', lineHeight: '1.5' }
const itemBox = { backgroundColor: '#fafafa', borderRadius: '8px', padding: '14px 16px', margin: '0 0 10px', border: '1px solid #eeeeee' }
const itemTitle = { fontSize: '14px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 4px' }
const metaLine = { fontSize: '12px', color: '#ff4000', fontWeight: '600' as const, margin: '0 0 6px' }
const itemDetail = { fontSize: '13px', color: '#55575d', margin: '0', lineHeight: '1.5' }
const projBox = { backgroundColor: '#faf8f5', borderRadius: '10px', padding: '16px 20px', margin: '0 0 20px', border: '1px solid #e8e4de' }
const projRow = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 6px' }
const projLabel = { color: '#888', fontWeight: '500' as const }
const nextBox = { backgroundColor: '#ff4000', borderRadius: '10px', padding: '18px 20px', margin: '20px 0 0' }
const nextLabel = { fontSize: '11px', color: '#ffffff', opacity: 0.85, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: '600' as const }
const nextText = { fontSize: '15px', color: '#ffffff', fontWeight: '600' as const, margin: '0', lineHeight: '1.5' }
const hr = { borderColor: '#e8e4de', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '0', lineHeight: '1.6' }
