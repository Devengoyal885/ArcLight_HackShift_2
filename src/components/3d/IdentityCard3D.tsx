import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
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
    const [animatedScore, setAnimatedScore] = useState(0);

    // Initial animation for the capability percentage
    useEffect(() => {
        let start = 0;
        const end = capabilityConfidence;
        if (start === end) return;
        const duration = 1200; // ms
        const incrementTime = 20;
        const totalSteps = Math.ceil(duration / incrementTime);
        const stepValue = end / totalSteps;
        let current = 0;
        
        const timer = setInterval(() => {
            start += stepValue;
            current++;
            if (current >= totalSteps) {
                setAnimatedScore(end);
                clearInterval(timer);
            } else {
                setAnimatedScore(Math.round(start));
            }
        }, incrementTime);
        
        return () => clearInterval(timer);
    }, [capabilityConfidence]);

    // Circumference logic for progress ring (radius = 42)
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (capabilityConfidence / 100) * circumference;

    return (
        <div className="id-card-wrapper">
            <motion.div
                className="id-card-premium"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {/* Subtle Radial Light */}
                <div className="id-card-light" />

                <div className="id-card-inner">
                    {/* Header */}
                    <div className="id-card-header">
                        <img src={logo} className="id-card-logo" alt="CapAble Logo" />
                        <div className="id-card-label">RESUME BUILDER</div>
                    </div>

                    {/* Ring + Avatar */}
                    <div className="id-card-hero">
                        <div className="id-card-ring-container">
                            <svg width="120" height="120" className="id-card-svg-ring">
                                {/* Outer faint ring */}
                                <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(100,125,160,0.12)" strokeWidth="3" />
                                {/* Progress ring */}
                                <motion.circle
                                    cx="60" cy="60" r={radius}
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: offset }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="id-card-ring-progress"
                                />
                                {/* Tiny tick marks decorative */}
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
                                {animatedScore}<span className="id-card-score-percent">%</span>
                            </div>
                            <div className="id-card-score-label">CAPABILITY</div>
                        </div>
                    </div>

                    {/* Identity Details */}
                    <div className="id-card-identity">
                        <h2 className="id-card-name">{name}</h2>
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
                            <span className="id-card-stat-val">{projectCount}</span>
                            <span className="id-card-stat-lbl">PROJECTS<br/>&nbsp;</span>
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
