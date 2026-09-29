import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { CapabilityFingerprint } from '../../components/capability/CapabilityFingerprint';
import { VerificationBadge } from '../../components/capability/VerificationBadge';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities, getProjects, saveProjects } from '../../services/profileService';
import type { UserCapability, UserProject } from '../../services/profileService';
import { Loader2, Sparkles, FolderDot, AlertCircle, Plus, X, Code } from 'lucide-react';
import './PortfolioPage.css';

export default function PortfolioPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user, dbUid, profile } = useAuth();
    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [projects, setProjects] = useState<UserProject[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Add Project State
    const [showAddProject, setShowAddProject] = useState(false);
    const [isSavingProject, setIsSavingProject] = useState(false);
    const [newProject, setNewProject] = useState<Partial<UserProject>>({
        name: '', description: '', url: '', technologies: [], source: 'manual'
    });

    const handleAddProject = async () => {
        if (!newProject.name || !dbUid) return;
        setIsSavingProject(true);
        try {
            const proj: UserProject = {
                name: newProject.name,
                description: newProject.description || '',
                url: newProject.url || '',
                technologies: newProject.technologies || [],
                source: 'manual',
            };
            await saveProjects(dbUid, [proj]);
            setProjects([proj, ...projects]);
            setShowAddProject(false);
            setNewProject({ name: '', description: '', url: '', technologies: [], source: 'manual' });
        } catch (e) {
            console.error("Failed to save project", e);
        } finally {
            setIsSavingProject(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        Promise.all([
            getCapabilities(dbUid!),
            getProjects(dbUid!)
        ]).then(([caps, projs]) => {
            setCapabilities(caps);
            setProjects(projs);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [user]);

    if (loading) {
        return (
            <div className="portfolio-page flex items-center justify-center">
                {!isEmbedded && <FloatingNavbar variant="candidate" />}
                <Loader2 className="spin text-blue" size={32} />
            </div>
        );
    }

    const capMap: Record<string, number> = {};
    capabilities.forEach(c => { capMap[c.skill] = c.score; });

    // Calculate overall confidence based on capabilities
    const avgConfidence = capabilities.length > 0 
        ? Math.round(capabilities.reduce((acc, c) => acc + c.score, 0) / capabilities.length) 
        : 0;

    const initials = profile?.name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

    return (
        <div className="portfolio-page">
            {!isEmbedded && <FloatingNavbar variant="candidate" />}
            {!isEmbedded && <div className="portfolio-bg" />}

            <main className="portfolio-main">
                {/* Hero identity */}
                <motion.div className="portfolio-hero" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="portfolio-avatar">{initials}</div>
                    <div className="portfolio-identity">
                        <div className="portfolio-name-row">
                            <h1 className="portfolio-name">{profile?.name || 'Candidate'}</h1>
                            <VerificationBadge state="VERIFIED" />
                        </div>
                        <p className="portfolio-role">{profile?.headline || 'Software Engineer'}</p>
                        <p className="portfolio-tagline">Building capability. Proving it. Finding where it belongs.</p>
                    </div>
                    <div className="portfolio-stats">
                        <div className="portfolio-stat">
                            <span className="ps-val">{avgConfidence}%</span>
                            <span className="ps-lbl">Capability Confidence</span>
                        </div>
                        <div className="portfolio-stat">
                            <span className="ps-val">{capabilities.length}</span>
                            <span className="ps-lbl">Verified Capabilities</span>
                        </div>
                        <div className="portfolio-stat">
                            <span className="ps-val">{projects.length}</span>
                            <span className="ps-lbl">Projects</span>
                        </div>
                    </div>
                </motion.div>

                <div className="portfolio-layout">
                    {/* Left: Fingerprint */}
                    <motion.div className="portfolio-left" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                        <div className="portfolio-section-card">
                            <p className="portfolio-section-label">CAPABILITY FINGERPRINT</p>
                            {capabilities.length > 0 ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                                    <CapabilityFingerprint capabilities={capMap} size={340} accentColor="#6366f1" />
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    <AlertCircle size={32} className="mx-auto mb-2 text-slate-400" />
                                    <p>No verified capabilities yet.</p>
                                </div>
                            )}
                        </div>

                        <div className="portfolio-section-card">
                            <p className="portfolio-section-label">CAPABILITY EVIDENCE SOURCES</p>
                            <div className="portfolio-timeline">
                                {capabilities.length > 0 ? capabilities.map((cap, i) => (
                                    <motion.div
                                        key={i}
                                        className="portfolio-timeline-item"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25 + i * 0.07 }}
                                    >
                                        <div className="portfolio-tl-dot" style={{ background: '#2563eb' }} />
                                        <div className="portfolio-tl-line" />
                                        <div className="portfolio-tl-year">{cap.score}%</div>
                                        <div className="portfolio-tl-body">
                                            <span className="portfolio-tl-skill" style={{ color: '#2563eb' }}>{cap.skill}</span>
                                            <span className="portfolio-tl-level">{cap.evidenceSources.join(', ') || 'Inferred'}</span>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="p-4 text-center text-slate-500">Complete an assessment to build your evidence graph.</div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Projects + Verified Work */}
                    <motion.div className="portfolio-right" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <div className="portfolio-section-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <p className="portfolio-section-label" style={{ marginBottom: 0 }}>VERIFIED WORK & PROJECTS</p>
                                <button
                                    onClick={() => setShowAddProject(true)}
                                    className="portfolio-add-proj-btn"
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '6px 12px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
                                >
                                    <Plus size={14} /> Add Project
                                </button>
                            </div>
                            
                            {/* Add Project Form Inline */}
                            {showAddProject && (
                                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Add New Project</h4>
                                        <button onClick={() => setShowAddProject(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <input
                                            placeholder="Project Name"
                                            value={newProject.name}
                                            onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                                            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, width: '100%', boxSizing: 'border-box' }}
                                        />
                                        <textarea
                                            placeholder="Description"
                                            value={newProject.description}
                                            onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                                            rows={2}
                                            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                        />
                                        <input
                                            placeholder="Project URL (e.g., GitHub, Live Demo)"
                                            value={newProject.url}
                                            onChange={e => setNewProject(p => ({ ...p, url: e.target.value }))}
                                            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, width: '100%', boxSizing: 'border-box' }}
                                        />
                                        <input
                                            placeholder="Technologies (comma separated, e.g. React, Node, Firebase)"
                                            value={newProject.technologies?.join(', ')}
                                            onChange={e => setNewProject(p => ({ ...p, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                                            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, width: '100%', boxSizing: 'border-box' }}
                                        />
                                        <button
                                            onClick={handleAddProject}
                                            disabled={isSavingProject || !newProject.name}
                                            style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            {isSavingProject ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Save Project
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="portfolio-projects">
                                {projects.length > 0 ? projects.map((proj, i) => (
                                    <motion.div
                                        key={proj.id || proj.name}
                                        className="portfolio-project-card"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.07 }}
                                    >
                                        <div className="portfolio-proj-header">
                                            <span className="portfolio-proj-name">{proj.name}</span>
                                            <VerificationBadge state={proj.source === 'github' ? 'VERIFIED' : 'PRACTISED'} size="sm" />
                                        </div>
                                        <p className="portfolio-proj-desc">{proj.description}</p>
                                        <div className="portfolio-proj-caps">
                                            {proj.technologies.map(c => (
                                                <span key={c} className="portfolio-proj-cap">{c}</span>
                                            ))}
                                        </div>
                                        {proj.url && (
                                            <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 mt-2 block hover:underline">
                                                View Project &rarr;
                                            </a>
                                        )}
                                    </motion.div>
                                )) : (
                                    <div className="p-8 text-center border border-slate-200 border-dashed rounded-lg bg-slate-50 text-slate-500">
                                        <FolderDot size={32} className="mx-auto mb-2 text-slate-400" />
                                        <h4 className="font-semibold text-slate-700">No Projects Found</h4>
                                        <p className="text-sm mt-1">Sync your GitHub or manually add projects to showcase your verified work.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="portfolio-no-social">
                            <span className="portfolio-no-social-icon">◎</span>
                            <div>
                                <p className="portfolio-no-social-title">No follower counts. No likes. No connections.</p>
                                <p className="portfolio-no-social-sub">Only capabilities, evidence, and verified growth matter here.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
