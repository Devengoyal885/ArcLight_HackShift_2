/**
 * ProfileCompletionWidget.tsx
 * ─────────────────────────────────────────────────────
 * Displays a profile completion score with itemized
 * checklist and actionable nudges for the candidate dashboard.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ChevronRight, Sparkles } from 'lucide-react';
import './ProfileCompletionWidget.css';

interface CompletionItem {
    label: string;
    done: boolean;
    points: number;
    link: string;
    linkLabel: string;
}

interface Props {
    profile: any;
    capabilities: any[];
    projects: any[];
    certifications?: any[];
}

export function ProfileCompletionWidget({ profile, capabilities, projects, certifications = [] }: Props) {
    const items: CompletionItem[] = useMemo(() => [
        {
            label: 'Add your full name & contact',
            done: !!(profile?.name && profile?.email),
            points: 10,
            link: '/candidate',
            linkLabel: 'Edit Profile',
        },
        {
            label: 'Upload a profile photo',
            done: !!(profile?.avatar || profile?.photoURL),
            points: 5,
            link: '/candidate',
            linkLabel: 'Add Photo',
        },
        {
            label: 'Set your career target role',
            done: !!(profile?.targetRole),
            points: 15,
            link: '/candidate/career',
            linkLabel: 'Set Target',
        },
        {
            label: 'Add 3+ skills to your profile',
            done: capabilities.length >= 3,
            points: 15,
            link: '/candidate/career',
            linkLabel: 'Add Skills',
        },
        {
            label: 'Add a project to your portfolio',
            done: projects.length >= 1,
            points: 15,
            link: '/candidate/portfolio',
            linkLabel: 'Add Project',
        },
        {
            label: 'Build or upload your resume',
            done: !!(profile?.resumeUrl || profile?.hasResume),
            points: 15,
            link: '/candidate/resume-builder',
            linkLabel: 'Build Resume',
        },
        {
            label: 'Run the AI Aptitude Test',
            done: !!(profile?.lastAptitudeScore),
            points: 10,
            link: '/candidate/aptitude',
            linkLabel: 'Take Test',
        },
        {
            label: 'Add a certification',
            done: certifications.length >= 1,
            points: 10,
            link: '/candidate/portfolio',
            linkLabel: 'Add Cert',
        },
        {
            label: 'Connect your GitHub account',
            done: !!(profile?.github),
            points: 5,
            link: '/candidate',
            linkLabel: 'Connect GitHub',
        },
    ], [profile, capabilities, projects, certifications]);

    const totalPoints = items.reduce((s, i) => s + i.points, 0);
    const earnedPoints = items.filter(i => i.done).reduce((s, i) => s + i.points, 0);
    const pct = Math.round((earnedPoints / totalPoints) * 100);

    const incomplete = items.filter(i => !i.done);
    const nextAction = incomplete[0];

    const scoreColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
    const scoreLabel = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Fair' : 'Needs Work';

    return (
        <div className="pcw-widget">
            {/* Score ring */}
            <div className="pcw-score-row">
                <div className="pcw-ring-wrap">
                    <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                        <motion.circle
                            cx="36" cy="36" r="30"
                            fill="none"
                            stroke={scoreColor}
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 30}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - pct / 100) }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            transform="rotate(-90 36 36)"
                        />
                    </svg>
                    <div className="pcw-ring-center">
                        <span className="pcw-pct" style={{ color: scoreColor }}>{pct}%</span>
                    </div>
                </div>
                <div className="pcw-score-info">
                    <div className="pcw-score-label" style={{ color: scoreColor }}>{scoreLabel}</div>
                    <div className="pcw-score-sub">Profile Completeness</div>
                    <div className="pcw-score-pts">{earnedPoints}/{totalPoints} points</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="pcw-bar-wrap">
                <motion.div
                    className="pcw-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ background: scoreColor }}
                />
            </div>

            {/* Next action nudge */}
            {nextAction && (
                <Link to={nextAction.link} className="pcw-nudge">
                    <Sparkles size={14} color="#f59e0b" />
                    <span>Next: <strong>{nextAction.label}</strong></span>
                    <div className="pcw-nudge-pts">+{nextAction.points} pts</div>
                    <ChevronRight size={14} />
                </Link>
            )}

            {/* Checklist */}
            <div className="pcw-checklist">
                {items.map((item, i) => (
                    <div key={i} className={`pcw-item ${item.done ? 'done' : ''}`}>
                        {item.done
                            ? <CheckCircle2 size={14} color="#10b981" />
                            : <Circle size={14} color="#cbd5e1" />
                        }
                        <span className="pcw-item-label">{item.label}</span>
                        <span className="pcw-item-pts">+{item.points}</span>
                        {!item.done && (
                            <Link to={item.link} className="pcw-item-link">{item.linkLabel}</Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
