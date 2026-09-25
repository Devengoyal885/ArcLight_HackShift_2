import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavbar } from "../../components/navigation/FloatingNavbar";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    getCandidatesByInstitution,
    getLearningPath,
    getCapabilities,
    getApplications,
    endorseCandidate,
} from "../../services/profileService";
import type { UserProfile, LearningResource, UserCapability } from "../../services/profileService";
import { fetchFacultyOpportunities } from "../../services/facultyOpportunityService";
import type { FacultyOpportunity } from "../../services/facultyOpportunityService";
import {
    Users, GraduationCap, Loader2, AlertTriangle, RotateCcw,
    BookOpen, Target, Briefcase, ChevronRight, Search,
    CheckCircle2, AlertCircle, Building2, ExternalLink, FlaskConical,
    BookMarked, Lightbulb, Handshake, Tag, MapPin, Clock,
} from "lucide-react";
import "./FacultyDashboard.css";

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
}

interface StudentSummary {
    profile: UserProfile;
    learningTotal: number;
    learningCompleted: number;
    capabilityScore: number;
    capabilityCount: number;
    topSkills: string[];
    applicationCount: number;
    profileComplete: boolean;
}

const PAGE_SIZE = 20;

type FacultyTab = "students" | "fdp" | "internship" | "research" | "consultancy";

const TAB_META: { id: FacultyTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "students", label: "Students", icon: <Users size={15} />, color: "#2563eb" },
    { id: "fdp", label: "FDP", icon: <BookMarked size={15} />, color: "#7c3aed" },
    { id: "internship", label: "Internships", icon: <Briefcase size={15} />, color: "#10b981" },
    { id: "research", label: "Research", icon: <FlaskConical size={15} />, color: "#f59e0b" },
    { id: "consultancy", label: "Consultancy", icon: <Handshake size={15} />, color: "#ef4444" },
];

export default function FacultyDashboard() {
    const { user, profile } = useAuth();

    const displayName = profile?.name || user?.displayName || "Faculty";
    const firstName = displayName.split(" ")[0];
    const institutionCode = (profile as any)?.institutionCode || "";
    const department = (profile as any)?.department || "";
    const greeting = getGreeting();

    const [activeTab, setActiveTab] = useState<FacultyTab>("students");

    // ── Student data ──────────────────────────────────────────────────────────
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentsError, setStudentsError] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [expandedUid, setExpandedUid] = useState<string | null>(null);

    const handleEndorse = async (e: React.MouseEvent, candidateUid: string) => {
        e.stopPropagation();
        if (!user) return;
        try {
            await endorseCandidate(candidateUid, user.uid, displayName);
            setStudents(prev => prev.map(s => {
                if (s.profile.uid === candidateUid) {
                    const updatedEndorsements = [...(s.profile.endorsements || []), {
                        facultyUid: user.uid,
                        facultyName: displayName,
                        date: new Date().toISOString()
                    }];
                    return { ...s, profile: { ...s.profile, endorsements: updatedEndorsements } };
                }
                return s;
            }));
        } catch (err) {
            console.error("Failed to endorse", err);
        }
    };


    // ── Opportunity data ──────────────────────────────────────────────────────
    const [opportunities, setOpportunities] = useState<FacultyOpportunity[]>([]);
    const [oppLoading, setOppLoading] = useState(false);
    const [oppLoaded, setOppLoaded] = useState(false);

    const loadStudents = useCallback(async () => {
        if (!user) return;
        if (!institutionCode) { setStudentsLoading(false); setStudents([]); return; }
        setStudentsLoading(true);
        setStudentsError(false);
        try {
            // getCandidatesByInstitution now returns profiles where uid = {firebaseUid}_candidate
            const candidates = await getCandidatesByInstitution(institutionCode);
            const summaries = await Promise.all(
                candidates.map(async (candidate): Promise<StudentSummary> => {
                    // candidate.uid is already the scoped dbUid (e.g., "abc123_candidate")
                    const [learning, caps, apps] = await Promise.allSettled([
                        getLearningPath(candidate.uid),
                        getCapabilities(candidate.uid),
                        getApplications(candidate.uid),
                    ]);
                    const learningData: LearningResource[] = learning.status === "fulfilled" ? learning.value : [];
                    const capData: UserCapability[] = caps.status === "fulfilled" ? caps.value : [];
                    const appData = apps.status === "fulfilled" ? apps.value : [];

                    const completed = learningData.filter(r => r.completed).length;
                    const avgScore = capData.length > 0
                        ? Math.round(capData.reduce((s, c) => s + c.score, 0) / capData.length) : 0;
                    const topSkills = capData.sort((a, b) => b.score - a.score).slice(0, 3).map(c => c.skill);

                    return {
                        profile: candidate,
                        learningTotal: learningData.length,
                        learningCompleted: completed,
                        capabilityScore: avgScore,
                        capabilityCount: capData.length,
                        topSkills,
                        applicationCount: appData.length,
                        profileComplete: candidate.profileComplete ?? false,
                    };
                })
            );
            setStudents(summaries);
        } catch (e) {
            console.error(e); setStudentsError(true);
        } finally {
            setStudentsLoading(false);
        }
    }, [user, institutionCode]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    // Load opportunities lazily when user switches to those tabs
    useEffect(() => {
        if (activeTab === "students" || oppLoaded || oppLoading) return;
        setOppLoading(true);
        fetchFacultyOpportunities()
            .then(data => {
                setOpportunities(data);
                setOppLoaded(true);
            })
            .catch(err => console.error('[FacultyDashboard] opp load err', err))
            .finally(() => setOppLoading(false));
    }, [activeTab, oppLoaded, oppLoading]);

    const kpis = useMemo(() => ({
        total: students.length,
        active: students.filter(s => s.learningCompleted > 0).length,
        applied: students.filter(s => s.applicationCount > 0).length,
        profiled: students.filter(s => s.capabilityCount > 0).length,
    }), [students]);

    const signals = useMemo(() => {
        const sig: string[] = [];
        const noCaps = students.filter(s => s.capabilityCount === 0).length;
        const noLearning = students.filter(s => s.learningTotal === 0).length;
        const incomplete = students.filter(s => !s.profileComplete).length;
        if (noCaps > 0) sig.push(`${noCaps} student${noCaps > 1 ? "s" : ""} have no capability data yet.`);
        if (noLearning > 0) sig.push(`${noLearning} student${noLearning > 1 ? "s" : ""} have not started any learning path.`);
        if (incomplete > 0) sig.push(`${incomplete} student${incomplete > 1 ? "s" : ""} have incomplete profiles.`);
        return sig;
    }, [students]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return students;
        return students.filter(s =>
            s.profile.name?.toLowerCase().includes(q) ||
            s.profile.headline?.toLowerCase().includes(q) ||
            s.topSkills.some(sk => sk.toLowerCase().includes(q))
        );
    }, [students, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const getInitials = (name: string) => name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "U";
    const learningPct = (s: StudentSummary) => s.learningTotal > 0 ? Math.round((s.learningCompleted / s.learningTotal) * 100) : 0;

    // Filter opportunities by tab
    const filteredOpps = useMemo(() => {
        if (activeTab === "students") return [];
        return opportunities.filter(o => o.type === activeTab);
    }, [opportunities, activeTab]);

    const typeColor: Record<FacultyOpportunity["type"], string> = {
        fdp: "#7c3aed",
        internship: "#10b981",
        research: "#f59e0b",
        consultancy: "#ef4444",
    };
    const typeLabel: Record<FacultyOpportunity["type"], string> = {
        fdp: "FDP",
        internship: "Internship",
        research: "Research",
        consultancy: "Consultancy",
    };

    return (
        <div className="faculty-page">
            <FloatingNavbar variant="academician" />
            <main className="faculty-main">
                <motion.div className="faculty-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="faculty-header-text">
                        <p className="faculty-eyebrow">{greeting}, {firstName}</p>
                        <h1 className="faculty-title">Student Intelligence<br /><em>Dashboard</em></h1>
                        <p className="faculty-sub">
                            Monitor your students learning progress, capability profiles, and recruitment activity
                            {institutionCode && <> — <strong>{institutionCode}</strong>{department && `, ${department}`}</>}.
                        </p>
                    </div>
                    <div className="faculty-header-actions">
                        <button className="faculty-refresh-btn" onClick={loadStudents} title="Refresh data">
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </motion.div>

                {/* ── TABS ── */}
                <div className="faculty-tabs-bar">
                    {TAB_META.map(tab => (
                        <button
                            key={tab.id}
                            className={`faculty-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                            style={activeTab === tab.id ? { color: tab.color, borderBottomColor: tab.color } : {}}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ─────────────── STUDENTS TAB ─────────────── */}
                    {activeTab === "students" && (
                        <motion.div key="students" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {!studentsLoading && !institutionCode && (
                                <div className="faculty-empty">
                                    <Building2 size={40} color="#94a3b8" />
                                    <h3>No institution code found</h3>
                                    <p>Your profile does not have an institution code set. Please update your profile.</p>
                                </div>
                            )}

                            {studentsLoading && (
                                <div className="faculty-loading">
                                    <Loader2 size={24} className="faculty-spin" />
                                    <p>Loading student intelligence...</p>
                                </div>
                            )}

                            {studentsError && !studentsLoading && (
                                <div className="faculty-error-state">
                                    <AlertTriangle size={28} color="#f59e0b" />
                                    <p>Could not load student data.</p>
                                    <button className="faculty-retry-btn" onClick={loadStudents}><RotateCcw size={14} /> Retry</button>
                                </div>
                            )}

                            {!studentsLoading && !studentsError && institutionCode && (
                                <>
                                    <div className="faculty-kpi-strip">
                                        {[
                                            { label: "Total Students", val: kpis.total, icon: <Users size={18} color="#2563eb" />, bg: "#eff6ff" },
                                            { label: "Active Learners", val: kpis.active, icon: <BookOpen size={18} color="#10b981" />, bg: "#f0fdf4" },
                                            { label: "Capability Profiled", val: kpis.profiled, icon: <Target size={18} color="#7c3aed" />, bg: "#faf5ff" },
                                            { label: "Applied to Jobs", val: kpis.applied, icon: <Briefcase size={18} color="#f59e0b" />, bg: "#fff7ed" },
                                        ].map((k, i) => (
                                            <motion.div key={k.label} className="faculty-kpi" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                                                <div className="faculty-kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
                                                <div>
                                                    <span className="faculty-kpi-num">{k.val}</span>
                                                    <span className="faculty-kpi-label">{k.label}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {signals.length > 0 && (
                                        <div className="faculty-signals">
                                            <div className="faculty-signals-header"><AlertCircle size={16} color="#d97706" /><h4>Attention Required</h4></div>
                                            <ul className="faculty-signals-list">{signals.map((sig, i) => <li key={i}>{sig}</li>)}</ul>
                                        </div>
                                    )}

                                    {students.length === 0 && (
                                        <div className="faculty-empty">
                                            <GraduationCap size={40} color="#94a3b8" />
                                            <h3>No students found</h3>
                                            <p>No candidates are linked to institution code <strong>{institutionCode}</strong> yet.</p>
                                            <p className="faculty-empty-sub">Students need to enter this code when registering.</p>
                                        </div>
                                    )}

                                    {students.length > 0 && (
                                        <>
                                            <div className="faculty-search-bar">
                                                <Search size={16} className="faculty-search-icon" />
                                                <input type="text" placeholder="Search by name, headline or skill..." value={search}
                                                    onChange={e => { setSearch(e.target.value); setPage(0); }} className="faculty-search-input" />
                                                <span className="faculty-search-count">{filtered.length} students</span>
                                            </div>

                                            <div className="faculty-student-list">
                                                {paginated.map((student, idx) => {
                                                    const pct = learningPct(student);
                                                    const initials = getInitials(student.profile.name || "U");
                                                    const isExpanded = expandedUid === student.profile.uid;

                                                    return (
                                                        <motion.div key={student.profile.uid}
                                                            className={`faculty-student-card ${isExpanded ? "faculty-student-card--expanded" : ""}`}
                                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                                        >
                                                            <div className="faculty-student-row" onClick={() => setExpandedUid(isExpanded ? null : student.profile.uid)}>
                                                                <div className="faculty-student-avatar">
                                                                    {student.profile.avatar ? <img src={student.profile.avatar} alt={initials} /> : <span>{initials}</span>}
                                                                    <div className={`faculty-avatar-dot ${student.profileComplete ? "faculty-avatar-dot--green" : "faculty-avatar-dot--amber"}`} />
                                                                </div>
                                                                <div className="faculty-student-identity">
                                                                    <h4 className="faculty-student-name">{student.profile.name || "Unnamed"}</h4>
                                                                    <p className="faculty-student-headline">{student.profile.headline || "No headline yet"}</p>
                                                                    <div className="faculty-student-skills">
                                                                        {student.topSkills.map(sk => <span key={sk} className="faculty-skill-chip">{sk}</span>)}
                                                                        {student.topSkills.length === 0 && <span className="faculty-skill-chip faculty-skill-chip--empty">No capabilities yet</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="faculty-student-stat">
                                                                    <div className="faculty-stat-label"><BookOpen size={13} />Learning</div>
                                                                    <div className="faculty-progress-bar">
                                                                        <div className="faculty-progress-fill" style={{ width: `${pct}%`, background: pct >= 75 ? "#10b981" : pct >= 40 ? "#2563eb" : "#f59e0b" }} />
                                                                    </div>
                                                                    <span className="faculty-stat-val">{pct}%</span>
                                                                    <span className="faculty-stat-sub">{student.learningCompleted}/{student.learningTotal}</span>
                                                                </div>
                                                                <div className="faculty-student-stat">
                                                                    <div className="faculty-stat-label"><Target size={13} />Capability</div>
                                                                    <div className={`faculty-score-badge ${student.capabilityScore >= 70 ? "faculty-score-badge--green" : student.capabilityScore >= 40 ? "faculty-score-badge--blue" : student.capabilityScore > 0 ? "faculty-score-badge--amber" : "faculty-score-badge--gray"}`}>
                                                                        {student.capabilityScore > 0 ? `${student.capabilityScore}%` : "—"}
                                                                    </div>
                                                                    <span className="faculty-stat-sub">{student.capabilityCount} skills</span>
                                                                </div>
                                                                <div className="faculty-student-stat">
                                                                    <div className="faculty-stat-label"><Briefcase size={13} />Applications</div>
                                                                    <span className="faculty-kpi-num" style={{ fontSize: 20 }}>{student.applicationCount}</span>
                                                                    <span className="faculty-stat-sub">applied</span>
                                                                </div>
                                                                <div className="faculty-student-actions">
                                                                    {student.profile.endorsements?.some((e: any) => e.facultyUid === user?.uid) ? (
                                                                        <span className="faculty-endorsed-badge"><CheckCircle2 size={14}/> Endorsed</span>
                                                                    ) : (
                                                                        <button className="faculty-endorse-btn" onClick={(e) => handleEndorse(e, student.profile.uid)}>
                                                                            <CheckCircle2 size={14} /> Endorse
                                                                        </button>
                                                                    )}
                                                                    <Link to={`/profile/${student.profile.uid}`} className="faculty-view-btn" onClick={e => e.stopPropagation()}>
                                                                        View Profile <ChevronRight size={14} />
                                                                    </Link>
                                                                </div>
                                                            </div>

                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.div className="faculty-student-detail" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                                        <div className="faculty-detail-grid">
                                                                            <div className="faculty-detail-item"><span className="faculty-detail-label">Email</span><span className="faculty-detail-val">{student.profile.email || "—"}</span></div>
                                                                            <div className="faculty-detail-item"><span className="faculty-detail-label">Location</span><span className="faculty-detail-val">{student.profile.location || "—"}</span></div>
                                                                            <div className="faculty-detail-item"><span className="faculty-detail-label">Profile</span>
                                                                                <span className={`faculty-detail-val ${student.profileComplete ? "faculty-detail-val--green" : "faculty-detail-val--amber"}`}>
                                                                                    {student.profileComplete ? <><CheckCircle2 size={13} />Complete</> : <><AlertCircle size={13} />Incomplete</>}
                                                                                </span>
                                                                            </div>
                                                                            <div className="faculty-detail-item"><span className="faculty-detail-label">Top Skills</span><span className="faculty-detail-val">{student.topSkills.length > 0 ? student.topSkills.join(", ") : "No capability data"}</span></div>
                                                                        </div>
                                                                        <div className="faculty-detail-actions">
                                                                            <Link to={`/profile/${student.profile.uid}`} className="faculty-view-btn faculty-view-btn--primary">
                                                                                Open Full Profile <ChevronRight size={14} />
                                                                            </Link>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            {totalPages > 1 && (
                                                <div className="faculty-pagination">
                                                    <button className="faculty-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
                                                    <span className="faculty-page-info">Page {page + 1} of {totalPages}</span>
                                                    <button className="faculty-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ─────────────── OPPORTUNITY TABS (FDP / Internship / Research / Consultancy) ─────────────── */}
                    {activeTab !== "students" && (
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="faculty-opp-header">
                                <div>
                                    <h2 className="faculty-opp-title">
                                        {activeTab === "fdp" && <><BookMarked size={20} /> Faculty Development Programmes</>}
                                        {activeTab === "internship" && <><Briefcase size={20} /> Academic Internships</>}
                                        {activeTab === "research" && <><FlaskConical size={20} /> Research Opportunities</>}
                                        {activeTab === "consultancy" && <><Handshake size={20} /> Consultancy Projects</>}
                                    </h2>
                                    <p className="faculty-opp-sub">
                                        Real opportunities fetched from AICTE, NPTEL, DST-SERB, Remotive and other academic platforms.
                                    </p>
                                </div>
                            </div>

                            {oppLoading && (
                                <div className="faculty-loading">
                                    <Loader2 size={24} className="faculty-spin" />
                                    <p>Fetching opportunities...</p>
                                </div>
                            )}

                            {!oppLoading && filteredOpps.length === 0 && (
                                <div className="faculty-empty">
                                    <Lightbulb size={36} color="#94a3b8" />
                                    <h3>No {typeLabel[activeTab as FacultyOpportunity["type"]]} opportunities found</h3>
                                    <p>Check back later or try refreshing.</p>
                                </div>
                            )}

                            <div className="faculty-opp-grid">
                                {filteredOpps.map((opp, idx) => (
                                    <motion.div
                                        key={opp.id}
                                        className="faculty-opp-card"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                    >
                                        <div className="faculty-opp-card-header">
                                            <span
                                                className="faculty-opp-type-badge"
                                                style={{ background: `${typeColor[opp.type]}18`, color: typeColor[opp.type] }}
                                            >
                                                {typeLabel[opp.type]}
                                            </span>
                                            {opp.remote && <span className="faculty-opp-remote-badge">🌐 Remote</span>}
                                        </div>

                                        <h3 className="faculty-opp-card-title">{opp.title}</h3>
                                        <p className="faculty-opp-card-org">{opp.organization}</p>

                                        <div className="faculty-opp-meta">
                                            {opp.location && <span><MapPin size={12} /> {opp.location}</span>}
                                            {opp.duration && <span><Clock size={12} /> {opp.duration}</span>}
                                            {opp.stipend && <span style={{ color: "#10b981", fontWeight: 600 }}>₹ {opp.stipend}</span>}
                                        </div>

                                        <p className="faculty-opp-desc">{opp.description}</p>

                                        <div className="faculty-opp-tags">
                                            {opp.tags.slice(0, 4).map(tag => (
                                                <span key={tag} className="faculty-opp-tag">
                                                    <Tag size={10} /> {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="faculty-opp-footer">
                                            <span className="faculty-opp-source">via {opp.source}</span>
                                            <a
                                                href={opp.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="faculty-opp-apply-btn"
                                                style={{ background: typeColor[opp.type] }}
                                            >
                                                Apply / Learn More <ExternalLink size={13} />
                                            </a>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
