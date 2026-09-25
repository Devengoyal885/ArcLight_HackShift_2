/**
 * emailNotificationService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Queues email notifications via Firestore.
 * A Cloud Function (or Firebase Extension "Trigger Email") picks up
 * documents from `mail/` and sends them.
 *
 * Compatible with the official Firebase "Trigger Email" extension:
 * https://extensions.dev/extensions/firebase/firestore-send-email
 *
 * Schema:  mail/{docId}  →  { to, message: { subject, html } }
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;      // plain-text fallback
}

// ── Core queue helper ─────────────────────────────────────────────────────────

export async function queueEmail(payload: EmailPayload): Promise<void> {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    try {
        const res = await fetch(`${serverUrl}/api/mail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text || payload.html.replace(/<[^>]+>/g, ''),
            }),
        });
        
        if (!res.ok) {
            console.error('[EmailService] Failed to send email via backend:', await res.text());
        }
    } catch (e) {
        console.error('[EmailService] Network error sending email:', e);
    }
}

// ── Branded email wrapper ─────────────────────────────────────────────────────

function brandedHtml(title: string, body: string, cta?: { label: string; url: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:28px 36px;">
              <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.5px;">CapAble</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">Bridging Capability. Enabling Careers.</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 16px;">${title}</h2>
              ${body}
              ${cta ? `
              <div style="text-align:center;margin:28px 0 8px;">
                <a href="${cta.url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:14px;font-weight:700;">${cta.label}</a>
              </div>` : ''}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:18px 36px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
                © 2025 CapAble Platform · You are receiving this because you're a registered user.
                <br />Questions? <a href="mailto:support@capable.app" style="color:#2563eb;text-decoration:none;">support@capable.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Specific notification emails ──────────────────────────────────────────────

/** Notify candidate that an interview has been scheduled */
export async function sendInterviewScheduledEmail(opts: {
    to: string;
    candidateName: string;
    roleTitle: string;
    company: string;
    date: string;
    time: string;
    mode: string;
    meetLink?: string;
    venue?: string;
}): Promise<void> {
    const locationText = opts.mode === 'video'
        ? `<p style="color:#334155;font-size:14px;">📹 <strong>Video Call:</strong> ${opts.meetLink || 'Meeting link will be shared separately'}</p>`
        : `<p style="color:#334155;font-size:14px;">🏢 <strong>Venue:</strong> ${opts.venue || 'To be confirmed'}</p>`;

    const body = `
    <p style="color:#334155;font-size:14px;line-height:1.7;">Hi <strong>${opts.candidateName}</strong>,</p>
    <p style="color:#334155;font-size:14px;line-height:1.7;">Great news! Your interview for <strong>${opts.roleTitle}</strong> at <strong>${opts.company}</strong> has been scheduled.</p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <p style="color:#1e40af;font-size:13px;font-weight:700;margin:0 0 10px;">Interview Details</p>
      <p style="color:#334155;font-size:14px;margin:0 0 6px;">📅 <strong>Date:</strong> ${opts.date}</p>
      <p style="color:#334155;font-size:14px;margin:0 0 6px;">⏰ <strong>Time:</strong> ${opts.time}</p>
      ${locationText}
    </div>
    <p style="color:#64748b;font-size:13px;">Please be on time and review the job description beforehand. All the best! 🎯</p>`;

    await queueEmail({
        to: opts.to,
        subject: `🗓️ Interview Scheduled — ${opts.roleTitle} at ${opts.company}`,
        html: brandedHtml('Interview Scheduled!', body, {
            label: 'View Application Details',
            url: `${window.location.origin}/candidate/applications`,
        }),
    });
}

/** Notify candidate of a new placement opportunity */
export async function sendOpportunityAlertEmail(opts: {
    to: string;
    candidateName: string;
    roleTitle: string;
    company: string;
    deadline?: string;
    roleId: string;
}): Promise<void> {
    const body = `
    <p style="color:#334155;font-size:14px;line-height:1.7;">Hi <strong>${opts.candidateName}</strong>,</p>
    <p style="color:#334155;font-size:14px;line-height:1.7;">A new placement opportunity matching your profile has been posted.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <p style="color:#065f46;font-size:13px;font-weight:700;margin:0 0 8px;">🚀 New Opportunity</p>
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 4px;">${opts.roleTitle}</p>
      <p style="color:#334155;font-size:13px;margin:0;">${opts.company}</p>
      ${opts.deadline ? `<p style="color:#dc2626;font-size:12px;margin:8px 0 0;">⏳ Deadline: ${opts.deadline}</p>` : ''}
    </div>`;

    await queueEmail({
        to: opts.to,
        subject: `🚀 New Opportunity: ${opts.roleTitle} at ${opts.company}`,
        html: brandedHtml('New Opportunity Alert', body, {
            label: 'Apply Now',
            url: `${window.location.origin}/candidate/opportunities`,
        }),
    });
}

/** Notify institution admin that a student was placed */
export async function sendPlacementConfirmedEmail(opts: {
    to: string;
    adminName: string;
    studentName: string;
    roleTitle: string;
    company: string;
    ctc?: string;
}): Promise<void> {
    const body = `
    <p style="color:#334155;font-size:14px;line-height:1.7;">Hi <strong>${opts.adminName}</strong>,</p>
    <p style="color:#334155;font-size:14px;line-height:1.7;">🎉 A student from your institution has been successfully placed!</p>
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 8px;">Placement Details</p>
      <p style="color:#0f172a;font-size:14px;margin:0 0 4px;"><strong>Student:</strong> ${opts.studentName}</p>
      <p style="color:#0f172a;font-size:14px;margin:0 0 4px;"><strong>Role:</strong> ${opts.roleTitle}</p>
      <p style="color:#0f172a;font-size:14px;margin:0 0 4px;"><strong>Company:</strong> ${opts.company}</p>
      ${opts.ctc ? `<p style="color:#0f172a;font-size:14px;margin:0;"><strong>CTC:</strong> ${opts.ctc}</p>` : ''}
    </div>
    <p style="color:#64748b;font-size:13px;">This placement will be automatically reflected in your NAAC reports and placement statistics.</p>`;

    await queueEmail({
        to: opts.to,
        subject: `🏆 Placement Confirmed — ${opts.studentName} at ${opts.company}`,
        html: brandedHtml('Placement Confirmed!', body),
    });
}

/** Notify candidate of OA/Assessment invite */
export async function sendAssessmentInviteEmail(opts: {
    to: string;
    candidateName: string;
    assessmentTitle: string;
    dueDate?: string;
    link: string;
}): Promise<void> {
    const body = `
    <p style="color:#334155;font-size:14px;line-height:1.7;">Hi <strong>${opts.candidateName}</strong>,</p>
    <p style="color:#334155;font-size:14px;line-height:1.7;">You have been invited to complete an online assessment.</p>
    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <p style="color:#6d28d9;font-size:13px;font-weight:700;margin:0 0 6px;">🎯 Assessment Details</p>
      <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0;">${opts.assessmentTitle}</p>
      ${opts.dueDate ? `<p style="color:#dc2626;font-size:12px;margin:8px 0 0;">⏳ Due: ${opts.dueDate}</p>` : ''}
    </div>`;

    await queueEmail({
        to: opts.to,
        subject: `🎯 Assessment Invite — ${opts.assessmentTitle}`,
        html: brandedHtml('You have been invited to an assessment', body, {
            label: 'Start Assessment',
            url: opts.link,
        }),
    });
}
