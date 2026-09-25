import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resolveUsername, getPublicProfile } from '../../services/publicProfileService';
import { getCapabilities, getProjects, getCertifications } from '../../services/profileService';
import {
    MapPin, Link2, ExternalLink, Award, FolderDot, Code2, Code, Briefcase,
    BarChart3, CheckCircle2, Trophy, Loader2, Share2, Copy, QrCode,
    Globe, Zap, GraduationCap, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import './PublicProfilePage.css';

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const [uid, setUid] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [capabilities, setCapabilities] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [certifications, setCertifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Share state
    const [showQR, setShowQR] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

    // ── Data loading ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!username) return;
        const load = async () => {
            try {
                const resolvedUid = await resolveUsername(username);
                if (!resolvedUid) { setNotFound(true); return; }
                setUid(resolvedUid);

                const [p, caps, projs, certs] = await Promise.all([
                    getPublicProfile(resolvedUid),
                    getCapabilities(resolvedUid),
                    getProjects(resolvedUid),
                    getCertifications(resolvedUid),
                ]);

                if (!p) { setNotFound(true); return; }
                setProfile(p);
                setCapabilities(caps);
                setProjects(projs);
                setCertifications(certs);

                // Dynamic meta tags for SEO & link previews
                document.title = `${p.name} — CapAble Profile`;
                setMeta('description', `${p.name}'s verified skill profile on CapAble. ${caps.length} skills assessed.`);
                setMeta('og:title', `${p.name} — CapAble Profile`);
                setMeta('og:description', `Verified capabilities: ${caps.slice(0, 3).map((c: any) => c.skill).join(', ')}...`);
                setMeta('og:type', 'profile');

            } catch (err) {
                console.error(err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [username]);

    function setMeta(name: string, content: string) {
        const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
        if (el) { el.content = content; return; }
        const m = document.createElement('meta');
        m.setAttribute(name.includes('og:') ? 'property' : 'name', name);
        m.content = content;
        document.head.appendChild(m);
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: `${profile?.name} — CapAble`, url: profileUrl });
        } else {
            handleCopy();
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleQR = async () => {
        if (!qrDataUrl) {
            const url = await QRCode.toDataURL(profileUrl, { width: 256, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
            setQrDataUrl(url);
        }
        setShowQR(true);
    };

    // ── Skill level label ─────────────────────────────────────────────────────
    const skillLevel = (score: number) => {
        if (score >= 85) return { label: 'Expert', color: '#10b981' };
        if (score >= 70) return { label: 'Proficient', color: '#6366f1' };
        if (score >= 50) return { label: 'Intermediate', color: '#f59e0b' };
        return { label: 'Learning', color: '#94a3b8' };
    };

    const avgScore = capabilities.length > 0
        ? Math.round(capabilities.reduce((s, c) => s + c.score, 0) / capabilities.length)
        : 0;

    const initials = profile?.name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || '?';

    if (loading) return (
        <div className="pub-page pub-loading">
            <div className="pub-spinner"><Loader2 size={40} className="spin" /></div>
            <p>Loading profile...</p>
        </div>
    );

    if (notFound) return (
        <div className="pub-page pub-notfound">
            <AlertCircle size={64} color="#ef4444" />
            <h2>Profile Not Found</h2>
            <p>The username <strong>@{username}</strong> doesn't exist on CapAble.</p>
            <Link to="/" className="pub-back-link"><ArrowLeft size={16} /> Back to CapAble</Link>
        </div>
    );

    return (
        <div className="pub-page">
            {/* SEO-invisible breadcrumb */}
            <div className="pub-topbar">
                <Link to="/" className="pub-brand">
                    <Zap size={16} /> CapAble
                </Link>
                <div className="pub-share-row">
                    <button className="pub-share-btn" onClick={handleCopy}>
                        <Copy size={14} /> {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button className="pub-share-btn pub-share-btn--qr" onClick={handleQR}>
                        <QrCode size={14} /> QR Code
                    </button>
                    {'share' in navigator && (
                        <button className="pub-share-btn pub-share-btn--primary" onClick={handleShare}>
                            <Share2 size={14} /> Share
                        </button>
                    )}
                </div>
            </div>

            <div className="pub-content">
                {/* ── Hero Card ── */}
                <motion.div className="pub-hero" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="pub-hero-bg" />
                    <div className="pub-hero-body">
                        <div className="pub-avatar-wrap">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="pub-avatar-img" />
                            ) : (
                                <div className="pub-avatar-fallback">{initials}</div>
                            )}
                            {avgScore >= 70 && (
                                <div className="pub-avatar-badge" title="Verified Skills">
                                    <CheckCircle2 size={14} color="#10b981" />
                                </div>
                            )}
                        </div>

                        <div className="pub-hero-info">
                            <h1 className="pub-name">{profile.name}</h1>
                            {profile.headline && <p className="pub-headline">{profile.headline}</p>}
                            {profile.location && (
                                <p className="pub-location"><MapPin size={13} /> {profile.location}</p>
                            )}
                            <p className="pub-handle">@{username}</p>
                        </div>

                        {/* Score ring */}
                        <div className="pub-score-ring-wrap">
                            <svg viewBox="0 0 80 80" className="pub-score-ring">
                                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                                <circle
                                    cx="40" cy="40" r="34" fill="none"
                                    stroke={avgScore >= 70 ? '#10b981' : avgScore >= 50 ? '#6366f1' : '#f59e0b'}
                                    strokeWidth="6" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 34}`}
                                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - avgScore / 100)}`}
                                    transform="rotate(-90 40 40)"
                                />
                            </svg>
                            <div className="pub-score-inner">
                                <span className="pub-score-val">{avgScore || '—'}{avgScore ? '%' : ''}</span>
                                <span className="pub-score-lbl">Avg Score</span>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && <p className="pub-bio">{profile.bio}</p>}

                    {/* Links */}
                    <div className="pub-links">
                        {profile.githubUsername && (
                            <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="pub-link">
                                <Code size={15} /> {profile.githubUsername}
                            </a>
                        )}
                        {profile.linkedinUrl && (
                            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="pub-link">
                                <Briefcase size={15} /> LinkedIn
                            </a>
                        )}
                        {profile.leetcodeUsername && (
                            <a href={`https://leetcode.com/${profile.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" className="pub-link pub-link--lc">
                                <Code2 size={15} /> LeetCode
                            </a>
                        )}
                        {profile.portfolioUrl && (
                            <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="pub-link">
                                <Globe size={15} /> Portfolio
                            </a>
                        )}
                    </div>
                </motion.div>

                {/* ── Stats Row ── */}
                <motion.div
                    className="pub-stats"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                >
                    {[
                        { icon: BarChart3, label: 'Skills Verified', val: capabilities.length, color: '#6366f1' },
                        { icon: FolderDot, label: 'Projects', val: projects.length, color: '#10b981' },
                        { icon: Award, label: 'Certificates', val: certifications.length, color: '#f59e0b' },
                        { icon: Trophy, label: 'Avg Score', val: avgScore ? `${avgScore}%` : '—', color: '#2563eb' },
                    ].map(s => (
                        <div key={s.label} className="pub-stat">
                            <s.icon size={20} color={s.color} />
                            <div className="pub-stat-val" style={{ color: s.color }}>{s.val}</div>
                            <div className="pub-stat-lbl">{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                <div className="pub-grid">
                    {/* ── Skills ── */}
                    {capabilities.length > 0 && (
                        <motion.section
                            className="pub-section"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        >
                            <h2 className="pub-section-title"><BarChart3 size={18} /> Verified Skills</h2>
                            <div className="pub-skills">
                                {capabilities.sort((a, b) => b.score - a.score).map((cap, i) => {
                                    const lvl = skillLevel(cap.score);
                                    return (
                                        <div key={i} className="pub-skill-row">
                                            <div className="pub-skill-head">
                                                <span className="pub-skill-name">{cap.skill}</span>
                                                <span className="pub-skill-badge" style={{ background: `${lvl.color}20`, color: lvl.color }}>
                                                    {lvl.label} · {cap.score}%
                                                </span>
                                            </div>
                                            <div className="pub-skill-bar">
                                                <motion.div
                                                    className="pub-skill-fill"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${cap.score}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.04 }}
                                                    style={{ background: lvl.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.section>
                    )}

                    {/* ── Projects ── */}
                    {projects.length > 0 && (
                        <motion.section
                            className="pub-section"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        >
                            <h2 className="pub-section-title"><FolderDot size={18} /> Projects</h2>
                            <div className="pub-projects">
                                {projects.map((p, i) => (
                                    <div key={i} className="pub-project-card">
                                        <div className="pub-project-head">
                                            <span className="pub-project-name">{p.title || p.name}</span>
                                            {(p.url || p.repoUrl) && (
                                                <a href={p.url || p.repoUrl} target="_blank" rel="noopener noreferrer" className="pub-project-link">
                                                    <ExternalLink size={13} />
                                                </a>
                                            )}
                                        </div>
                                        {p.description && <p className="pub-project-desc">{p.description}</p>}
                                        {p.techStack?.length > 0 && (
                                            <div className="pub-tags">
                                                {p.techStack.slice(0, 5).map((t: string) => (
                                                    <span key={t} className="pub-tag">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* ── Certifications ── */}
                    {certifications.length > 0 && (
                        <motion.section
                            className="pub-section"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        >
                            <h2 className="pub-section-title"><Award size={18} /> Certifications</h2>
                            <div className="pub-certs">
                                {certifications.map((c, i) => (
                                    <div key={i} className="pub-cert-row">
                                        <GraduationCap size={16} color="#6366f1" />
                                        <div>
                                            <div className="pub-cert-name">{c.name}</div>
                                            <div className="pub-cert-issuer">{c.issuer}{c.issueDate ? ` · ${c.issueDate}` : ''}</div>
                                        </div>
                                        {c.credentialUrl && (
                                            <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="pub-cert-link">
                                                <ExternalLink size={13} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </div>

                {/* ── CTA ── */}
                <motion.div
                    className="pub-cta-card"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                >
                    <div>
                        <div className="pub-cta-title">Hire {profile.name?.split(' ')[0]}</div>
                        <div className="pub-cta-sub">Powered by CapAble — AI-verified skills & capabilities</div>
                    </div>
                    <div className="pub-cta-actions">
                        <a href={`mailto:${profile.email}?subject=Opportunity for ${profile.name} via CapAble`} className="pub-cta-btn">
                            <Briefcase size={15} /> Contact
                        </a>
                        <Link to="/login" className="pub-cta-btn pub-cta-btn--sec">
                            View on CapAble
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* ── QR Modal ── */}
            {showQR && (
                <div className="pub-qr-overlay" onClick={() => setShowQR(false)}>
                    <div className="pub-qr-modal" onClick={e => e.stopPropagation()}>
                        <h3>Share Profile</h3>
                        <p>Scan to open <strong>@{username}</strong>'s profile</p>
                        <img src={qrDataUrl} alt="Profile QR" className="pub-qr-img" />
                        <p className="pub-qr-url">{profileUrl}</p>
                        <button className="pub-qr-copy" onClick={handleCopy}>
                            <Copy size={14} /> {copied ? 'Copied!' : 'Copy URL'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
