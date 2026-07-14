import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

type Status = 'approved' | 'rejected' | 'scheduled' | 'published' | 'pending'

interface Props {
  status: Status
  rede?: string
  action?: string
  scheduledAt?: string | null
  timezone?: string
  notes?: string | null
  preview?: string
  title?: string
  hashtags?: string
  videoUrl?: string
  mediaUrl?: string
  dashboardUrl?: string
  _tracking?: { base: string; messageId: string } | null
}

const LABEL: Record<Status, string> = {
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  scheduled: 'Agendado',
  published: 'Publicado',
  pending: 'Pendente',
}
const COLOR: Record<Status, string> = {
  approved: '#16a34a',
  rejected: '#dc2626',
  scheduled: '#2563eb',
  published: '#475569',
  pending: '#ca8a04',
}

const isSafeUrl = (u?: string) => !!u && /^https?:\/\//i.test(u)

export function formatScheduledFor(scheduledAt?: string | null, timezone?: string): string | null {
  if (!scheduledAt) return null
  const d = new Date(scheduledAt)
  if (isNaN(d.getTime())) return null
  const tz = timezone || 'Europe/Lisbon'
  try {
    const dt = new Intl.DateTimeFormat('pt-PT', {
      timeZone: tz, dateStyle: 'short', timeStyle: 'short',
    }).format(d)
    const tzShort = new Intl.DateTimeFormat('pt-PT', {
      timeZone: tz, timeZoneName: 'short',
    }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value ?? tz
    return `${dt} (${tzShort})`
  } catch {
    return d.toLocaleString('pt-PT')
  }
}

function b64urlEncode(s: string): string {
  try {
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch { return '' }
}

function trackUrl(target: string | undefined, kind: string, tracking?: { base: string; messageId: string } | null): string {
  if (!target) return ''
  if (!tracking?.base || !tracking?.messageId) return target
  const enc = b64urlEncode(target)
  if (!enc) return target
  return `${tracking.base}?m=${encodeURIComponent(tracking.messageId)}&k=${encodeURIComponent(kind)}&u=${enc}`
}

const Email = ({
  status, rede, action, scheduledAt, timezone, notes, preview, title, hashtags, videoUrl, mediaUrl,
  dashboardUrl = 'https://getboost.digital/admin/agentic-ai/social-media-drafts',
  _tracking,
}: Props) => {
  const scheduledLabel = formatScheduledFor(scheduledAt, timezone)
  const videoHref = trackUrl(videoUrl, 'video', _tracking)
  const mediaHref = trackUrl(mediaUrl, 'media', _tracking)
  const dashHref = trackUrl(dashboardUrl, 'dashboard', _tracking)
  return (
    <Html lang="pt" dir="ltr">
      <Head />
      <Preview>{`Rascunho ${rede ?? ''} — ${LABEL[status]}${scheduledLabel ? ` · ${scheduledLabel}` : ''}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brandText}>Social Media — Fluxo de aprovação</Text>
          <Heading style={h1}>
            Rascunho <span style={{ color: COLOR[status] }}>{LABEL[status].toLowerCase()}</span>
          </Heading>

          <Section style={box}>
            <Text style={row}><strong>Rede:</strong> {rede ?? '—'}</Text>
            {action && <Text style={row}><strong>Ação:</strong> {action}</Text>}
            {scheduledLabel && <Text style={row}><strong>Agendado para:</strong> {scheduledLabel}</Text>}
            {notes && <Text style={row}><strong>Notas:</strong> {notes}</Text>}
          </Section>

          {(title || preview || hashtags) && (
            <Section style={box}>
              <Text style={rowMuted}>Conteúdo do draft</Text>
              {title && <Text style={rowTitle}>{title}</Text>}
              {preview && <Text style={rowBody}>{preview}</Text>}
              {hashtags && <Text style={rowTags}>{hashtags}</Text>}
            </Section>
          )}

          {(isSafeUrl(videoUrl) || isSafeUrl(mediaUrl)) && (
            <Section style={box}>
              <Text style={rowMuted}>Média</Text>
              {isSafeUrl(videoUrl) && (
                <Text style={row}><strong>Vídeo:</strong> <a href={videoHref} style={link}>{videoUrl}</a></Text>
              )}
              {isSafeUrl(mediaUrl) && (
                <Text style={row}><strong>Ficheiro:</strong> <a href={mediaHref} style={link}>{mediaUrl}</a></Text>
              )}
            </Section>
          )}

          <Text style={text}>Abrir o painel: <a href={dashHref} style={link}>{dashboardUrl}</a></Text>
          <Hr style={hr} />
          <Text style={footer}>Notificação automática — Getboost Social Media.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: any) => `[Social Media] Rascunho ${LABEL[(d.status as Status) ?? 'pending']}${d.rede ? ` · ${d.rede}` : ''}${d.scheduledAt ? ` · ${formatScheduledFor(d.scheduledAt, d.timezone)}` : ''}`,
  displayName: 'Social Media — Estado de rascunho',
  previewData: {
    status: 'scheduled',
    rede: 'instagram',
    action: 'gerar_post',
    scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
    title: 'Como automatizar a tua operação sem perder o toque humano',
    preview: 'Neste post partilhamos três passos concretos para começar a automatizar tarefas repetitivas hoje.',
    hashtags: '#automação #pmes #getboost',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brandText = { fontSize: '13px', fontWeight: '600' as const, color: '#ff4000', margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const box = { backgroundColor: '#faf8f5', borderRadius: '12px', padding: '16px 20px', margin: '0 0 20px', border: '1px solid #e8e4de' }
const row = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const rowMuted = { fontSize: '12px', color: '#999999', margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const link = { color: '#ff4000', textDecoration: 'underline' }
const hr = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
const rowTitle = { fontSize: '15px', fontWeight: '600' as const, color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.4' }
const rowBody = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const rowTags = { fontSize: '13px', color: '#ff4000', margin: '0', lineHeight: '1.5' }
