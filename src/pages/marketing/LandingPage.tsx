import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ChevronRight, Star, Users, Building2, GraduationCap, Award,
    Brain, FileText, BarChart3, Shield, CheckCircle2, ArrowRight,
    Zap, Globe, TrendingUp, BookOpen, Trophy, Clock,
} from 'lucide-react';
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
        icon: <Brain size={24} />,
        color: '#6366f1',
        title: 'AI Resume Builder',
        desc: '5 Canva-style templates, ATS scoring, and one-click PDF export — tailored to each JD.',
    },
    {
        icon: <BarChart3 size={24} />,
        color: '#2563eb',
        title: 'Aptitude Practice',
        desc: '60+ campus-style MCQs across Quant, Logical, Verbal, and DI — with per-question timer.',
    },
    {
        icon: <Shield size={24} />,
        color: '#10b981',
        title: 'Verified Skills',
        desc: 'Faculty-endorsed skill badges backed by assessments. Not self-reported — actually proven.',
    },
    {
        icon: <Building2 size={24} />,
        color: '#f59e0b',
        title: 'Campus Placement Engine',
        desc: 'Eligibility auto-check, drive registration, and NAAC-ready placement analytics.',
    },
    {
        icon: <FileText size={24} />,
        color: '#7c3aed',
        title: 'NAAC / NIRF Reports',
        desc: 'One-click accreditation reports with placement data, completion rates, and skill coverage.',
    },
    {
        icon: <Trophy size={24} />,
        color: '#e11d48',
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
        color: '#2563eb',
    },
    {
        name: 'Rohit Sharma',
        role: 'SDE II · Google Hyderabad',
        text: "Got my first interview through CapAble. The AI resume tailor matched my skills to the JD perfectly — 93% ATS score. Placed within 3 weeks of using the platform.",
        avatar: 'R',
        color: '#10b981',
    },
    {
        name: 'Meera Krishnan',
        role: 'HR Lead · Infosys',
        text: "We hired 40 candidates through CapAble this season. The verified skill badges made screening 5x faster. Zero mis-hires so far.",
        avatar: 'M',
        color: '#7c3aed',
    },
    {
        name: 'Arjun Patel',
        role: 'B.Tech CSE · NIT Trichy',
        text: "The aptitude practice bank is exactly like real TCS NQT questions. Cleared it on first attempt. The AI interview simulator boosted my confidence massively.",
        avatar: 'A',
        color: '#f59e0b',
    },
];

const HOW_IT_WORKS = [
    { step: '01', title: 'Build your profile', desc: 'Add skills, projects, and certifications. Get faculty endorsements.', icon: <Users size={20} /> },
    { step: '02', title: 'Get matched to roles', desc: 'AI engine matches you to campus drives and industry roles by skill fit.', icon: <Zap size={20} /> },
    { step: '03', title: 'Practice & prepare', desc: 'Aptitude tests, AI mock interviews, resume tailoring per JD.', icon: <BookOpen size={20} /> },
    { step: '04', title: 'Get placed', desc: 'Apply, schedule interviews, receive offers — all in one platform.', icon: <Trophy size={20} /> },
];

const FOR_WHO = [
    {
        audience: 'Students',
        icon: <GraduationCap size={28} />,
        color: '#2563eb',
        points: ['Build verified skill portfolios', 'Practice aptitude & interviews', 'AI-tailored resumes', 'Alumni mentorship network'],
    },
    {
        audience: 'Institutions',
        icon: <Building2 size={28} />,
        color: '#10b981',
        points: ['Bulk student management', 'Placement eligibility engine', 'NAAC/NIRF auto-reports', 'Live placement analytics'],
    },
    {
        audience: 'Employers',
        icon: <Briefcase size={28} />,
        color: '#7c3aed',
        points: ['Verified candidate pipeline', 'Kanban hiring board', 'Interview scheduling', 'Auto offer letter generation'],
    },
];

const TRUSTED_LOGOS = ['IIT Delhi', 'NIT Trichy', 'BITS Pilani', 'VIT', 'Wipro', 'Infosys', 'TCS', 'Google'];

function Briefcase({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
}

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
                        <Link to="/login" className="lp-btn lp-btn--primary">Get Started Free <ChevronRight size={14} /></Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="lp-hero">
                {/* Background orbs */}
                <div className="lp-orb lp-orb-1" />
                <div className="lp-orb lp-orb-2" />
                <div className="lp-orb lp-orb-3" />

                {/* Pill badge */}
                <motion.div className="lp-hero-pill" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <Star size={12} fill="currentColor" /> Trusted by 500+ institutions across India
                </motion.div>

                <motion.h1 className="lp-hero-h1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    From Campus to<br />
                    <span className="lp-hero-gradient">Career — Verified.</span>
                </motion.h1>

                <motion.p className="lp-hero-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    CapAble is the end-to-end campus placement platform for students, institutions, and employers.<br />
                    AI-powered resumes · Verified skills · Real-time hiring pipelines.
                </motion.p>

                <motion.div className="lp-hero-btns" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Link to="/login" className="lp-btn lp-btn--primary lp-btn--lg">
                        Start Free — No Credit Card <ArrowRight size={16} />
                    </Link>
                    <a href="#how-it-works" className="lp-btn lp-btn--outline lp-btn--lg">
                        See How It Works
                    </a>
                </motion.div>

                {/* Stats row */}
                <motion.div className="lp-hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    {[
                        { val: 500, suffix: '+', label: 'Institutions' },
                        { val: 50000, suffix: '+', label: 'Students' },
                        { val: 89, suffix: '%', label: 'Avg. Placement Rate' },
                        { val: 2000, suffix: '+', label: 'Employers Hiring' },
                    ].map(s => (
                        <div key={s.label} className="lp-stat-item">
                            <div className="lp-stat-num"><CountUp to={s.val} suffix={s.suffix} /></div>
                            <div className="lp-stat-lbl">{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Trusted logos */}
                <div className="lp-trusted-strip">
                    <span className="lp-trusted-lbl">Trusted by</span>
                    {TRUSTED_LOGOS.map(l => (
                        <div key={l} className="lp-trusted-logo">{l}</div>
                    ))}
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
                                transition={{ delay: i * 0.07 }}
                                whileHover={{ y: -4 }}
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
                    <div className="lp-section-header lp-section-header--light">
                        <div className="lp-section-pill lp-section-pill--light">How it works</div>
                        <h2 style={{ color: 'white' }}>From sign-up to<br /><span style={{ color: '#60a5fa' }}>offer letter</span> in 4 steps</h2>
                    </div>
                    <div className="lp-steps">
                        {HOW_IT_WORKS.map((step, i) => (
                            <motion.div
                                key={i}
                                className="lp-step"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="lp-step-num">{step.step}</div>
                                <div className="lp-step-icon">{step.icon}</div>
                                <div>
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
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
                    <div className="lp-for-who-grid">
                        {FOR_WHO.map((f, i) => (
                            <motion.div
                                key={f.audience}
                                className="lp-for-card"
                                style={{ '--card-color': f.color } as React.CSSProperties}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="lp-for-icon" style={{ background: `${f.color}18`, color: f.color }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ color: f.color }}>{f.audience}</h3>
                                <ul className="lp-for-list">
                                    {f.points.map(p => (
                                        <li key={p}><CheckCircle2 size={14} style={{ color: f.color }} /> {p}</li>
                                    ))}
                                </ul>
                                <Link to="/login" className="lp-for-cta" style={{ background: f.color }}>
                                    Get started <ChevronRight size={14} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="lp-section lp-section--accent" id="testimonials">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <div className="lp-section-pill">Reviews</div>
                        <h2>Loved by students,<br /><span>trusted by institutions.</span></h2>
                    </div>
                    <div className="lp-testimonials">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTestimonial}
                                className="lp-testimonial-card"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.35 }}
                            >
                                <div className="lp-t-quote">"</div>
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
                        <Link to="/login" className="lp-btn lp-btn--white lp-btn--lg">
                            Get Started Free <ArrowRight size={16} />
                        </Link>
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
                    <div className="lp-footer-links-grid">
                        <div className="lp-footer-col">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How it works</a>
                            <a href="#for-who">Pricing</a>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Platform</h4>
                            <Link to="/login">For Students</Link>
                            <Link to="/login">For Institutions</Link>
                            <Link to="/login">For Employers</Link>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Company</h4>
                            <a href="#">About</a>
                            <a href="#">Blog</a>
                            <a href="mailto:hello@capable.app">Contact</a>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Legal</h4>
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
