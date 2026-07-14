/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as bookingConfirmation } from './booking-confirmation.tsx'
import { template as newCommentNotification } from './new-comment-notification.tsx'
import { template as leadNotification } from './lead-notification.tsx'
import { template as auditReport } from './audit-report.tsx'
import { template as auditAccessLink } from './audit-access-link.tsx'
import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as newsletterWelcome } from './newsletter-welcome.tsx'
import { template as resourceDownload } from './resource-download.tsx'
import { template as webinarRegistration } from './webinar-registration.tsx'
import { template as demoRequestConfirmation } from './demo-request-confirmation.tsx'
import { template as agenticAlert } from './agentic-alert.tsx'
import { template as socialMediaDraftStatus } from './social-media-draft-status.tsx'
import { template as meetingFollowup } from './meeting-followup.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation': bookingConfirmation,
  'new-comment-notification': newCommentNotification,
  'lead-notification': leadNotification,
  'audit-report': auditReport,
  'audit-access-link': auditAccessLink,
  'contact-confirmation': contactConfirmation,
  'newsletter-welcome': newsletterWelcome,
  'resource-download': resourceDownload,
  'webinar-registration': webinarRegistration,
  'demo-request-confirmation': demoRequestConfirmation,
  'agentic-alert': agenticAlert,
  'social-media-draft-status': socialMediaDraftStatus,
  'meeting-followup': meetingFollowup,
}
