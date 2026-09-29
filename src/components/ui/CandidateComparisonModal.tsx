import { useState, useEffect } from "react";
import { X, Loader2, Target, GraduationCap, Briefcase, Award } from "lucide-react";
import { getProfile, getCapabilities } from "../../services/profileService";
import type { UserProfile, UserCapability } from "../../services/profileService";
import "./CandidateComparisonModal.css";

interface CandidateData {
    uid: string;
    applicationData?: {
        roleTitle: string;
        status: string;
        capabilityMatch?: number;
        appliedAt?: any;
    };
    profile: UserProfile;
    capabilities: UserCapability[];
}

interface CandidateComparisonModalProps {
    candidates: {
        candidateUid: string;
        candidateName: string;
        candidateHeadline?: string;
        roleTitle?: string;
        status?: string;
        capabilityMatch?: number;
        appliedAt?: any;
    }[];
    onClose: () => void;
}

function getInitials(name: string): string {
    return (name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(ts: any): string {
    if (!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
}

const STATUS_COLORS: Record<string, string> = {
    "Applied": "#2563eb", "Screening": "#f59e0b", "OA Pending": "#7c3aed",
    "Interview Scheduled": "#0891b2", "Offer Extended": "#16a34a", "Placed": "#059669", "Rejected": "#ef4444", "OA Rejected": "#dc2626",
};
const STATUS_BG: Record<string, string> = {
    "Applied": "#eff6ff", "Screening": "#fef3c7", "OA Pending": "#f3e8ff",
    "Interview Scheduled": "#ecfeff", "Offer Extended": "#f0fdf4", "Placed": "#dcfce7", "Rejected": "#fef2f2", "OA Rejected": "#fef2f2",
};

export function CandidateComparisonModal({ candidates, onClose }: CandidateComparisonModalProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CandidateData[]>([]);

    useEffect(() => {
        if (!candidates || candidates.length < 2) return;
        async function load() {
            setLoading(true);
            try {
                const results = await Promise.all(candidates.slice(0, 3).map(async (c) => {
                    const profile = await getProfile(c.candidateUid);
                    const caps = await getCapabilities(c.candidateUid);
                    return {
                        uid: c.candidateUid,
                        applicationData: c.roleTitle ? {
                            roleTitle: c.roleTitle,
                            status: c.status || "Applied",
                            capabilityMatch: c.capabilityMatch,
                            appliedAt: c.appliedAt
                        } : undefined,
                        profile: profile!,
                        capabilities: caps
                    };
                }));
                setData(results);
            } catch (e) {
                console.error("Error loading candidate data:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [candidates]);

    return (
        <div className="talent-modal-overlay" onClick={onClose}>
            <div className="talent-modal compare-modal" onClick={e => e.stopPropagation()}>
                <div className="talent-modal-header">
                    <h2>Candidate Comparison</h2>
                    <button className="talent-modal-close" onClick={onClose}><X size={16} /></button>
                </div>

                {loading ? (
                    <div className="compare-loading"><Loader2 size={32} className="spin" /></div>
                ) : (
                    <div className="compare-content">
                        <div className="compare-grid" style={{ gridTemplateColumns: `auto repeat(${data.length}, 1fr)` }}>
                            {/* Headers */}
                            <div className="compare-col-header" />
                            {data.map((d, i) => (
                                <div key={d.uid} className="compare-col-profile">
                                    <div className="compare-avatar" style={{ background: i % 2 === 1 ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "" }}>
                                        {d.profile?.avatar ? <img src={d.profile.avatar} alt={d.profile.name} /> : getInitials(d.profile?.name || "")}
                                    </div>
                                    <h3>{d.profile?.name || "Unknown"}</h3>
                                    <p>{d.profile?.headline || d.profile?.email}</p>
                                </div>
                            ))}

                            {/* Section: Application Details (if available) */}
                            {data.some(d => d.applicationData) && (
                                <>
                                    <div className="compare-section-title"><Target size={14} /> Application</div>
                                    <div className="compare-row-wrapper" style={{ gridColumn: `1 / -1` }}>
                                        <div className="compare-row">
                                            <div className="compare-label">Role</div>
                                            {data.map(d => <div key={d.uid} className="compare-val">{d.applicationData?.roleTitle || "—"}</div>)}
                                        </div>
                                        <div className="compare-row">
                                            <div className="compare-label">Status</div>
                                            {data.map(d => (
                                                <div key={d.uid} className="compare-val">
                                                    {d.applicationData ? (
                                                        <span className="talent-status-pill" style={{ background: STATUS_BG[d.applicationData.status] || "#f1f5f9", color: STATUS_COLORS[d.applicationData.status] || "#64748b" }}>
                                                            {d.applicationData.status}
                                                        </span>
                                                    ) : "—"}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="compare-row">
                                            <div className="compare-label">Match %</div>
                                            {data.map(d => (
                                                <div key={d.uid} className="compare-val">
                                                    {d.applicationData?.capabilityMatch !== undefined ? (
                                                        <div className="compare-match-bar">
                                                            <div className="compare-match-fill" style={{ width: `${d.applicationData.capabilityMatch}%`, background: d.applicationData.capabilityMatch >= 80 ? '#22c55e' : d.applicationData.capabilityMatch >= 50 ? '#f59e0b' : '#ef4444' }} />
                                                            <span>{d.applicationData.capabilityMatch}%</span>
                                                        </div>
                                                    ) : "—"}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="compare-row">
                                            <div className="compare-label">Applied</div>
                                            {data.map(d => <div key={d.uid} className="compare-val">{timeAgo(d.applicationData?.appliedAt) || "—"}</div>)}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Section: Profile Overview */}
                            <div className="compare-section-title"><Briefcase size={14} /> Profile Overview</div>
                            <div className="compare-row-wrapper" style={{ gridColumn: `1 / -1` }}>
                                <div className="compare-row">
                                    <div className="compare-label">Location</div>
                                    {data.map(d => <div key={d.uid} className="compare-val">{d.profile?.location || "—"}</div>)}
                                </div>
                                <div className="compare-row">
                                    <div className="compare-label">Top Skills</div>
                                    {data.map(d => (
                                        <div key={d.uid} className="compare-val compare-skills">
                                            {d.profile?.skills?.slice(0, 4).map(s => <span key={s} className="compare-skill-tag">{s}</span>) || "—"}
                                            {d.profile?.skills && d.profile.skills.length > 4 && <span className="compare-skill-more">+{d.profile.skills.length - 4}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Education */}
                            <div className="compare-section-title"><GraduationCap size={14} /> Education</div>
                            <div className="compare-row-wrapper" style={{ gridColumn: `1 / -1` }}>
                                <div className="compare-row">
                                    <div className="compare-label">Institution</div>
                                    {data.map(d => <div key={d.uid} className="compare-val">{d.profile?.education?.[0]?.institution || "—"}</div>)}
                                </div>
                                <div className="compare-row">
                                    <div className="compare-label">Degree</div>
                                    {data.map(d => <div key={d.uid} className="compare-val">{d.profile?.education?.[0]?.degree || "—"}</div>)}
                                </div>
                            </div>

                            {/* Section: Capabilities */}
                            <div className="compare-section-title"><Award size={14} /> Top Capabilities</div>
                            <div className="compare-row-wrapper" style={{ gridColumn: `1 / -1` }}>
                                <div className="compare-row">
                                    <div className="compare-label">Verified Tags</div>
                                    {data.map(d => (
                                        <div key={d.uid} className="compare-val compare-caps">
                                            {d.capabilities.slice(0, 3).map(c => (
                                                <div key={c.id || c.skill} className="compare-cap-item">
                                                    <span className="compare-cap-name">{c.skill}</span>
                                                    <span className="compare-cap-lvl">{c.score}%</span>
                                                </div>
                                            ))}
                                            {d.capabilities.length === 0 && "—"}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="talent-compare-note">Recruiter makes the final decision. CapAble shows evidence; it does not rank candidates automatically.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
