import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Getboost"
const LOGO_URL = "https://asqdfrzhakgnlfhnzfyu.supabase.co/storage/v1/object/public/email-assets/logo-getboost.png"


interface NewCommentNotificationProps {
  authorName?: string
  authorEmail?: string
  postTitle?: string
  commentPreview?: string
  adminUrl?: string
}

const NewCommentNotificationEmail = ({ authorName, authorEmail, postTitle, commentPreview, adminUrl }: NewCommentNotificationProps) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Novo comentário de {authorName || 'Visitante'} em "{postTitle || 'artigo'}"</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="180" height="56" style={logoStyle} />
        </Section>
        <Heading style={h1}>Novo Comentário Pendente</Heading>
        <Text style={text}>
          <strong>{authorName || 'Visitante'}</strong> ({authorEmail || 'sem email'}) deixou um comentário no artigo:
        </Text>
        <Text style={postTitleStyle}>"{postTitle || 'Artigo'}"</Text>
        <Hr style={hr} />
        <Text style={commentStyle}>
          {commentPreview || 'Sem conteúdo'}
        </Text>
        <Hr style={hr} />
        <Text style={text}>
          Este comentário está pendente de aprovação. Aceda ao painel de administração para moderar.
        </Text>
        {adminUrl && (
          <Button href={adminUrl} style={button}>
            Gerir Comentários
          </Button>
        )}
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)


export const template = {
  component: NewCommentNotificationEmail,
  subject: (data: Record<string, any>) => `Novo comentário de ${data?.authorName || 'Visitante'} — pendente de aprovação`,
  displayName: 'Notificação de novo comentário',
  previewData: {
    authorName: 'João Silva',
    authorEmail: 'joao@example.com',
    postTitle: 'Como melhorar o SEO do seu site',
    commentPreview: 'Excelente artigo! Muito útil para quem está a começar.',
    adminUrl: 'https://example.com/admin/comentarios',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '16px', borderBottom: '2px solid #ff4000', marginBottom: '20px' }
const logoStyle = { display: 'block', height: 'auto', maxWidth: '180px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px' }

const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const postTitleStyle = { fontSize: '16px', color: '#FF6A00', fontWeight: '600' as const, margin: '0 0 16px' }
const commentStyle = { fontSize: '14px', color: '#333', backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', lineHeight: '1.6', margin: '0 0 16px', borderLeft: '3px solid #FF6A00' }
const hr = { borderColor: '#eee', margin: '16px 0' }
const button = { backgroundColor: '#FF6A00', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
