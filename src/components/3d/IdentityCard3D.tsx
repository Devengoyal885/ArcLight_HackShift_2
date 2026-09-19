import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import logo from '../../assets/sihlogo.png';
import './IdentityCard3D.css';

interface IdentityCard3DProps {
    name: string;
    role: string;
    initials: string;
    capabilityConfidence: number;
    verifiedEvidence: number;
    projectCount: number;
}

export function IdentityCard3D({ name, role, initials, capabilityConfidence, verifiedEvidence, projectCount }: IdentityCard3DProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, { stiffness: 120, damping: 20 });
    const springY = useSpring(rotateY, { stiffness: 120, damping: 20 });

    const glareX = useTransform(springY, [-15, 15], ['0%', '100%']);
    const glareY = useTransform(springX, [-15, 15], ['0%', '100%']);

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
            rotateX.set(-dy * 12);
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

    const circumference = 2 * Math.PI * 38;
    const offset = circumference - (capabilityConfidence / 100) * circumference;

    return (
        <div className="id-card-scene" ref={cardRef}>
            <motion.div
                className="id-card"
                style={{ rotateX: springX, rotateY: springY }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
                {/* Glare overlay */}
                <motion.div
                    className="id-card-glare"
                    style={{
                        background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.12) 0%, transparent 60%)`,
                    }}
                />

                {/* Card content */}
                <div className="id-card-inner">
                    {/* Header band */}
                    <div className="id-card-header">
                        <img src={logo} className="id-card-logo id-card-logo-img" alt="CapAble Logo" />
                        <div className="id-card-type">CAPABILITY TWIN</div>
                    </div>

                    {/* Avatar + Score row */}
                    <div className="id-card-hero">
                        <div className="id-card-avatar-wrap">
                            <div className="id-card-avatar">{initials}</div>
                            <div className="id-card-avatar-ring" />
                        </div>

                        {/* Circular score */}
                        <div className="id-card-score-wrap">
                            <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
                                <circle
                                    cx={45} cy={45} r={38}
                                    fill="none"
                                    stroke="#2563eb"
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    style={{ filter: 'drop-shadow(0 0 6px rgba(37,99,235,0.7))' }}
                                />
                            </svg>
                            <div className="id-card-score-text">
                                <span className="id-card-score-number">{capabilityConfidence}</span>
                                <span className="id-card-score-pct">%</span>
                            </div>
                            <p className="id-card-score-label">Capability</p>
                        </div>
                    </div>

                    {/* Name & Role */}
                    <div className="id-card-identity">
                        <h2 className="id-card-name">{name}</h2>
                        <p className="id-card-role">{role}</p>
                    </div>

                    {/* Stats strip */}
                    <div className="id-card-stats">
                        <div className="id-card-stat">
                            <span className="id-card-stat-value">{verifiedEvidence}</span>
                            <span className="id-card-stat-label">Verified Evidence</span>
                        </div>
                        <div className="id-card-stat-divider" />
                        <div className="id-card-stat">
                            <span className="id-card-stat-value">{projectCount}</span>
                            <span className="id-card-stat-label">Projects</span>
                        </div>
                        <div className="id-card-stat-divider" />
                        <div className="id-card-stat">
                            <span className="id-card-stat-value" style={{ color: '#10b981' }}>✓</span>
                            <span className="id-card-stat-label">Verified</span>
                        </div>
                    </div>

                    {/* Edge highlight */}
                    <div className="id-card-edge-top" />
                    <div className="id-card-edge-left" />
                </div>
            </motion.div>
        </div>
    );
}
