import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getCertificate, type SkillCertificate } from '../../services/certificateService';
import { CheckCircle2, Award, ExternalLink, Download, Loader2, Shield } from 'lucide-react';
import QRCode from 'qrcode';
import './CertificatePage.css';

export default function CertificatePage() {
    const { certId } = useParams<{ certId: string }>();
    const [cert, setCert] = useState<SkillCertificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const certRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!certId) return;
        getCertificate(certId)
            .then(c => {
                if (!c) { setNotFound(true); return; }
                setCert(c);
                // Generate QR code for the verify URL
                const verifyUrl = `${window.location.origin}/certificate/${certId}`;
                QRCode.toDataURL(verifyUrl, { width: 120, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
                    .then(setQrDataUrl)
                    .catch(() => {});
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [certId]);

    const handleDownload = () => {
        if (!certRef.current) return;
        import('html2canvas').then(({ default: html2canvas }) => {
            html2canvas(certRef.current!, { scale: 3, backgroundColor: '#0f172a' }).then(canvas => {
                const link = document.createElement('a');
                link.download = `capable_certificate_${cert?.skill?.replace(/ /g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        });
    };

    const gradeColors: Record<string, string> = {
        'A+': '#10b981', 'A': '#22c55e', 'B+': '#3b82f6', 'B': '#6366f1', 'C': '#f59e0b'
    };

    const issueDate = cert?.issuedAt
        ? new Date((cert.issuedAt as any).toDate?.() ?? cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) return (
        <div className="cert-page cert-loading">
            <Loader2 size={40} className="spin" />
            <p>Verifying certificate...</p>
        </div>
    );

    if (notFound) return (
        <div className="cert-page cert-notfound">
            <Shield size={64} color="#ef4444" />
            <h2>Certificate Not Found</h2>
            <p>This certificate ID does not exist or has been revoked.</p>
        </div>
    );

    return (
        <div className="cert-page">
            {/* Verification badge */}
            <div className="cert-verify-badge">
                <CheckCircle2 size={18} color="#10b981" />
                <span>Verified by CapAble — This is an authentic skill certificate</span>
            </div>

            {/* The certificate itself */}
            <div className="cert-wrapper" ref={certRef}>
                <div className="cert-header-strip" />

                <div className="cert-body">
                    <div className="cert-logo-row">
                        <Award size={48} color="#6366f1" />
                        <div>
                            <div className="cert-brand">CapAble</div>
                            <div className="cert-brand-sub">AI-Verified Skill Certificate</div>
                        </div>
                    </div>

                    <div className="cert-presented">This certifies that</div>
                    <div className="cert-name">{cert!.candidateName}</div>

                    <div className="cert-presented">has demonstrated verified proficiency in</div>
                    <div className="cert-skill">{cert!.skill}</div>
                    <div className="cert-domain">Domain: {cert!.domain}</div>

                    <div className="cert-score-row">
                        <div className="cert-score-card">
                            <span className="cert-score-val">{cert!.score}%</span>
                            <span className="cert-score-lbl">Assessment Score</span>
                        </div>
                        <div className="cert-score-card" style={{ borderColor: gradeColors[cert!.grade] }}>
                            <span className="cert-score-val" style={{ color: gradeColors[cert!.grade] }}>{cert!.grade}</span>
                            <span className="cert-score-lbl">Grade</span>
                        </div>
                    </div>

                    <div className="cert-meta">
                        <div className="cert-meta-item">
                            <span className="cert-meta-label">Issued On</span>
                            <span className="cert-meta-val">{issueDate}</span>
                        </div>
                        {cert!.institutionName && (
                            <div className="cert-meta-item">
                                <span className="cert-meta-label">Institution</span>
                                <span className="cert-meta-val">{cert!.institutionName}</span>
                            </div>
                        )}
                        <div className="cert-meta-item">
                            <span className="cert-meta-label">Certificate ID</span>
                            <span className="cert-meta-val cert-id">{certId}</span>
                        </div>
                    </div>

                    <div className="cert-footer-row">
                        <div className="cert-sign-block">
                            <div className="cert-sign-line" />
                            <span>CapAble Platform</span>
                        </div>
                        {qrDataUrl && (
                            <div className="cert-qr-block">
                                <img src={qrDataUrl} alt="Verify QR" className="cert-qr" />
                                <span>Scan to verify</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="cert-footer-strip" />
            </div>

            {/* Actions */}
            <div className="cert-actions">
                <button className="cert-btn primary" onClick={handleDownload}>
                    <Download size={16} /> Download Certificate
                </button>
                <button className="cert-btn secondary" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Certificate link copied!');
                }}>
                    <ExternalLink size={16} /> Copy Verify Link
                </button>
            </div>
        </div>
    );
}
