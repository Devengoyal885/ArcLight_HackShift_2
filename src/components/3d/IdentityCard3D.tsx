import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { BadgeCheck } from 'lucide-react';
import logo from '../../assets/sihlogo.png';
import './IdentityCard3D.css';

interface IdentityCard3DProps {
    name: string;
    role: string;
    initials: string;
    capabilityConfidence: number;
    verifiedEvidence: number;
    projectCount: number;
    photoURL?: string | null;
    globalScore?: number;
}

export function IdentityCard3D({ name, role, initials, capabilityConfidence, verifiedEvidence, projectCount, photoURL, globalScore }: IdentityCard3DProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, { stiffness: 300, damping: 20 });
    const springY = useSpring(rotateY, { stiffness: 300, damping: 20 });
    const glareX = useTransform(springY, [-15, 15], ['0%', '100%']);
    const glareY = useTransform(springX, [-15, 15], ['0%', '100%']);
    const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15) 0%, transparent 60%)`;

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            rotateY.set(dx * 15);
            rotateX.set(-dy * 15);
        };

        const handleMouseLeave = () => {
            rotateX.set(0);
            rotateY.set(0);
        };

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [rotateX, rotateY]);

    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (capabilityConfidence / 100) * circumference;

    return (
        <div className="id-card-wrapper" ref={cardRef}>
            <motion.div
                className="id-card-premium"
                style={{ rotateX: springX, rotateY: springY }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            >
                {/* Glare overlay */}
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        background: glareBackground,
                        pointerEvents: 'none'
                    }}
                />

                {/* Animated Hover Border */}
                <div className="id-card-animated-border" />

                {/* Front Image Cover (fades on hover) */}
                <div className="id-card-image-cover">
                    <div 
                        className="id-card-lottie-avatar"
                        ref={(el) => {
                            if (el && !el.hasAttribute('data-lottie-loaded')) {
                                el.setAttribute('data-lottie-loaded', 'true');
                                fetch('/child-avatar.json')
                                    .then(res => res.json())
                                    .then(data => {
                                        import('lottie-web').then((lottie) => {
                                            lottie.default.loadAnimation({
                                                container: el,
                                                renderer: 'svg',
                                                loop: true,
                                                autoplay: true,
                                                animationData: data,
                                                rendererSettings: {
                                                    preserveAspectRatio: 'xMidYMid slice',
                                                }
                                            });
                                        });
                                    })
                                    .catch(console.error);
                            }
                        }}
                        style={{ width: '100%', height: '100%' }}
                    />
                    <div className="id-card-image-overlay" />
                    <div className="id-card-image-name">{name}</div>
                </div>

                <div className="id-card-inner">
                    {/* Header */}
                    <div className="id-card-header">
                        <img src={logo} className="id-card-logo" alt="CapAble Logo" />
                        <div className="id-card-label">CAPABILITY TWIN</div>
                    </div>

                    {/* Ring + Avatar */}
                    <div className="id-card-hero">
                        <div className="id-card-ring-container">
                            <svg width="120" height="120" className="id-card-svg-ring">
                                <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(100,125,160,0.12)" strokeWidth="3" />
                                <motion.circle
                                    cx="60" cy="60" r={radius}
                                    fill="none"
                                    stroke="#059669"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: offset }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="id-card-ring-progress"
                                />
                                {/* Decorative ticks */}
                                {[...Array(8)].map((_, i) => (
                                    <line
                                        key={i}
                                        x1="60" y1="12" x2="60" y2="16"
                                        stroke="rgba(100,130,200,0.25)"
                                        strokeWidth="1.5"
                                        transform={`rotate(${i * 45} 60 60)`}
                                    />
                                ))}
                            </svg>
                            
                            <div className="id-card-avatar-container">
                                <div className="id-card-avatar">{initials}</div>
                            </div>
                        </div>

                        {/* Capability Score */}
                        <div className="id-card-score-container">
                            <div className="id-card-score-value">
                                {capabilityConfidence}<span className="id-card-score-percent">%</span>
                            </div>
                            <div className="id-card-score-label">CAPABILITY</div>
                        </div>
                    </div>

                    {/* Identity Details */}
                    <div className="id-card-identity">
                        <h2 className="id-card-name">
                            {name}
                            {globalScore && globalScore > 100 && (
                                <BadgeCheck size={20} className="id-card-verified-badge" fill="#3B82F6" stroke="#fff" />
                            )}
                        </h2>
                        <p className="id-card-subtitle">{role}</p>
                    </div>

                    {/* Statistics Capsule */}
                    <div className="id-card-stats-capsule">
                        <div className="id-card-stat">
                            <span className="id-card-stat-val">{verifiedEvidence}</span>
                            <span className="id-card-stat-lbl">VERIFIED<br/>EVIDENCE</span>
                        </div>
                        <div className="id-card-stat-divider" />
                        <div className="id-card-stat">
                            <span className="id-card-stat-val">{globalScore ?? projectCount}</span>
                            <span className="id-card-stat-lbl">{globalScore !== undefined ? <>GLOBAL<br/>SCORE</> : <>PROJECTS<br/>&nbsp;</>}</span>
                        </div>
                        <div className="id-card-stat-divider" />
                        <div className="id-card-stat">
                            <div className="id-card-verified-pill">✓</div>
                            <span className="id-card-stat-lbl">VERIFIED<br/>&nbsp;</span>
                        </div>
                    </div>

                    {/* Edge Highlights */}
                    <div className="id-card-edge-highlight" />
                </div>
            </motion.div>
        </div>
    );
}
