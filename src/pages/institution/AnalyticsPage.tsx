import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { getAllStudents } from '../../services/institutionService';
import { useAuth } from '../../context/AuthContext';
import { generateNAACReport, printNAACReport } from '../../services/naacReportService';
import type { UserProfile } from '../../services/profileService';
import {
    BarChart3, Loader2, AlertCircle, FileText, TrendingUp,
    Users, Briefcase, Award, Download
} from 'lucide-react';
import './InstitutionSubPages.css';

export default function AnalyticsPage() {
    const { profile: adminProfile } = useAuth();
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        getAllStudents().then(setStudents).catch(console.error).finally(() => setLoading(false));
    }, []);

    const institutionCode = adminProfile?.institutionCode || '';
    const institutionName = (adminProfile as any)?.institutionName || 'Your Institution';

    // Compute analytics
    const totalStudents = students.length;
    const completedProfiles = students.filter(s => s.profileComplete).length;
    const completionRate = totalStudents ? Math.round((completedProfiles / totalStudents) * 100) : 0;

    // Skill aggregation
    const skillCounts: Record<string, number> = {};
    students.forEach(s => {
        s.skills?.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
    });
    const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Department breakdown
    const deptCounts: Record<string, number> = {};
    students.forEach(s => {
        const dept = (s as any).department || 'General';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const deptList = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

    // Batch breakdown
    const batchCounts: Record<string, number> = {};
    students.forEach(s => {
        const batch = (s as any).batch || 'Unknown';
        batchCounts[batch] = (batchCounts[batch] || 0) + 1;
    });

    const handleNAACReport = async () => {
        setGeneratingReport(true);
        try {
            const report = await generateNAACReport(institutionCode, institutionName, totalStudents);
            printNAACReport(report);
        } catch (err) {
            console.error(err);
            alert('Failed to generate report. Please try again.');
        } finally {
            setGeneratingReport(false);
        }
    };

    const kpiCards = [
        { label: 'Total Students', value: totalStudents, icon: Users, color: '#6366f1' },
        { label: 'Profile Completion', value: `${completionRate}%`, icon: Award, color: '#10b981' },
        { label: 'Departments', value: deptList.length, icon: Briefcase, color: '#f59e0b' },
        { label: 'Active Batches', value: Object.keys(batchCounts).length, icon: TrendingUp, color: '#3b82f6' },
    ];

    return (
        <div className="inst-subpage">
            <FloatingNavbar variant="institution" />
            <div className="inst-content">
                <motion.header className="inst-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <BarChart3 size={28} className="inst-header-icon" />
                    <div>
                        <h1>Analytics & Reports</h1>
                        <p>Skill distribution, profile metrics, and NAAC-ready exports</p>
                    </div>
                    <button
                        onClick={handleNAACReport}
                        disabled={generatingReport || loading}
                        style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px',
                            background: generatingReport ? '#94a3b8' : '#0f172a',
                            color: 'white', border: 'none', borderRadius: '10px',
                            padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                            cursor: generatingReport ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {generatingReport ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
                        {generatingReport ? 'Generating...' : 'Export NAAC Report'}
                    </button>
                </motion.header>

                {loading ? (
                    <div className="inst-loading"><Loader2 size={32} className="spin" /><p>Crunching analytics...</p></div>
                ) : students.length === 0 ? (
                    <div className="inst-empty"><AlertCircle size={32} /><h3>No Data Available</h3><p>Need students to generate analytics.</p></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* KPI Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}
                        >
                            {kpiCards.map(kpi => (
                                <div key={kpi.label} style={{
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                                    padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <kpi.icon size={28} color={kpi.color} style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{kpi.value}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{kpi.label}</div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Top Skills */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}
                        >
                            <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700 }}>
                                Top Skills Across Institution
                            </h2>
                            {topSkills.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {topSkills.map(([skill, count]) => {
                                        const pct = Math.round((count / totalStudents) * 100);
                                        return (
                                            <div key={skill}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: '#334155' }}>
                                                    <span style={{ fontWeight: 600 }}>{skill}</span>
                                                    <span style={{ color: '#64748b' }}>{count} students ({pct}%)</span>
                                                </div>
                                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                                                        style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px' }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <p style={{ color: '#64748b' }}>No skills reported yet.</p>}
                        </motion.div>

                        {/* Department Breakdown */}
                        {deptList.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}
                            >
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700 }}>
                                    Department-Wise Enrollment
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    {deptList.map(([dept, count]) => (
                                        <div key={dept} style={{
                                            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                                            padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{dept}</span>
                                            <span style={{
                                                background: '#6366f1', color: 'white', borderRadius: '20px',
                                                padding: '2px 10px', fontSize: '12px', fontWeight: 700
                                            }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Batch Breakdown */}
                        {Object.keys(batchCounts).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}
                            >
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700 }}>
                                    Batch / Year Breakdown
                                </h2>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {Object.entries(batchCounts).sort((a, b) => b[0].localeCompare(a[0])).map(([batch, count]) => (
                                        <div key={batch} style={{
                                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                                            borderRadius: '12px', padding: '14px 20px', textAlign: 'center', minWidth: '100px'
                                        }}>
                                            <div style={{ fontSize: '22px', fontWeight: 800, color: '#065f46' }}>{count}</div>
                                            <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>Batch {batch}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* NAAC Info Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            style={{
                                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '2rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <FileText size={22} color="#6366f1" />
                                    <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>NAAC / NIRF Placement Report</span>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, maxWidth: '520px', lineHeight: 1.6 }}>
                                    Generate a print-ready report for NAAC Criterion 5.2 (Student Progression) with placement statistics,
                                    sector breakdown, top recruiters, and signature blocks for TPO / Principal / IQAC.
                                </p>
                            </div>
                            <button
                                onClick={handleNAACReport}
                                disabled={generatingReport}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                                    background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px',
                                    padding: '12px 24px', fontSize: '14px', fontWeight: 600,
                                    cursor: generatingReport ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <Download size={16} />
                                {generatingReport ? 'Generating...' : 'Generate & Print'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
