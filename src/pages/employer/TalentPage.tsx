import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNavbar } from "../../components/navigation/FloatingNavbar";
import { useAuth } from "../../context/AuthContext";
import {
    getPostedRoles, getApplicationsForRole, updateApplicationStatus,
    getAllCandidates, shortlistCandidate, removeFromShortlist, getShortlist,
    type PostedRole, type RoleApplication
} from "../../services/employerService";
import { Link } from "react-router-dom";
import {
    Eye, Users, Loader2, Briefcase, Search, Globe, Filter,
    AlertTriangle, RotateCcw, CheckCircle2, XCircle,
    SlidersHorizontal, X, Star, GitCompare
} from "lucide-react";
import "./TalentPage.css";

type ApplicationStatus = RoleApplication["status"];
type AppWithRole = RoleApplication & { roleTitle: string; roleId: string };

const ALL_STATUSES: ApplicationStatus[] = [
    "Applied","Screening","OA Pending","Interview Scheduled",
    "Offer Extended","Placed","OA Rejected","Rejected"
];
const STATUS_COLORS: Record<ApplicationStatus, string> = {
    "Applied":"#2563eb","Screening":"#f59e0b","OA Pending":"#7c3aed",
    "Interview Scheduled":"#0891b2","Offer Extended":"#16a34a","Placed":"#059669","Rejected":"#ef4444","OA Rejected":"#dc2626",
};
const STATUS_BG: Record<ApplicationStatus, string> = {
    "Applied":"#eff6ff","Screening":"#fef3c7","OA Pending":"#f3e8ff",
    "Interview Scheduled":"#ecfeff","Offer Extended":"#f0fdf4","Placed":"#dcfce7","Rejected":"#fef2f2","OA Rejected":"#fef2f2",
};

function getInitials(name: string): string {
    return (name || "?").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
}
function timeAgo(ts: any): string {
    if (!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds*1000) : new Date(ts);
    const diff = Math.floor((Date.now()-d.getTime())/1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff/60)+"m ago";
    if (diff < 86400) return Math.floor(diff/3600)+"h ago";
    return Math.floor(diff/86400)+"d ago";
}


// ─── Comparison Modal ──────────────────────────────────────────────────────────
function CompareModal({ apps, onClose }: { apps: AppWithRole[]; onClose: () => void }) {
    if (apps.length < 2) return null;
    const [a, b] = apps;
    return (
        <div className="talent-modal-overlay" onClick={onClose}>
            <div className="talent-modal" onClick={e => e.stopPropagation()}>
                <div className="talent-modal-header">
                    <h2>Candidate Comparison</h2>
                    <button className="talent-modal-close" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="talent-compare-grid">
                    <div className="talent-compare-col talent-compare-col--header" />
                    <div className="talent-compare-col">
                        <div className="talent-compare-avatar">{getInitials(a.candidateName)}</div>
                        <p className="talent-compare-name">{a.candidateName}</p>
                        <p className="talent-compare-headline">{a.candidateHeadline || a.candidateEmail}</p>
                    </div>
                    <div className="talent-compare-col">
                        <div className="talent-compare-avatar" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>{getInitials(b.candidateName)}</div>
                        <p className="talent-compare-name">{b.candidateName}</p>
                        <p className="talent-compare-headline">{b.candidateHeadline || b.candidateEmail}</p>
                    </div>
                </div>
                <div className="talent-compare-rows">
                    <div className="talent-compare-row">
                        <span className="talent-compare-label">Applied For</span>
                        <span className="talent-compare-val">{a.roleTitle}</span>
                        <span className="talent-compare-val">{b.roleTitle}</span>
                    </div>
                    <div className="talent-compare-row">
                        <span className="talent-compare-label">Current Stage</span>
                        <span className="talent-compare-val">
                            <span className="talent-status-pill" style={{ background: STATUS_BG[a.status]||"#f1f5f9", color: STATUS_COLORS[a.status]||"#64748b" }}>{a.status}</span>
                        </span>
                        <span className="talent-compare-val">
                            <span className="talent-status-pill" style={{ background: STATUS_BG[b.status]||"#f1f5f9", color: STATUS_COLORS[b.status]||"#64748b" }}>{b.status}</span>
                        </span>
                    </div>
                    <div className="talent-compare-row">
                        <span className="talent-compare-label">Capability Match</span>
                        <span className="talent-compare-val">{a.capabilityMatch !== undefined ? a.capabilityMatch+"%" : "—"}</span>
                        <span className="talent-compare-val">{b.capabilityMatch !== undefined ? b.capabilityMatch+"%" : "—"}</span>
                    </div>
                    <div className="talent-compare-row">
                        <span className="talent-compare-label">Applied</span>
                        <span className="talent-compare-val">{timeAgo((a as any).appliedAt) || "—"}</span>
                        <span className="talent-compare-val">{timeAgo((b as any).appliedAt) || "—"}</span>
                    </div>
                </div>
                <p className="talent-compare-note">Recruiter makes the final decision. CapAble shows evidence; it does not rank candidates.</p>
                <div className="talent-compare-actions">
                    <Link to={"/profile/"+a.candidateUid} state={{ applicationId: a.id, roleId: a.roleId, status: a.status }} className="talent-appl-btn talent-appl-btn--primary" onClick={onClose}><Eye size={13}/> View {a.candidateName.split(" ")[0]}</Link>
                    <Link to={"/profile/"+b.candidateUid} state={{ applicationId: b.id, roleId: b.roleId, status: b.status }} className="talent-appl-btn talent-appl-btn--primary" style={{ background:"#7c3aed" }} onClick={onClose}><Eye size={13}/> View {b.candidateName.split(" ")[0]}</Link>
                </div>
            </div>
        </div>
    );
}


export default function TalentPage() {
    const { user, dbUid } = useAuth();
    const [activeTab, setActiveTab] = useState<"applicants" | "global">("applicants");
    const [roles, setRoles] = useState<PostedRole[]>([]);
    const [allApps, setAllApps] = useState<AppWithRole[]>([]);
    const [appsPhase, setAppsPhase] = useState<"loading" | "success" | "error">("loading");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [globalCandidates, setGlobalCandidates] = useState<any[]>([]);
    const [globalPhase, setGlobalPhase] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [globalSearch, setGlobalSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [shortlistSet, setShortlistSet] = useState<Set<string>>(new Set());
    const [shortlistLoading, setShortlistLoading] = useState<string | null>(null);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);

    const loadApplicants = useCallback(async () => {
        if (!user) return;
        setAppsPhase("loading");
        try {
            const [fetchedRoles, sl] = await Promise.all([
                getPostedRoles(dbUid!),
                getShortlist(dbUid!).catch(() => [])
            ]);
            setRoles(fetchedRoles);
            setShortlistSet(new Set(sl.map(s => s.candidateUid)));
            const results = await Promise.allSettled(
                fetchedRoles.filter(r => r.id).map(async r => {
                    const apps = await getApplicationsForRole(r.id!);
                    return apps.map(a => ({ ...a, roleTitle: r.title, roleId: r.id! } as AppWithRole));
                })
            );
            const merged: AppWithRole[] = [];
            results.forEach(res => { if (res.status === "fulfilled") merged.push(...res.value); });
            merged.sort((a: any, b: any) => (b.appliedAt?.seconds||0)-(a.appliedAt?.seconds||0));
            setAllApps(merged);
            setAppsPhase("success");
        } catch { setAppsPhase("error"); }
    }, [user]);

    const loadGlobal = useCallback(async () => {
        if (globalPhase === "success" || globalPhase === "loading") return;
        setGlobalPhase("loading");
        try {
            const candidates = await getAllCandidates();
            setGlobalCandidates(candidates);
            setGlobalPhase("success");
        } catch { setGlobalPhase("error"); }
    }, [globalPhase]);

    useEffect(() => { loadApplicants(); }, [loadApplicants]);
    useEffect(() => { if (activeTab === "global") loadGlobal(); }, [activeTab, loadGlobal]);

    const handleStatusChange = async (app: AppWithRole, newStatus: ApplicationStatus) => {
        const key = app.roleId+"_"+app.id;
        setUpdatingId(key);
        try {
            await updateApplicationStatus(app.roleId, app.id!, app.candidateUid, newStatus);
            setAllApps(prev => prev.map(a => a.id===app.id && a.roleId===app.roleId ? {...a, status: newStatus} : a));
        } catch(e) { console.error(e); }
        finally { setUpdatingId(null); }
    };

    const handleShortlist = async (app: AppWithRole) => {
        if (!user) return;
        const key = app.candidateUid;
        setShortlistLoading(key);
        try {
            if (shortlistSet.has(key)) {
                await removeFromShortlist(dbUid!, key);
                setShortlistSet(prev => { const n = new Set(prev); n.delete(key); return n; });
            } else {
                await shortlistCandidate(dbUid!, { candidateUid: key, candidateName: app.candidateName, candidateHeadline: app.candidateHeadline, roleId: app.roleId, roleTitle: app.roleTitle });
                setShortlistSet(prev => new Set(prev).add(key));
            }
        } catch(e) { console.error(e); }
        finally { setShortlistLoading(null); }
    };

    const toggleCompare = (appId: string) => {
        setSelectedForCompare(prev => {
            if (prev.includes(appId)) return prev.filter(x => x !== appId);
            if (prev.length >= 2) return prev;
            return [...prev, appId];
        });
    };

    const activeRolesCount = roles.filter(r => r.status === "active").length;
    const needsReview = allApps.filter(a => a.status === "Applied").length;

    const filteredApps = useMemo(() => allApps.filter(app => {
        const matchRole = filterRole === "all" || app.roleId === filterRole;
        const matchStatus = filterStatus === "all" || app.status === filterStatus;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || (app.candidateName||"").toLowerCase().includes(q) || (app.candidateHeadline||"").toLowerCase().includes(q) || (app.candidateEmail||"").toLowerCase().includes(q) || (app.roleTitle||"").toLowerCase().includes(q);
        return matchRole && matchStatus && matchSearch;
    }), [allApps, filterRole, filterStatus, searchQuery]);

    const filteredGlobal = useMemo(() => {
        const q = globalSearch.toLowerCase();
        if (!q) return globalCandidates;
        return globalCandidates.filter(c => (c.name||"").toLowerCase().includes(q)||(c.headline||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q)||(c.skills||[]).some((s:string)=>s.toLowerCase().includes(q)));
    }, [globalCandidates, globalSearch]);

    const compareApps = useMemo(() => selectedForCompare.map(id => allApps.find(a => a.id===id)!).filter(Boolean), [selectedForCompare, allApps]);


    return (
        <div className="talent-page">
            <FloatingNavbar variant="employer" />
            {showCompare && compareApps.length === 2 && <CompareModal apps={compareApps} onClose={() => setShowCompare(false)} />}
            <main className="talent-main">
                <motion.div className="talent-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="talent-eyebrow">TALENT INTELLIGENCE</p>
                    <h1 className="talent-title">Real applicants,<br /><em>verified capability.</em></h1>
                    <p className="talent-sub">Discover top talent through verified capabilities, evidence, and assessments.</p>
                </motion.div>

                <div className="talent-tabs">
                    <button className={"talent-tab "+(activeTab==="applicants"?"active":"")} onClick={() => setActiveTab("applicants")}>
                        <Users size={15}/> Your Applicants
                        {appsPhase==="success" && allApps.length>0 && <span className="talent-tab-count">{allApps.length}</span>}
                    </button>
                    <button className={"talent-tab "+(activeTab==="global"?"active":"")} onClick={() => setActiveTab("global")}>
                        <Globe size={15}/> Global Talent Pool
                    </button>
                </div>

                {activeTab === "applicants" && (
                    <AnimatePresence mode="wait">
                        <motion.div key="applicants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {appsPhase==="success" && (
                                <div className="talent-summary-strip">
                                    <div className="talent-summary-stat"><span className="talent-summary-num">{activeRolesCount}</span><span className="talent-summary-label">Active Roles</span></div>
                                    <div className="talent-summary-stat"><span className="talent-summary-num">{allApps.length}</span><span className="talent-summary-label">Total Applicants</span></div>
                                    <div className="talent-summary-stat"><span className="talent-summary-num" style={{ color: needsReview>0?"#d97706":undefined }}>{needsReview}</span><span className="talent-summary-label">Needs Review</span></div>
                                    <div className="talent-summary-stat"><span className="talent-summary-num">{shortlistSet.size}</span><span className="talent-summary-label">Shortlisted</span></div>
                                    <div className="talent-summary-stat"><span className="talent-summary-num">{allApps.filter(a=>a.status==="Interview Scheduled").length}</span><span className="talent-summary-label">In Interview</span></div>
                                </div>
                            )}

                            {appsPhase==="success" && allApps.length>0 && (
                                <div className="talent-search-filter-bar">
                                    <div className="talent-search-input-wrap">
                                        <Search size={15} color="#94a3b8"/>
                                        <input type="text" placeholder="Search by name, email, or role..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
                                        {searchQuery && <button className="talent-search-clear" onClick={()=>setSearchQuery("")}><X size={13}/></button>}
                                    </div>
                                    <button className={"talent-filter-toggle "+(showFilters?"active":"")} onClick={()=>setShowFilters(f=>!f)}>
                                        <SlidersHorizontal size={14}/> Filters
                                        {(filterRole!=="all"||filterStatus!=="all") && <span className="talent-filter-dot"/>}
                                    </button>
                                    {selectedForCompare.length>0 && (
                                        <button className="talent-compare-trigger" disabled={selectedForCompare.length<2} onClick={()=>setShowCompare(true)}>
                                            <GitCompare size={14}/> Compare {selectedForCompare.length===2?"Now":"(select 2)"}
                                        </button>
                                    )}
                                </div>
                            )}

                            <AnimatePresence>
                                {showFilters && appsPhase==="success" && (
                                    <motion.div className="talent-filter-panel" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}>
                                        <div className="talent-filter-row">
                                            <div className="talent-filter-group">
                                                <label>Opportunity</label>
                                                <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
                                                    <option value="all">All Opportunities</option>
                                                    {roles.map(r=><option key={r.id} value={r.id!}>{r.title}</option>)}
                                                </select>
                                            </div>
                                            <div className="talent-filter-group">
                                                <label>Stage</label>
                                                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                                                    <option value="all">All Stages</option>
                                                    {ALL_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            {(filterRole!=="all"||filterStatus!=="all") && (
                                                <button className="talent-filter-reset" onClick={()=>{setFilterRole("all");setFilterStatus("all");}}><X size={13}/> Reset</button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {appsPhase==="loading" && <div className="talent-loading"><Loader2 size={24} className="spin"/> Loading your talent pipeline...</div>}
                            {appsPhase==="error" && (
                                <div className="talent-error-state"><AlertTriangle size={28} color="#f59e0b"/><p>Could not load applicants.</p><button className="talent-retry-btn" onClick={loadApplicants}><RotateCcw size={14}/> Retry</button></div>
                            )}
                            {appsPhase==="success" && roles.length===0 && (
                                <div className="talent-empty">
                                    <Users size={36} color="#94a3b8"/>
                                    <p>Your applicant workspace is ready.</p>
                                    <p className="talent-empty-sub">No candidates have applied to your opportunities yet.</p>
                                    <div className="talent-empty-actions">
                                        <Link to="/employer/roles" className="talent-empty-btn talent-empty-btn--primary"><Briefcase size={14}/> Post Opportunity</Link>
                                        <button className="talent-empty-btn talent-empty-btn--outline" onClick={()=>setActiveTab("global")}><Globe size={14}/> Explore Global Talent</button>
                                    </div>
                                </div>
                            )}

                            {appsPhase==="success" && allApps.length>0 && (
                                filteredApps.length===0 ? (
                                    <div className="talent-empty"><Filter size={28} color="#94a3b8"/><p>No candidates match your filters.</p><button className="talent-retry-btn" onClick={()=>{setFilterRole("all");setFilterStatus("all");setSearchQuery("");}}>Clear Filters</button></div>
                                ) : (
                                    <div className="talent-applicant-list">
                                        {filteredApps.map((app,i) => {
                                            const key = app.roleId+"_"+app.id;
                                            const isUpdating = updatingId===key;
                                            const isShortlisted = shortlistSet.has(app.candidateUid);
                                            const isShortlistLoading = shortlistLoading===app.candidateUid;
                                            const isSelectedCompare = selectedForCompare.includes(app.id!);
                                            return (
                                                <motion.div key={key} className={"talent-applicant-card"+(isSelectedCompare?" talent-applicant-card--selected":"")} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: Math.min(i*0.04,0.3) }}>
                                                    <div className="talent-appl-left">
                                                        <div className="talent-appl-avatar">{getInitials(app.candidateName)}</div>
                                                        <div className="talent-appl-identity">
                                                            <h4 className="talent-appl-name">{app.candidateName||"Unnamed"}</h4>
                                                            <p className="talent-appl-headline">{app.candidateHeadline||app.candidateEmail}</p>
                                                            {isShortlisted && <span className="talent-shortlisted-badge">★ Shortlisted</span>}
                                                        </div>
                                                    </div>
                                                    <div className="talent-appl-role">
                                                        <p className="talent-appl-role-label">Applied for</p>
                                                        <p className="talent-appl-role-name">{app.roleTitle}</p>
                                                        {(app as any).appliedAt && <p className="talent-appl-time">{timeAgo((app as any).appliedAt)}</p>}
                                                    </div>
                                                    <div className="talent-appl-cap">
                                                        {app.capabilityMatch!==undefined ? (
                                                            <span className="talent-cap-badge">{app.capabilityMatch}% match</span>
                                                        ) : (
                                                            <span className="talent-cap-unknown">Capability pending</span>
                                                        )}
                                                    </div>
                                                    <div className="talent-appl-stage">
                                                        <span className="talent-status-pill" style={{ background: STATUS_BG[app.status]||"#f1f5f9", color: STATUS_COLORS[app.status]||"#64748b" }}>{app.status}</span>
                                                        <div className="talent-stage-select-wrap">
                                                            <select className="talent-stage-select" value={app.status} disabled={isUpdating} onChange={e=>handleStatusChange(app,e.target.value as ApplicationStatus)} style={{ borderColor: STATUS_COLORS[app.status]||"#e2e8f0" }}>
                                                                {ALL_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            {isUpdating && <Loader2 size={13} className="spin talent-stage-spinner"/>}
                                                        </div>
                                                    </div>
                                                    <div className="talent-appl-actions">
                                                        <Link to={"/profile/"+app.candidateUid} state={{ applicationId:app.id, roleId:app.roleId, status:app.status }} className="talent-appl-btn talent-appl-btn--primary">
                                                            <Eye size={13}/> View
                                                        </Link>
                                                        <button className={"talent-appl-btn "+(isShortlisted?"talent-appl-btn--shortlisted":"talent-appl-btn--shortlist")} disabled={isShortlistLoading} title={isShortlisted?"Remove from shortlist":"Shortlist"} onClick={()=>handleShortlist(app)}>
                                                            {isShortlistLoading ? <Loader2 size={13} className="spin"/> : <Star size={13} fill={isShortlisted?"currentColor":"none"}/>}
                                                        </button>
                                                        <button className={"talent-appl-btn "+(isSelectedCompare?"talent-appl-btn--compare-on":"talent-appl-btn--compare")} title="Select for comparison" onClick={()=>toggleCompare(app.id!)}>
                                                            <GitCompare size={13}/>
                                                        </button>
                                                        {!["Rejected","OA Rejected","Placed"].includes(app.status) && (
                                                            <button className="talent-appl-btn talent-appl-btn--reject" disabled={isUpdating} title="Reject" onClick={()=>{if(confirm("Reject "+app.candidateName+"?")) handleStatusChange(app,"Rejected");}}>
                                                                <XCircle size={13}/>
                                                            </button>
                                                        )}
                                                        {app.status==="Applied" && (
                                                            <button className="talent-appl-btn talent-appl-btn--approve" disabled={isUpdating} title="Approve for OA" onClick={()=>handleStatusChange(app,"OA Pending")}>
                                                                <CheckCircle2 size={13}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}


                {activeTab === "global" && (
                    <AnimatePresence mode="wait">
                        <motion.div key="global" className="talent-global-tab" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                            <div className="talent-global-intro"><Globe size={18} color="#2563eb"/><p>Discover verified talent based on capabilities, skills, and evidence — before they apply.</p></div>
                            <div className="talent-search-filter-bar">
                                <div className="talent-search-input-wrap">
                                    <Search size={15} color="#94a3b8"/>
                                    <input type="text" placeholder="Search by name, skill, headline..." value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)}/>
                                    {globalSearch && <button className="talent-search-clear" onClick={()=>setGlobalSearch("")}><X size={13}/></button>}
                                </div>
                            </div>
                            {globalPhase==="loading" && <div className="talent-loading"><Loader2 size={24} className="spin"/> Loading global talent pool...</div>}
                            {globalPhase==="error" && <div className="talent-error-state"><AlertTriangle size={28} color="#f59e0b"/><p>Could not load global talent.</p><button className="talent-retry-btn" onClick={()=>{setGlobalPhase("idle");loadGlobal();}}><RotateCcw size={14}/> Retry</button></div>}
                            {globalPhase==="success" && filteredGlobal.length===0 && (
                                <div className="talent-empty"><Globe size={36} color="#94a3b8"/><p>{globalSearch?"No candidates match your search.":"No candidates available in the pool yet."}</p>{globalSearch&&<button className="talent-retry-btn" onClick={()=>setGlobalSearch("")}>Clear Search</button>}</div>
                            )}
                            {globalPhase==="success" && filteredGlobal.length>0 && (
                                <div className="talent-global-grid">
                                    {filteredGlobal.map((candidate,i) => (
                                        <motion.div key={candidate.id} className="talent-global-card" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: Math.min(i*0.04,0.4) }}>
                                            <div className="talent-global-card-top">
                                                <div className="talent-card-avatar">{getInitials(candidate.name||"")}</div>
                                                <div className="talent-appl-identity">
                                                    <h4 className="talent-appl-name">{candidate.name||"Anonymous"}</h4>
                                                    <p className="talent-appl-headline">{candidate.headline||candidate.email||"Candidate"}</p>
                                                </div>
                                            </div>
                                            {(candidate.skills||[]).length>0 && (
                                                <div className="talent-global-skills">
                                                    {(candidate.skills as string[]).slice(0,5).map((s:string)=><span key={s} className="talent-skill-tag">{s}</span>)}
                                                    {(candidate.skills||[]).length>5 && <span className="talent-skill-more">+{(candidate.skills||[]).length-5}</span>}
                                                </div>
                                            )}
                                            <div className="talent-global-card-actions">
                                                <Link to={"/profile/"+candidate.id} className="talent-appl-btn talent-appl-btn--primary"><Eye size={13}/> View Profile</Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            {globalPhase==="idle" && <div className="talent-loading"><Loader2 size={24} className="spin"/> Initializing...</div>}
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
