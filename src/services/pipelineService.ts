/**
 * pipelineService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Manages the employer hiring pipeline — moving candidates through stages
 * and generating PDF offer letters.
 */

import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RoleApplication } from './employerService';
import html2pdf from 'html2pdf.js';

export type PipelineStage =
    | 'Applied'
    | 'Screening'
    | 'Interview Scheduled'
    | 'Offer Extended'
    | 'Placed'
    | 'Rejected';

export interface OfferLetterData {
    candidateName: string;
    roleTitle: string;
    companyName: string;
    salary: string;
    startDate: string;
    location: string;
    employerName: string;
    employerDesignation: string;
    offerDate?: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
    'Applied',
    'Screening',
    'Interview Scheduled',
    'Offer Extended',
    'Placed',
];

export const STAGE_CONFIG: Record<PipelineStage, { color: string; bg: string; emoji: string }> = {
    'Applied':              { color: '#2563eb', bg: '#eff6ff', emoji: '📥' },
    'Screening':            { color: '#f59e0b', bg: '#fffbeb', emoji: '🔍' },
    'Interview Scheduled':  { color: '#7c3aed', bg: '#f5f3ff', emoji: '🗓️' },
    'Offer Extended':       { color: '#10b981', bg: '#f0fdf4', emoji: '🤝' },
    'Placed':               { color: '#059669', bg: '#dcfce7', emoji: '🎉' },
    'Rejected':             { color: '#ef4444', bg: '#fef2f2', emoji: '✖' },
};

/**
 * Move a candidate application to a new pipeline stage.
 */
export async function moveApplication(
    roleId: string,
    appId: string,
    newStage: PipelineStage
): Promise<void> {
    const ref = doc(db, 'postedRoles', roleId, 'applications', appId);
    await updateDoc(ref, {
        status: newStage,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Auto-shortlist candidates whose capabilityMatch >= threshold.
 * Returns how many were moved to Screening.
 */
export async function autoShortlist(
    applications: RoleApplication[],
    roleId: string,
    threshold: number
): Promise<number> {
    const eligible = applications.filter(
        a => a.status === 'Applied' && (a.capabilityMatch ?? 0) >= threshold
    );

    await Promise.all(eligible.map(app =>
        moveApplication(roleId, app.id!, 'Screening')
    ));

    return eligible.length;
}

/**
 * Generates and prints a professional offer letter PDF.
 */
export function generateOfferLetter(data: OfferLetterData): void {
    const today = data.offerDate ?? new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Offer Letter — ${data.candidateName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; color: #1a1a2e; background: white; font-size: 12pt; line-height: 1.7; }
        .page { max-width: 720px; margin: 0 auto; padding: 60px 60px; }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
        .company-name { font-size: 22pt; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
        .header-right { text-align: right; font-size: 10pt; color: #64748b; }
        .ref-row { display: flex; justify-content: space-between; margin-bottom: 28px; font-size: 11pt; }
        .label { color: #64748b; font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; }
        .subject { font-size: 14pt; font-weight: bold; color: #2563eb; margin: 24px 0 20px; text-transform: uppercase; letter-spacing: 0.5px; }
        .salutation { margin-bottom: 16px; }
        .body-para { margin-bottom: 16px; text-align: justify; }
        .offer-box { border: 1.5px solid #2563eb; border-radius: 8px; padding: 24px; margin: 28px 0; background: #f8faff; }
        .offer-box table { width: 100%; border-collapse: collapse; }
        .offer-box td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        .offer-box td:first-child { font-weight: 600; width: 40%; color: #334155; }
        .offer-box td:last-child { color: #0f172a; font-weight: 700; }
        .offer-box tr:last-child td { border-bottom: none; }
        .conditions { margin: 20px 0; }
        .conditions h3 { font-size: 11pt; margin-bottom: 10px; color: #334155; }
        .conditions ol { padding-left: 20px; }
        .conditions li { margin-bottom: 8px; font-size: 11pt; }
        .signature-section { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
        .sign-block { text-align: center; }
        .sign-line { width: 180px; height: 1px; background: #000; margin-bottom: 6px; }
        .sign-name { font-weight: bold; font-size: 11pt; }
        .sign-title { font-size: 10pt; color: #64748b; }
        .stamp-area { border: 2px dashed #cbd5e1; width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10pt; text-align: center; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #94a3b8; text-align: center; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div>
                <div class="company-name">${data.companyName}</div>
                <div style="font-size:10pt; color:#64748b; margin-top:4px;">Powered by CapAble Hiring</div>
            </div>
            <div class="header-right">
                Date: ${today}<br />
                Ref: OL/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000) + 1000}
            </div>
        </div>

        <div class="ref-row">
            <div>
                <div class="label">Candidate</div>
                <div style="font-size:13pt; font-weight:700; margin-top:4px;">${data.candidateName}</div>
            </div>
        </div>

        <div class="subject">Offer of Employment — ${data.roleTitle}</div>

        <div class="salutation">Dear <strong>${data.candidateName}</strong>,</div>

        <p class="body-para">
            We are delighted to extend this formal offer of employment to you for the position of
            <strong>${data.roleTitle}</strong> at <strong>${data.companyName}</strong>. After a thorough evaluation
            of your qualifications and performance during our selection process powered by the CapAble AI Assessment Platform,
            we are confident that you will be a valuable addition to our team.
        </p>

        <div class="offer-box">
            <table>
                <tr><td>Designation</td><td>${data.roleTitle}</td></tr>
                <tr><td>Compensation (CTC)</td><td>${data.salary}</td></tr>
                <tr><td>Reporting Location</td><td>${data.location}</td></tr>
                <tr><td>Date of Joining</td><td>${data.startDate}</td></tr>
            </table>
        </div>

        <div class="conditions">
            <h3>Terms & Conditions:</h3>
            <ol>
                <li>This offer is contingent upon successful completion of background verification and document submission.</li>
                <li>You are required to submit your acceptance of this offer within <strong>7 working days</strong>.</li>
                <li>Please report to the HR department on your date of joining with all original documents.</li>
                <li>This offer is subject to your maintaining good conduct and satisfactory performance.</li>
                <li>The compensation mentioned is subject to applicable statutory deductions.</li>
            </ol>
        </div>

        <p class="body-para">
            We look forward to welcoming you to ${data.companyName}. Should you have any queries, please do not
            hesitate to contact our HR department. We are excited about the prospect of you joining our team.
        </p>

        <p class="body-para">Congratulations and warm regards,</p>

        <div class="signature-section">
            <div class="sign-block">
                <div class="sign-line"></div>
                <div class="sign-name">${data.employerName}</div>
                <div class="sign-title">${data.employerDesignation}</div>
                <div class="sign-title">${data.companyName}</div>
            </div>
            <div class="stamp-area">Company<br/>Seal</div>
            <div class="sign-block">
                <div class="sign-line"></div>
                <div class="sign-name">Candidate Acceptance</div>
                <div class="sign-title">Signature & Date</div>
            </div>
        </div>

        <div class="footer">
            This is a digitally generated offer letter from ${data.companyName} via CapAble Platform.<br/>
            Generated on ${today} — Verify authenticity with your HR department.
        </div>
    </div>
</body>
</html>
`;

    const element = document.createElement('div');
    element.innerHTML = html;
    
    // We append it to the body temporarily (off-screen) so html2pdf can compute styles
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    document.body.appendChild(element);

    const opt = {
        margin:       0,
        filename:     `Offer_Letter_${data.candidateName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(element);
    });
}
