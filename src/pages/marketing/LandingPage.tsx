import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    CaretRight, Users, Buildings, GraduationCap, 
    Brain, FileText, ChartBar, ShieldCheck, ArrowRight,
    Lightning, BookOpen, Trophy, Briefcase, CheckCircle
} from '@phosphor-icons/react';
import { LiquidMetalButton } from '../../components/ui/LiquidMetalButton';
import { HeroDashboardMock } from '../../components/ui/HeroDashboardMock';
import logo from '../../assets/sihlogo.png';
import './LandingPage.css';

// ── Stats counter ─────────────────────────────────────────────────────────────
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
    const [val, setVal] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = Math.ceil(to / 60);
        const t = setInterval(() => {
            start += step;
            if (start >= to) { setVal(to); clearInterval(t); }
            else setVal(start);
        }, 16);
        return () => clearInterval(t);
    }, [inView, to]);

    return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const FEATURES = [
    {
        icon: <Brain size={24} weight="fill" />,
        color: '#111111',
        title: 'AI Resume Builder',
        desc: '5 Canva-style templates, ATS scoring, and one-click PDF export — tailored to each JD.',
    },
    {
        icon: <ChartBar size={24} weight="fill" />,
        color: '#111111',
        title: 'Aptitude Practice',
        desc: '60+ campus-style MCQs across Quant, Logical, Verbal, and DI — with per-question timer.',
    },
    {
        icon: <ShieldCheck size={24} weight="fill" />,
        color: '#111111',
        title: 'Verified Skills',
        desc: 'Faculty-endorsed skill badges backed by assessments. Not self-reported — actually proven.',
    },
    {
        icon: <Buildings size={24} weight="fill" />,
        color: '#111111',
        title: 'Campus Placement Engine',
        desc: 'Eligibility auto-check, drive registration, and NAAC-ready placement analytics.',
    },
    {
        icon: <FileText size={24} weight="fill" />,
        color: '#111111',
        title: 'NAAC / NIRF Reports',
        desc: 'One-click accreditation reports with placement data, completion rates, and skill coverage.',
    },
    {
        icon: <Trophy size={24} weight="fill" />,
        color: '#111111',
        title: 'AI Interview Simulator',
        desc: 'GPT-powered mock interviews with real-time feedback on content, structure, and delivery.',
    },
];

const TESTIMONIALS = [
    {
        name: 'Dr. Priya Nair',
        role: 'Placement Officer · VIT Vellore',
        text: "CapAble transformed how we manage placements. Our NAAC documentation now takes minutes, not weeks. Placement rate went from 68% to 89% in one year.",
        avatar: 'P',
        color: '#111111',
    },
    {
        name: 'Rohit Sharma',
        role: 'SDE II · Google Hyderabad',
        text: "Got my first interview through CapAble. The AI resume tailor matched my skills to the JD perfectly — 93% ATS score. Placed within 3 weeks of using the platform.",
        avatar: 'R',
        color: '#111111',
    },
    {
        name: 'Meera Krishnan',
        role: 'HR Lead · Infosys',
        text: "We hired 40 candidates through CapAble this season. The verified skill badges made screening 5x faster. Zero mis-hires so far.",
        avatar: 'M',
        color: '#111111',
    },
    {
        name: 'Arjun Patel',
        role: 'B.Tech CSE · NIT Trichy',
        text: "The aptitude practice bank is exactly like real TCS NQT questions. Cleared it on first attempt. The AI interview simulator boosted my confidence massively.",
        avatar: 'A',
        color: '#111111',
    },
];

const HOW_IT_WORKS = [
    { step: '01', title: 'Build your profile', desc: 'Add skills, projects, and certifications. Get faculty endorsements.', icon: <Users size={20} weight="duotone" /> },
    { step: '02', title: 'Get matched to roles', desc: 'AI engine matches you to campus drives and industry roles by skill fit.', icon: <Lightning size={20} weight="duotone" /> },
    { step: '03', title: 'Practice & prepare', desc: 'Aptitude tests, AI mock interviews, resume tailoring per JD.', icon: <BookOpen size={20} weight="duotone" /> },
    { step: '04', title: 'Get placed', desc: 'Apply, schedule interviews, receive offers — all in one platform.', icon: <Trophy size={20} weight="duotone" /> },
];

const FOR_WHO = [
    {
        audience: 'Students',
        label: 'FOR CANDIDATES',
        headline: 'Your proof of merit,\nnot just a résumé.',
        icon: <GraduationCap size={28} weight="fill" />,
        color: '#111111',
        points: [
            { label: 'Verified Skill Badges', desc: 'Faculty-endorsed, assessment-backed' },
            { label: 'AI Resume Builder', desc: 'ATS-scored, JD-tailored in seconds' },
            { label: 'Mock Interview Simulator', desc: 'GPT-powered with real-time feedback' },
            { label: 'Campus Drive Matching', desc: 'Auto-matched to eligibility criteria' },
        ],
        stats: [
            { val: '93%', label: 'avg. ATS score' },
            { val: '3×', label: 'faster placement' },
        ],
    },
    {
        audience: 'Institutions',
        label: 'FOR ADMINS',
        headline: 'NAAC reports in one click.',
        icon: <Buildings size={24} weight="fill" />,
        color: '#111111',
        points: ['Bulk student management', 'Placement eligibility engine', 'NAAC/NIRF auto-reports', 'Live placement analytics'],
    },
    {
        audience: 'Employers',
        label: 'FOR COMPANIES',
        headline: 'Hire on capability, not credentials.',
        icon: <Briefcase size={24} weight="fill" />,
        color: '#111111',
        points: ['Verified candidate pipeline', 'Kanban hiring board', 'Interview scheduling', 'Auto offer letter generation'],
    },
];

const TRUSTED_LOGOS = ['IIT Delhi', 'NIT Trichy', 'BITS Pilani', 'VIT', 'Wipro', 'Infosys', 'TCS', 'Google'];

export default function LandingPage() {
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="lp-page">
            {/* ── Navbar ── */}
            <nav className="lp-nav">
                <div className="lp-nav-inner">
                    <Link to="/" className="lp-nav-brand">
                        <img src={logo} alt="CapAble" className="lp-nav-logo" />
                        <span>CapAble</span>
                    </Link>
                    <div className="lp-nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                        <a href="#for-who">For whom</a>
                        <a href="#testimonials">Reviews</a>
                    </div>
                    <div className="lp-nav-cta">
                        <Link to="/login" className="lp-btn lp-btn--ghost">Log in</Link>
                        <LiquidMetalButton as={Link} to="/login" variant="primary" size="md" rightIcon={<CaretRight size={14} weight="bold" />}>
                            Get Started Free
                        </LiquidMetalButton>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="lp-hero">
                <div className="lp-hero-grid">
                    <div className="lp-hero-content">
                        {/* Minimal pill badge */}
                        <motion.div className="lp-hero-pill" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
                            Trusted by 500+ institutions across India
                        </motion.div>

                        <motion.h1 className="lp-hero-h1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8, ease: [0.16,1,0.3,1] }}>
                            From Campus to<br />
                            <span>Career — Verified.</span>
                        </motion.h1>

                        <motion.p className="lp-hero-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4, ease: [0.23,1,0.32,1] }}>
                            CapAble is the end-to-end campus placement platform for students, institutions, and employers.<br />
                            AI-powered resumes · Verified skills · Real-time hiring pipelines.
                        </motion.p>

                        <motion.div className="lp-hero-btns" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4, ease: [0.23,1,0.32,1] }}>
                            <LiquidMetalButton as={Link} to="/login" variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                                Start Free — No Credit Card
                            </LiquidMetalButton>
                            <a href="#how-it-works" className="lp-btn lp-btn--outline lp-btn--lg">
                                See How It Works
                            </a>
                        </motion.div>

                        {/* Stats row */}
                        <motion.div className="lp-hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42, duration: 0.45, ease: [0.23,1,0.32,1] }}>
                            {[
                                { val: 500, suffix: '+', label: 'Institutions' },
                                { val: 50000, suffix: '+', label: 'Students' },
                                { val: 89, suffix: '%', label: 'Avg. Placement Rate' },
                                { val: 2000, suffix: '+', label: 'Employers' },
                            ].map(s => (
                                <div key={s.label} className="lp-stat-item">
                                    <div className="lp-stat-num"><CountUp to={s.val} suffix={s.suffix} /></div>
                                    <div className="lp-stat-lbl">{s.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Premium 3D Visual on the right */}
                    <div className="lp-hero-visual" style={{ position: 'relative', perspective: '1200px' }}>
                        
                        {/* Ambient Deep Glow to ground the composition */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '400px',
                            height: '400px',
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
                            filter: 'blur(40px)',
                            zIndex: 0,
                            pointerEvents: 'none'
                        }} />



                        {/* Foreground Interactive Dashboard Mock */}
                        <motion.div 
                            style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', width: '100%' }}
                            initial={{ opacity: 0, y: 40, rotateY: 15 }} 
                            animate={{ opacity: 1, y: 0, rotateY: 0 }} 
                            transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <HeroDashboardMock />
                        </motion.div>
                    </div>
                </div>

                {/* Trusted logos */}
                <div className="lp-trusted-section">
                    <div className="lp-trusted-header">
                        {/* issue #3: sentence-case, not all-caps (>15 chars should never be uppercase) */}
                        <span className="lp-trusted-eyebrow">The standard for campus hiring</span>
                        {/* issue #4: was h3 after h1 — now h2 to avoid skipped level */}
                        <h2 className="lp-trusted-title">Trusted by top tier institutes and global enterprises</h2>
                    </div>
                    
                    <div className="lp-trusted-marquee-container">
                        <div className="lp-trusted-marquee">
                            {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((l, i) => (
                                <div key={i} className="lp-trusted-logo">{l}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="lp-section" id="features">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <div className="lp-section-pill">Features</div>
                        <h2>Everything you need.<br /><span>All in one platform.</span></h2>
                        <p>No more juggling 5 tools. CapAble handles every step of the placement journey.</p>
                    </div>
                    <div className="lp-features-grid">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                className="lp-feature-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16,1,0.3,1] }}
                            >
                                <div className="lp-feature-icon" style={{ background: `${f.color}18`, color: f.color }}>
                                    {f.icon}
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="lp-section lp-section--dark" id="how-it-works">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <div className="lp-section-pill lp-section-pill--light">How it works</div>
                        <h2>From sign-up to<br /><span>offer letter</span> in 4 steps</h2>
                    </div>
                    <div className="lp-steps">
                        {HOW_IT_WORKS.map((step, i) => (
                            <motion.div
                                key={i}
                                className="lp-step-wrapper"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                            >
                                <motion.div 
                                    className="lp-step-line"
                                    variants={{
                                        hidden: { scaleX: 0 },
                                        visible: { scaleX: 1, transition: { duration: 0.8, ease: [0.16,1,0.3,1], delay: 0.1 } }
                                    }}
                                />
                                <div className="lp-step">
                                    <motion.div 
                                        className="lp-step-num"
                                        variants={{
                                            hidden: { opacity: 0, y: 20, scale: 0.95 },
                                            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.2 } }
                                        }}
                                    >
                                        0{i + 1}
                                    </motion.div>
                                    <motion.div 
                                        className="lp-step-content"
                                        variants={{
                                            hidden: { opacity: 0, x: -20 },
                                            visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.3 } }
                                        }}
                                    >
                                        <h3>{step.title}</h3>
                                        <p>{step.desc}</p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── For whom ── */}
            <section className="lp-section" id="for-who">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <div className="lp-section-pill">Built for everyone</div>
                        <h2>One platform.<br /><span>Three audiences.</span></h2>
                    </div>
                    <div className="lp-for-bento">

                        {/* ── Candidate HERO card (Double-Bezel, Editorial Luxury) ── */}
                        <motion.div
                            className="lp-for-candidate"
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
                        >
                            <div className="lp-for-candidate-inner">
                                <div className="lp-for-candidate-top">
                                    <span className="lp-for-label">For Candidates</span>
                                    <div className="lp-for-candidate-icon">
                                        <GraduationCap size={18} weight="fill" />
                                    </div>
                                </div>
                                {/* issue #14: headline now same size as other cards via lp-for-small-headline class */}
                                <h3 className="lp-for-small-headline">
                                    Your proof of merit,<br />
                                    <em style={{ fontStyle: 'italic', color: '#6B6A68' }}>not just a résumé.</em>
                                </h3>
                                <p className="lp-for-candidate-sub">
                                    Build a capability profile that speaks louder than a PDF. Get matched to drives, ace interviews, and land roles on merit — not connections.
                                </p>
                                <div className="lp-for-candidate-features">
                                    {FOR_WHO[0].points.map((p: any) => (
                                        <div key={p.label} className="lp-for-feat">
                                            <CheckCircle size={13} weight="fill" className="lp-for-feat-icon" />
                                            <div>
                                                <div className="lp-for-feat-label">{p.label}</div>
                                                <div className="lp-for-feat-desc">{p.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="lp-for-candidate-stats">
                                    {FOR_WHO[0].stats?.map((s: any) => (
                                        <div key={s.val} className="lp-for-stat">
                                            <span className="lp-for-stat-val">{s.val}</span>
                                            <span className="lp-for-stat-lbl">{s.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Faux-OS window profile mock */}
                                <div className="lp-for-candidate-visual" aria-hidden>
                                    <div className="lp-cand-window">
                                        <div className="lp-cand-titlebar">
                                            <div className="lp-cand-dot" />
                                            <div className="lp-cand-dot" />
                                            <div className="lp-cand-dot" />
                                            <span className="lp-cand-titlebar-label">Capability Profile</span>
                                        </div>
                                        <div className="lp-cand-body">
                                            <div className="lp-cand-card">
                                                <div className="lp-cand-avatar">RS</div>
                                                <div className="lp-cand-info">
                                                    <div className="lp-cand-name">Rohit Sharma</div>
                                                    <div className="lp-cand-role">B.Tech CSE · NIT Trichy</div>
                                                </div>
                                                <div className="lp-cand-score">93<span>%</span></div>
                                            </div>
                                            <div className="lp-cand-badges">
                                                <span className="lp-cand-badge">Python</span>
                                                <span className="lp-cand-badge">SQL</span>
                                                <span className="lp-cand-badge lp-cand-badge--verified">✓ Verified</span>
                                                <span className="lp-cand-badge">DSA</span>
                                                <span className="lp-cand-badge">ML</span>
                                            </div>
                                            <div className="lp-cand-match">
                                                <div className="lp-cand-match-label">Matched to</div>
                                                <div className="lp-cand-match-companies">
                                                    <span>Google</span>
                                                    <span>Wipro</span>
                                                    <span>+12</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* issue #15: CTA at card bottom matching other cards' footer pattern */}
                                <Link to="/login" className="lp-for-cta">
                                    Start free — no credit card <ArrowRight size={12} />
                                </Link>
                            </div>
                        </motion.div>

                        {/* ── Right stack: Institutions + Employers (Double-Bezel) ── */}
                        <div className="lp-for-stack">
                            {FOR_WHO.slice(1).map((f, i) => (
                                <motion.div
                                    key={f.audience}
                                    className="lp-for-small-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.15 + i * 0.12, duration: 0.6, ease: [0.16,1,0.3,1] }}
                                >
                                    <div className="lp-for-small-card-inner">
                                        <div className="lp-for-small-top">
                                            <span className="lp-for-label">{f.label}</span>
                                            <div className="lp-for-small-icon">{f.icon}</div>
                                        </div>
                                        <h3 className="lp-for-small-headline">{f.headline}</h3>
                                        <ul className="lp-for-list">
                                            {(f.points as string[]).map(p => (
                                                <li key={p}><CheckCircle size={12} weight="fill" /> {p}</li>
                                            ))}
                                        </ul>
                                        <Link to="/login" className="lp-for-cta">
                                            Get started <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* ── Testimonials ── */}
            <section className="lp-section lp-section--accent" id="testimonials">
                <div className="lp-section-inner">
                    {/* issue #16: center-align header to match the centered testimonial card */}
                    <div className="lp-section-header lp-section-header--center">
                        <div className="lp-section-pill">Reviews</div>
                        <h2>Loved by students,<br /><span>trusted by institutions.</span></h2>
                    </div>
                    <div className="lp-testimonials">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTestimonial}
                                className="lp-testimonial-card"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
                            >
                                <div className="lp-t-quote">“</div>
                                <p className="lp-t-text">{TESTIMONIALS[activeTestimonial].text}</p>
                                <div className="lp-t-author">
                                    <div className="lp-t-avatar" style={{ background: TESTIMONIALS[activeTestimonial].color }}>
                                        {TESTIMONIALS[activeTestimonial].avatar}
                                    </div>
                                    <div>
                                        <div className="lp-t-name">{TESTIMONIALS[activeTestimonial].name}</div>
                                        <div className="lp-t-role">{TESTIMONIALS[activeTestimonial].role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                        <div className="lp-t-dots">
                            {TESTIMONIALS.map((_, i) => (
                                <button
                                    key={i}
                                    className={`lp-t-dot ${i === activeTestimonial ? 'active' : ''}`}
                                    onClick={() => setActiveTestimonial(i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="lp-cta">
                <div className="lp-cta-inner">
                    <div className="lp-cta-orb" />
                    <div className="lp-section-pill lp-section-pill--light">Start today</div>
                    <h2>Ready to transform<br />campus placements?</h2>
                    <p>Join 500+ institutions already using CapAble. Free for students. Enterprise pricing for institutions.</p>
                    <div className="lp-cta-btns">
                        <LiquidMetalButton as={Link} to="/login" variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                            Get Started Free
                        </LiquidMetalButton>
                        <a href="mailto:hello@capable.app" className="lp-btn lp-btn--outline-light lp-btn--lg">
                            Contact Sales
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-footer-brand">
                        <img src={logo} alt="CapAble" className="lp-footer-logo" />
                        <span>CapAble</span>
                        <p>Bridging Capability. Enabling Careers.</p>
                    </div>
                    {/* issue #5: footer h4s were H2→H4 skip — use h3 */}
                    <div className="lp-footer-links-grid">
                        <div className="lp-footer-col">
                            <h3>Product</h3>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How it works</a>
                            <a href="#for-who">Pricing</a>
                        </div>
                        <div className="lp-footer-col">
                            <h3>Platform</h3>
                            <Link to="/login">For Students</Link>
                            <Link to="/login">For Institutions</Link>
                            <Link to="/login">For Employers</Link>
                        </div>
                        <div className="lp-footer-col">
                            <h3>Company</h3>
                            <a href="#">About</a>
                            <a href="#">Blog</a>
                            <a href="mailto:hello@capable.app">Contact</a>
                        </div>
                        <div className="lp-footer-col">
                            <h3>Legal</h3>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                            <a href="#">Refund Policy</a>
                        </div>
                    </div>
                </div>
                <div className="lp-footer-bottom">
                    <p>© 2025 CapAble Platform. Made with ❤️ in India.</p>
                </div>
            </footer>
        </div>
    );
}
