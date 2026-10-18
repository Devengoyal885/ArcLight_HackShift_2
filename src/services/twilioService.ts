/**
 * twilioService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Frontend client for Twilio WhatsApp and SMS notifications.
 * All requests go through the CapAble backend (/api/notify/*) so
 * Twilio credentials are NEVER exposed in the browser.
 *
 * Setup:
 *   1. Create a Twilio account at https://twilio.com
 *   2. Get a WhatsApp sandbox number (free): https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
 *   3. Add to server .env:
 *        TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
 *        TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
 *        TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   (sandbox)
 *        TWILIO_SMS_FROM=+1xxxxxxxxxx                  (if using SMS)
 */

let SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
if (SERVER_URL && !SERVER_URL.startsWith('http')) SERVER_URL = 'https://' + SERVER_URL;
if (SERVER_URL.includes('up.railway.app')) SERVER_URL = SERVER_URL.replace('http://', 'https://');

// ── Core send helpers ─────────────────────────────────────────────────────────

export async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${SERVER_URL}/api/notify/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message }),
        });
        const data = await res.json() as { success?: boolean; error?: string };
        if (!res.ok) return { success: false, error: data.error || 'WhatsApp send failed' };
        return { success: true };
    } catch (err) {
        console.error('[Twilio WA]', err);
        return { success: false, error: 'Network error — is the server running?' };
    }
}

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${SERVER_URL}/api/notify/sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message }),
        });
        const data = await res.json() as { success?: boolean; error?: string };
        if (!res.ok) return { success: false, error: data.error || 'SMS send failed' };
        return { success: true };
    } catch (err) {
        console.error('[Twilio SMS]', err);
        return { success: false, error: 'Network error — is the server running?' };
    }
}

export interface TwilioStatusResponse {
    configured: boolean;
    accountSid?: string;
    accountType?: string;
    balance?: string;
    activeNumber?: string;
    verifiedNumbers?: string[];
    primaryVerifiedNumber?: string | null;
    isTrial?: boolean;
    trialNotice?: string;
    capabilities?: {
        voice: boolean;
        sms: boolean;
        inlineTwiml: boolean;
    };
    error?: string;
}

export async function getTwilioStatus(): Promise<TwilioStatusResponse> {
    try {
        const res = await fetch(`${SERVER_URL}/api/twilio/status`);
        return await res.json();
    } catch (err) {
        return { configured: false, error: 'Could not connect to backend server' };
    }
}

export async function triggerVoiceCall(opts: {
    to?: string;
    jobTitle?: string;
    company?: string;
    deadline?: string;
    customMessage?: string;
}): Promise<{ success: boolean; sid?: string; routedTo?: string; redirected?: boolean; trialNotice?: string; error?: string }> {
    try {
        const res = await fetch(`${SERVER_URL}/api/notify/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(opts),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error || 'Failed to trigger voice call' };
        return data;
    } catch (err) {
        return { success: false, error: 'Network error connecting to call server' };
    }
}

// ── Pre-built notification templates ─────────────────────────────────────────

/** Notify a candidate about a new placement drive they are eligible for */
export async function notifyDriveWhatsApp(opts: {
    phone: string;
    candidateName: string;
    driveName: string;
    company: string;
    deadline: string;
    link?: string;
}): Promise<{ success: boolean; error?: string }> {
    const msg = [
        `🚀 *CapAble Placement Alert*`,
        ``,
        `Hi ${opts.candidateName}! A new drive matching your profile:`,
        ``,
        `🏢 *Company:* ${opts.company}`,
        `📋 *Drive:* ${opts.driveName}`,
        `⏳ *Deadline:* ${opts.deadline}`,
        ``,
        `${opts.link ? `Apply now 👉 ${opts.link}` : 'Log in to CapAble to apply.'}`,
        ``,
        `_Reply STOP to unsubscribe_`,
    ].join('\n');

    return sendWhatsApp(opts.phone, msg);
}

/** Notify a candidate about an interview schedule */
export async function notifyInterviewWhatsApp(opts: {
    phone: string;
    candidateName: string;
    company: string;
    role: string;
    date: string;
    time: string;
    mode: string;
    meetLink?: string;
}): Promise<{ success: boolean; error?: string }> {
    const msg = [
        `🗓️ *CapAble — Interview Scheduled*`,
        ``,
        `Hi ${opts.candidateName}! Your interview details:`,
        ``,
        `🏢 *Company:* ${opts.company}`,
        `💼 *Role:* ${opts.role}`,
        `📅 *Date:* ${opts.date}`,
        `⏰ *Time:* ${opts.time}`,
        `📍 *Mode:* ${opts.mode}`,
        opts.meetLink ? `🔗 *Meet Link:* ${opts.meetLink}` : '',
        ``,
        `All the best! 🎯`,
        ``,
        `_Reply STOP to unsubscribe_`,
    ].filter(Boolean).join('\n');

    return sendWhatsApp(opts.phone, msg);
}

/** Notify a candidate about a received offer */
export async function notifyOfferWhatsApp(opts: {
    phone: string;
    candidateName: string;
    company: string;
    role: string;
    ctc?: string;
}): Promise<{ success: boolean; error?: string }> {
    const msg = [
        `🎉 *CapAble — Offer Received!*`,
        ``,
        `Congratulations ${opts.candidateName}!`,
        ``,
        `*${opts.company}* has extended an offer for *${opts.role}*!`,
        opts.ctc ? `💰 *CTC:* ${opts.ctc}` : '',
        ``,
        `Log in to CapAble to view and accept your offer letter.`,
        ``,
        `_Reply STOP to unsubscribe_`,
    ].filter(Boolean).join('\n');

    return sendWhatsApp(opts.phone, msg);
}

/** Notify institution admin about a placement */
export async function notifyPlacementWhatsApp(opts: {
    phone: string;
    adminName: string;
    studentName: string;
    company: string;
    role: string;
    ctc?: string;
}): Promise<{ success: boolean; error?: string }> {
    const msg = [
        `🏆 *CapAble — Student Placed!*`,
        ``,
        `Hi ${opts.adminName},`,
        ``,
        `*${opts.studentName}* has been placed at *${opts.company}*!`,
        `💼 *Role:* ${opts.role}`,
        opts.ctc ? `💰 *CTC:* ${opts.ctc}` : '',
        ``,
        `This will be auto-reflected in your NAAC reports.`,
        ``,
        `_CapAble Institution Dashboard_`,
    ].filter(Boolean).join('\n');

    return sendWhatsApp(opts.phone, msg);
}

/** Send OTP/verification SMS */
export async function sendOtpSMS(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    return sendSMS(phone, `Your CapAble verification code is: *${otp}*. Valid for 10 minutes. Do not share with anyone.`);
}

/** Notify founder or applicant about co-founder pitch / match */
export async function notifyCofounderMatchWhatsApp(opts: {
    phone: string;
    founderName?: string;
    applicantName?: string;
    ventureTitle: string;
    roleOffered?: string;
    action: 'requested' | 'accepted' | 'declined';
}): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${SERVER_URL}/api/notify/cofounder-match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: opts.phone,
                founderName: opts.founderName,
                applicantName: opts.applicantName,
                ventureTitle: opts.ventureTitle,
                roleOffered: opts.roleOffered,
                action: opts.action,
            }),
        });
        const data = await res.json() as { success?: boolean; error?: string };
        if (!res.ok) return { success: false, error: data.error || 'Failed to send notification' };
        return { success: true };
    } catch (err) {
        console.warn('[Twilio co-founder]', err);
        return { success: false, error: 'Network error' };
    }
}

/** Notify founder about incubation pitch decision */
export async function notifyIncubationStatusWhatsApp(opts: {
    phone: string;
    applicantName?: string;
    ventureTitle: string;
    institutionName?: string;
    status: string;
    feedback?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${SERVER_URL}/api/notify/incubation-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: opts.phone,
                applicantName: opts.applicantName,
                ventureTitle: opts.ventureTitle,
                institutionName: opts.institutionName,
                status: opts.status,
                feedback: opts.feedback,
            }),
        });
        const data = await res.json() as { success?: boolean; error?: string };
        if (!res.ok) return { success: false, error: data.error || 'Failed to send incubation alert' };
        return { success: true };
    } catch (err) {
        console.warn('[Twilio incubation]', err);
        return { success: false, error: 'Network error' };
    }
}
