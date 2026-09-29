import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import {
    getOpenDrives, registerForDrive,
    checkEligibility, type PlacementDrive, type EligibilityResult,
} from '../../services/eligibilityService';
import { getCapabilities } from '../../services/profileService';
import type { UserCapability } from '../../services/profileService';
import {
    Briefcase, CheckCircle2, XCircle, AlertTriangle, Calendar,
    MapPin, IndianRupee, Clock, Loader2, Trophy, ChevronRight,
    Users, Building2, Award
} from 'lucide-react';
import './PlacementDrivesPage.css';

const PASS_COLOR = '#10b981';
const FAIL_COLOR = '#ef4444';
const WARN_COLOR = '#f59e0b';

function daysLeft(deadline: string) {
    const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return d;
}

export default function PlacementDrivesPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { dbUid, profile } = useAuth();

    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, EligibilityResult>>({});
    const [registered, setRegistered] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<string | null>(null);

    const instCode = profile?.institutionCode || '';

    useEffect(() => {
        if (!dbUid || !instCode) return;
        Promise.all([
            getOpenDrives(instCode),
            getCapabilities(dbUid),
        ]).then(([d, caps]) => {
            setDrives(d);
            setCapabilities(caps);
            // Pre-compute eligibility for each drive
            const r: Record<string, EligibilityResult> = {};
            d.forEach(drive => {
                r[drive.id!] = checkEligibility(
                    {
                        cgpa: (profile as any)?.cgpa,
                        branch: (profile as any)?.branch,
                        backlogs: (profile as any)?.backlogs ?? 0,
                        graduationYear: (profile as any)?.graduationYear,
                        skills: caps.map(c => c.skill),
                        attendance: (profile as any)?.attendance,
                    },
                    drive.eligibility,
                );
            });
            setResults(r);
        }).finally(() => setLoading(false));
    }, [dbUid, instCode]);

    const handleRegister = async (drive: PlacementDrive) => {
        if (!dbUid || !profile || registering) return;
        setRegistering(drive.id!);
        try {
            const result = await registerForDrive(
                drive.id!,
                {
                    uid: dbUid,
                    name: profile.name,
                    email: profile.email,
                    cgpa: (profile as any)?.cgpa,
                    branch: (profile as any)?.branch,
                    backlogs: (profile as any)?.backlogs ?? 0,
                    graduationYear: (profile as any)?.graduationYear,
                    skills: capabilities.map(c => c.skill),
                },
                drive.eligibility,
            );
            setResults(prev => ({ ...prev, [drive.id!]: result }));
            setRegistered(prev => new Set([...prev, drive.id!]));
        } finally {
            setRegistering(null);
        }
    };

    const eligible = useMemo(() => drives.filter(d => results[d.id!]?.eligible !== false), [drives, results]);
    const ineligible = useMemo(() => drives.filter(d => results[d.id!]?.eligible === false), [drives, results]);

    if (!instCode) {
        return (
            <div className="pd-page">
                {!isEmbedded && <FloatingNavbar variant="candidate" />}
                <div className="pd-empty">
                    <Building2 size={48} color="#e2e8f0" />
                    <h3>No Institution Linked</h3>
                    <p>Your account is not linked to an institution. Ask your placement cell to invite you.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pd-page" style={isEmbedded ? { background: 'transparent' } : {}}>
            {!isEmbedded && <FloatingNavbar variant="candidate" />
            }
            <div className="pd-content">
                <motion.header className="pd-header" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1>Placement Drives</h1>
                        <p>Active drives from your placement cell — eligibility checked automatically</p>
                    </div>
                    <div className="pd-stats-row">
                        <div className="pd-stat pd-stat--green">
                            <CheckCircle2 size={16} /> <span>{eligible.length} Eligible</span>
                        </div>
                        <div className="pd-stat pd-stat--red">
                            <XCircle size={16} /> <span>{ineligible.length} Ineligible</span>
                        </div>
                    </div>
                </motion.header>

                {loading ? (
                    <div className="pd-loading"><Loader2 size={32} className="spin" /></div>
                ) : drives.length === 0 ? (
                    <div className="pd-empty">
                        <Trophy size={48} color="#e2e8f0" />
                        <h3>No Active Drives</h3>
                        <p>Your placement cell hasn't published any open drives yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="pd-list">
                        {drives.map((drive, i) => {
                            const result = results[drive.id!];
                            const isEligible = result?.eligible !== false;
                            const days = daysLeft(drive.deadline);
                            const isReg = registered.has(drive.id!);
                            const isExpanded = expanded === drive.id;

                            return (
                                <motion.div
                                    key={drive.id}
                                    className={`pd-card ${isEligible ? 'pd-card--eligible' : 'pd-card--ineligible'}`}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    layout
                                >
                                    <div className="pd-card-top">
                                        <div className="pd-card-badge" style={{ background: isEligible ? `${PASS_COLOR}18` : `${FAIL_COLOR}18`, color: isEligible ? PASS_COLOR : FAIL_COLOR }}>
                                            {isEligible
                                                ? <><CheckCircle2 size={12} /> Eligible</>
                                                : <><XCircle size={12} /> Ineligible</>
                                            }
                                        </div>
                                        {days <= 3 && days >= 0 && (
                                            <div className="pd-card-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                                                <Clock size={12} /> {days === 0 ? 'Last Day!' : `${days}d left`}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pd-card-body">
                                        <div className="pd-card-left">
                                            <div className="pd-company-logo">
                                                {drive.company.charAt(0)}
                                            </div>
                                            <div>
                                                <h2 className="pd-role-title">{drive.roleTitle}</h2>
                                                <p className="pd-company">{drive.company}</p>
                                                <div className="pd-meta">
                                                    {drive.package && <span><IndianRupee size={12} /> {drive.package}</span>}
                                                    {drive.location && <span><MapPin size={12} /> {drive.location}</span>}
                                                    {drive.eligibility?.minCGPA !== undefined && <span><Award size={12} /> CGPA &gt; {drive.eligibility.minCGPA}</span>}
                                                    <span><Calendar size={12} /> Deadline: {new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pd-card-actions">
                                            <button
                                                className="pd-expand-btn"
                                                onClick={() => setExpanded(isExpanded ? null : drive.id!)}
                                            >
                                                {isExpanded ? 'Hide Details' : 'View Criteria'} <ChevronRight size={14} className={isExpanded ? 'rotated' : ''} />
                                            </button>
                                            {isEligible && (
                                                <button
                                                    className={`pd-apply-btn ${isReg ? 'applied' : ''}`}
                                                    onClick={() => !isReg && handleRegister(drive)}
                                                    disabled={isReg || registering === drive.id}
                                                >
                                                    {registering === drive.id
                                                        ? <><Loader2 size={14} className="spin" /> Registering…</>
                                                        : isReg
                                                        ? <><CheckCircle2 size={14} /> Registered</>
                                                        : <>Register <ChevronRight size={14} /></>
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Eligibility details panel */}
                                    <AnimatePresence>
                                        {isExpanded && result && (
                                            <motion.div
                                                className="pd-criteria-panel"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <div className="pd-criteria-grid">
                                                    {result.passedChecks.map((check, i) => (
                                                        <div key={i} className="pd-check pd-check--pass">
                                                            <CheckCircle2 size={13} color={PASS_COLOR} />
                                                            <span>{check}</span>
                                                        </div>
                                                    ))}
                                                    {result.reasons.map((reason, i) => (
                                                        <div key={i} className="pd-check pd-check--fail">
                                                            <XCircle size={13} color={FAIL_COLOR} />
                                                            <span>{reason}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {drive.description && (
                                                    <p className="pd-drive-desc">{drive.description}</p>
                                                )}

                                                <div className="pd-criteria-raw">
                                                    <strong>Eligibility Criteria:</strong>
                                                    {drive.eligibility.minCGPA && <span>Min CGPA: {drive.eligibility.minCGPA}</span>}
                                                    {drive.eligibility.allowedBranches?.length && <span>Branches: {drive.eligibility.allowedBranches.join(', ')}</span>}
                                                    {drive.eligibility.maxBacklogs !== undefined && <span>Max Backlogs: {drive.eligibility.maxBacklogs}</span>}
                                                    {drive.eligibility.graduationYear && <span>Batch: {drive.eligibility.graduationYear}</span>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
