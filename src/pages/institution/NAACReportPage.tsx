/**
 * NAACReportPage.tsx
 * ────────────────────────────────────────────────────────────
 * Generates a NAAC/NIRF-ready placement statistics report
 * from institution Firestore data. Renders a print-ready view
 * and provides a one-click PDF export via window.print().
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { generateNAACReport, printNAACReport, type NAACReport } from '../../services/naacReportService';
import {
    FileText, Download, Loader2, Building2, TrendingUp,
    Award, Users, BarChart3, CheckCircle2, RefreshCw,
    Calendar, Briefcase,
} from 'lucide-react';
import './NAACReportPage.css';

export default function NAACReportPage() {
    const { profile } = useAuth();
    const institutionCode = (profile as any)?.institutionCode || '';
    const institutionName = (profile as any)?.institutionName || profile?.name || 'Your Institution';

    const [totalStudents, setTotalStudents] = useState(500);
    const [academicYear, setAcademicYear] = useState(
        `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
    );
    const [report, setReport] = useState<NAACReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!institutionCode) { setError('No institution code found in your profile.'); return; }
        setLoading(true);
        setError('');
        try {
            const r = await generateNAACReport(institutionCode, institutionName, totalStudents, academicYear);
            setReport(r);
        } catch (e) {
            setError('Failed to generate report. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (report) printNAACReport(report);
    };

    return (
        <div className="naac-page">
            <FloatingNavbar variant="institution" />
            <div className="naac-content">

                {/* Header */}
                <div className="naac-page-header">
                    <div>
                        <span className="naac-eyebrow">INSTITUTION COMPLIANCE</span>
                        <h1>NAAC / NIRF Placement Report</h1>
                        <p>Generate a formatted placement statistics report suitable for NAAC accreditation and NIRF ranking submissions.</p>
                    </div>
                </div>

                {/* Config panel */}
                <div className="naac-config-card">
                    <h2>Report Configuration</h2>
                    <div className="naac-config-grid">
                        <div className="naac-field">
                            <label>Institution Name</label>
                            <input type="text" value={institutionName} disabled className="naac-input" />
                        </div>
                        <div className="naac-field">
                            <label>Academic Year</label>
                            <input
                                type="text"
                                value={academicYear}
                                onChange={e => setAcademicYear(e.target.value)}
                                placeholder="e.g. 2024-2025"
                                className="naac-input"
                            />
                        </div>
                        <div className="naac-field">
                            <label>Total Students (Final Year)</label>
                            <input
                                type="number"
                                value={totalStudents}
                                onChange={e => setTotalStudents(Number(e.target.value))}
                                min={1}
                                className="naac-input"
                            />
                        </div>
                    </div>

                    {error && <div className="naac-error"><CheckCircle2 size={14} color="#ef4444" /> {error}</div>}

                    <div className="naac-config-actions">
                        <button className="naac-generate-btn" onClick={handleGenerate} disabled={loading}>
                            {loading ? <><Loader2 size={16} className="spin" /> Generating…</> : <><RefreshCw size={16} /> Generate Report</>}
                        </button>
                        {report && (
                            <button className="naac-print-btn" onClick={handlePrint}>
                                <Download size={16} /> Export PDF
                            </button>
                        )}
                    </div>
                </div>

                {/* Report Preview */}
                {report && (
                    <motion.div
                        className="naac-report-preview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Report Header */}
                        <div className="naac-report-header">
                            <Building2 size={40} color="#1d4ed8" />
                            <div>
                                <h2>{report.institutionName}</h2>
                                <p>Placement Report — Academic Year {report.academicYear}</p>
                                <p className="naac-generated-at">Generated: {report.generatedAt}</p>
                            </div>
                        </div>

                        {/* KPI Strip */}
                        <div className="naac-kpi-strip">
                            {[
                                { label: 'Total Students', value: report.totalStudents, icon: <Users size={18} />, color: '#2563eb' },
                                { label: 'Students Placed', value: report.placedStudents, icon: <Award size={18} />, color: '#10b981' },
                                { label: 'Placement %', value: `${report.placementPercentage}%`, icon: <TrendingUp size={18} />, color: '#7c3aed' },
                                { label: 'Avg Package', value: `₹${(report.averagePackage / 100000).toFixed(1)}L`, icon: <BarChart3 size={18} />, color: '#f59e0b' },
                                { label: 'Highest Package', value: `₹${(report.highestPackage / 100000).toFixed(1)}L`, icon: <Award size={18} />, color: '#ef4444' },
                                { label: 'Companies Visited', value: report.companiesVisited, icon: <Briefcase size={18} />, color: '#06b6d4' },
                            ].map(k => (
                                <div key={k.label} className="naac-kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}>
                                    <div className="naac-kpi-icon" style={{ color: k.color }}>{k.icon}</div>
                                    <div className="naac-kpi-value" style={{ color: k.color }}>{k.value}</div>
                                    <div className="naac-kpi-label">{k.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="naac-report-body">
                            {/* Sector Breakdown */}
                            <div className="naac-section-card">
                                <h3>Sector-wise Placement Breakdown</h3>
                                <div className="naac-sector-list">
                                    {report.sectorBreakdown.map(s => {
                                        const pct = report.placedStudents > 0 ? Math.round((s.count / report.placedStudents) * 100) : 0;
                                        return (
                                            <div key={s.sector} className="naac-sector-row">
                                                <span className="naac-sector-name">{s.sector}</span>
                                                <div className="naac-sector-bar-wrap">
                                                    <div className="naac-sector-bar" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="naac-sector-count">{s.count} ({pct}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Department Breakdown */}
                            {report.departmentBreakdown.length > 0 && (
                                <div className="naac-section-card">
                                    <h3>Department-wise Placement</h3>
                                    <table className="naac-table">
                                        <thead>
                                            <tr>
                                                <th>Department</th>
                                                <th>Total Students</th>
                                                <th>Placed</th>
                                                <th>% Placed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.departmentBreakdown.map(d => (
                                                <tr key={d.dept}>
                                                    <td>{d.dept}</td>
                                                    <td>{d.total}</td>
                                                    <td>{d.placed}</td>
                                                    <td>
                                                        <span className="naac-pct-badge" style={{ background: d.total > 0 && (d.placed / d.total) >= 0.7 ? '#dcfce7' : '#fef3c7', color: d.total > 0 && (d.placed / d.total) >= 0.7 ? '#16a34a' : '#b45309' }}>
                                                            {d.total > 0 ? Math.round((d.placed / d.total) * 100) : 0}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Top Recruiters */}
                            <div className="naac-section-card">
                                <h3>Top Recruiting Companies</h3>
                                <div className="naac-recruiters-list">
                                    {report.topRecruiters.map((r, i) => (
                                        <div key={r.company} className="naac-recruiter-row">
                                            <span className="naac-recruiter-rank">#{i + 1}</span>
                                            <span className="naac-recruiter-name">{r.company}</span>
                                            <span className="naac-recruiter-count">{r.hired} hired</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="naac-report-footer">
                            <p>This report was automatically generated by CapAble — Campus Placement Intelligence Platform</p>
                            <p>For NAAC Criterion V / NIRF Category: Placement & Higher Studies</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
