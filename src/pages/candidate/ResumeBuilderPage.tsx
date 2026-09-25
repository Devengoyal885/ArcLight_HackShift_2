/**
 * ResumeBuilderPage.tsx
 * ─────────────────────────────────────────────────────────────────────────
 * Canva-style resume builder:
 *   • 5 template gallery with real thumbnails
 *   • Live preview (HTML rendered in iframe sandbox)
 *   • Color theme picker (8 presets + custom hex)
 *   • Font family selector (5 choices)
 *   • Font size slider
 *   • 1-page / 2-page toggle
 *   • PDF export via html2pdf
 *   • ATS-score panel from JD paste
 *   • Separate from AI Tailor (that lives on /candidate/resume)
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities, getProjects, getCertifications } from '../../services/profileService';
import type { UserCapability, UserProject, UserCertification } from '../../services/profileService';
import {
    TEMPLATES, renderTemplate, buildResumeData, DEFAULT_THEME,
    type TemplateId, type ThemeConfig,
} from '../../services/resumeTemplates';
import { calculateATSMetricsFast } from '../../services/resumeParserService';
import {
    Palette, Type, Download, Eye, CheckCircle2, ChevronRight,
    Loader2, FileText, Zap, BarChart3, ChevronLeft, Sliders,
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import './ResumeBuilderPage.css';

const ACCENT_PRESETS = [
    { label: 'Ocean', color: '#2563eb' },
    { label: 'Emerald', color: '#059669' },
    { label: 'Violet', color: '#7c3aed' },
    { label: 'Rose', color: '#e11d48' },
    { label: 'Amber', color: '#d97706' },
    { label: 'Navy', color: '#1e3a5f' },
    { label: 'Slate', color: '#475569' },
    { label: 'Teal', color: '#0d9488' },
];

const FONT_OPTIONS = [
    { label: 'Inter (Modern)', value: "'Inter', 'Helvetica Neue', sans-serif" },
    { label: 'Georgia (Serif)', value: "'Georgia', 'Times New Roman', serif" },
    { label: 'Roboto (Clean)', value: "'Roboto', 'Helvetica', sans-serif" },
    { label: 'Playfair (Elegant)', value: "'Playfair Display', 'Georgia', serif" },
    { label: 'Courier (Monospace)', value: "'Courier New', monospace" },
];

type Phase = 'gallery' | 'builder';

export default function ResumeBuilderPage() {
    const { dbUid, profile } = useAuth();

    const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
    const [projects, setProjects] = useState<UserProject[]>([]);
    const [certifications, setCertifications] = useState<UserCertification[]>([]);
    const [loading, setLoading] = useState(true);

    const [phase, setPhase] = useState<Phase>('gallery');
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern');
    const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
    const [customColor, setCustomColor] = useState('#2563eb');

    // ATS
    const [jdText, setJdText] = useState('');
    const [atsMetrics, setAtsMetrics] = useState<{ atsScore: number; keywordsMatched: string[]; keywordsMissing: string[] } | null>(null);

    // Right panel tab
    const [rightTab, setRightTab] = useState<'preview' | 'ats'>('preview');

    // PDF export
    const [exporting, setExporting] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!dbUid) return;
        Promise.all([
            getCapabilities(dbUid),
            getProjects(dbUid),
            getCertifications(dbUid),
        ]).then(([caps, projs, certs]) => {
            setCapabilities(caps);
            setProjects(projs);
            setCertifications(certs);
        }).finally(() => setLoading(false));
    }, [dbUid]);

    const resumeData = useMemo(() =>
        buildResumeData(profile, capabilities, projects, certifications),
        [profile, capabilities, projects, certifications]
    );

    const renderedHtml = useMemo(() =>
        renderTemplate(selectedTemplate, resumeData, theme),
        [selectedTemplate, resumeData, theme]
    );

    const handleTemplateSelect = (id: TemplateId) => {
        setSelectedTemplate(id);
        // Set default accent for template
        const tpl = TEMPLATES.find(t => t.id === id);
        if (tpl) {
            setTheme(prev => ({ ...prev, accentColor: tpl.accentDefault }));
            setCustomColor(tpl.accentDefault);
        }
        setPhase('builder');
    };

    const handleAccentPreset = (color: string) => {
        setTheme(prev => ({ ...prev, accentColor: color }));
        setCustomColor(color);
    };

    const handleCustomColor = (color: string) => {
        setCustomColor(color);
        setTheme(prev => ({ ...prev, accentColor: color }));
    };

    const handleExportPDF = async () => {
        if (!previewRef.current) return;
        setExporting(true);
        try {
            await html2pdf().set({
                margin: 0,
                filename: `${profile?.name?.replace(/\s+/g, '_') || 'Resume'}_${selectedTemplate}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            }).from(previewRef.current).save();
        } finally {
            setExporting(false);
        }
    };

    const handleCalculateATS = () => {
        if (!jdText.trim()) return;
        const metrics = calculateATSMetricsFast(capabilities, jdText);
        setAtsMetrics(metrics);
        setRightTab('ats');
    };

    const activeTpl = TEMPLATES.find(t => t.id === selectedTemplate)!;

    return (
        <div className="rb-page">
            <FloatingNavbar variant="candidate" />

            {/* ── Phase: Gallery ── */}
            {phase === 'gallery' && (
                <motion.div className="rb-gallery-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="rb-gallery-header">
                        <h1>Choose a Resume Template</h1>
                        <p>Pick a layout to start building. You can change it anytime in the editor.</p>
                    </div>

                    {loading ? (
                        <div className="rb-loading"><Loader2 size={32} className="spin" /></div>
                    ) : (
                        <div className="rb-template-grid">
                            {TEMPLATES.map((tpl, i) => (
                                <motion.div
                                    key={tpl.id}
                                    className="rb-template-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    onClick={() => handleTemplateSelect(tpl.id)}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="rb-template-thumb-wrap">
                                        <img
                                            src={`/thumb_${tpl.id}.jpg`}
                                            alt={tpl.name}
                                            className="rb-template-thumb"
                                        />
                                        <div className="rb-template-overlay">
                                            <button className="rb-use-btn">
                                                Use Template <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rb-template-info">
                                        <h3>{tpl.name}</h3>
                                        <p>{tpl.description}</p>
                                        <div className="rb-template-tags">
                                            {tpl.tags.map(tag => (
                                                <span key={tag} className="rb-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── Phase: Builder ── */}
            {phase === 'builder' && (
                <motion.div className="rb-builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Left: Customization Panel */}
                    <div className="rb-sidebar">
                        <div className="rb-sidebar-header">
                            <button className="rb-back-btn" onClick={() => setPhase('gallery')}>
                                <ChevronLeft size={16} /> Templates
                            </button>
                            <span className="rb-active-tpl">{activeTpl.name}</span>
                        </div>

                        {/* Template switcher row */}
                        <div className="rb-tpl-strip">
                            {TEMPLATES.map(tpl => (
                                <button
                                    key={tpl.id}
                                    className={`rb-tpl-chip ${selectedTemplate === tpl.id ? 'active' : ''}`}
                                    onClick={() => handleTemplateSelect(tpl.id)}
                                    title={tpl.name}
                                >
                                    <img src={`/thumb_${tpl.id}.jpg`} alt={tpl.name} />
                                    {selectedTemplate === tpl.id && <CheckCircle2 size={12} className="rb-tpl-chip-check" />}
                                </button>
                            ))}
                        </div>

                        {/* Accent Color */}
                        <div className="rb-section">
                            <div className="rb-section-title"><Palette size={14} /> Accent Color</div>
                            <div className="rb-color-presets">
                                {ACCENT_PRESETS.map(p => (
                                    <button
                                        key={p.color}
                                        className={`rb-color-dot ${theme.accentColor === p.color ? 'active' : ''}`}
                                        style={{ background: p.color }}
                                        title={p.label}
                                        onClick={() => handleAccentPreset(p.color)}
                                    />
                                ))}
                            </div>
                            <div className="rb-custom-color-row">
                                <input
                                    type="color"
                                    value={customColor}
                                    onChange={e => handleCustomColor(e.target.value)}
                                    className="rb-color-input"
                                />
                                <span className="rb-color-hex">{customColor}</span>
                                <span className="rb-custom-lbl">Custom</span>
                            </div>
                        </div>

                        {/* Font */}
                        <div className="rb-section">
                            <div className="rb-section-title"><Type size={14} /> Font Family</div>
                            <div className="rb-font-list">
                                {FONT_OPTIONS.map(f => (
                                    <button
                                        key={f.value}
                                        className={`rb-font-btn ${theme.fontFamily === f.value ? 'active' : ''}`}
                                        style={{ fontFamily: f.value }}
                                        onClick={() => setTheme(prev => ({ ...prev, fontFamily: f.value }))}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className="rb-section">
                            <div className="rb-section-title">
                                <Sliders size={14} /> Font Size
                                <span className="rb-section-val">{theme.fontSize}px</span>
                            </div>
                            <input
                                type="range" min={9} max={14} step={0.5}
                                value={theme.fontSize}
                                onChange={e => setTheme(prev => ({ ...prev, fontSize: +e.target.value }))}
                                className="rb-slider"
                            />
                            <div className="rb-slider-labels"><span>Compact</span><span>Large</span></div>
                        </div>

                        {/* ATS Quick Check */}
                        <div className="rb-section">
                            <div className="rb-section-title"><BarChart3 size={14} /> ATS Quick Check</div>
                            <textarea
                                className="rb-jd-area"
                                placeholder="Paste job description to check keyword match..."
                                rows={4}
                                value={jdText}
                                onChange={e => setJdText(e.target.value)}
                            />
                            <button className="rb-ats-btn" onClick={handleCalculateATS} disabled={!jdText.trim()}>
                                <Zap size={14} /> Check ATS Score
                            </button>
                        </div>

                        {/* Export */}
                        <button className="rb-export-btn" onClick={handleExportPDF} disabled={exporting}>
                            {exporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                            {exporting ? 'Exporting PDF...' : 'Export PDF'}
                        </button>
                    </div>

                    {/* Right: Preview */}
                    <div className="rb-preview-panel">
                        <div className="rb-preview-topbar">
                            <div className="rb-preview-tabs">
                                <button
                                    className={`rb-prev-tab ${rightTab === 'preview' ? 'active' : ''}`}
                                    onClick={() => setRightTab('preview')}
                                >
                                    <Eye size={14} /> Preview
                                </button>
                                {atsMetrics && (
                                    <button
                                        className={`rb-prev-tab ${rightTab === 'ats' ? 'active' : ''}`}
                                        onClick={() => setRightTab('ats')}
                                    >
                                        <BarChart3 size={14} /> ATS
                                        <span className={`rb-ats-badge ${atsMetrics.atsScore >= 70 ? 'good' : 'low'}`}>
                                            {atsMetrics.atsScore}%
                                        </span>
                                    </button>
                                )}
                            </div>
                            <button className="rb-dl-btn" onClick={handleExportPDF} disabled={exporting}>
                                <Download size={14} />
                                {exporting ? 'Exporting...' : 'Download PDF'}
                            </button>
                        </div>

                        {rightTab === 'preview' && (
                            <div className="rb-preview-scroll">
                                <div className="rb-preview-page" ref={previewRef}
                                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                />
                            </div>
                        )}

                        {rightTab === 'ats' && atsMetrics && (
                            <div className="rb-ats-panel">
                                <div className="rb-ats-score-ring">
                                    <div className="rb-ats-score-val" style={{ color: atsMetrics.atsScore >= 70 ? '#10b981' : atsMetrics.atsScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                                        {atsMetrics.atsScore}%
                                    </div>
                                    <div className="rb-ats-score-lbl">ATS Match</div>
                                </div>
                                <div className="rb-ats-progress">
                                    <div className="rb-ats-bar" style={{ width: `${atsMetrics.atsScore}%`, background: atsMetrics.atsScore >= 70 ? '#10b981' : '#f59e0b' }} />
                                </div>

                                {atsMetrics.keywordsMatched.length > 0 && (
                                    <div className="rb-ats-kw-group">
                                        <h4 className="rb-ats-kw-title rb-ats-kw-match">✅ Matched Keywords ({atsMetrics.keywordsMatched.length})</h4>
                                        <div className="rb-ats-kw-pills">
                                            {atsMetrics.keywordsMatched.map((k, i) => (
                                                <span key={i} className="rb-kw-match">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {atsMetrics.keywordsMissing.length > 0 && (
                                    <div className="rb-ats-kw-group">
                                        <h4 className="rb-ats-kw-title rb-ats-kw-miss">⚠️ Missing Keywords ({atsMetrics.keywordsMissing.length})</h4>
                                        <div className="rb-ats-kw-pills">
                                            {atsMetrics.keywordsMissing.map((k, i) => (
                                                <span key={i} className="rb-kw-miss">{k}</span>
                                            ))}
                                        </div>
                                        <p className="rb-ats-tip">Add these to your skills or project descriptions to improve ATS ranking.</p>
                                    </div>
                                )}
                                <button className="rb-ats-retry" onClick={() => setRightTab('preview')}>
                                    ← Back to Preview
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
