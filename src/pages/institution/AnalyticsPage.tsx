import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { getAllStudents } from '../../services/institutionService';
import { useAuth } from '../../context/AuthContext';
import { generateNAACReport, printNAACReport } from '../../services/naacReportService';
import type { UserProfile } from '../../services/profileService';
import {
    BarChart3, Loader2, AlertCircle, FileText, TrendingUp,
    Users, Briefcase, Award, Download, CalendarDays
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

    // Readiness Heatmap Calculation
    const readinessData = Object.keys(deptCounts).map(dept => {
        const deptStudents = students.filter(s => (s as any).department === dept || (!s.department && dept === 'General'));
        let needsIntervention = 0;
        let progressing = 0;
        let placementReady = 0;

        deptStudents.forEach(s => {
            const score = Math.min(100,
                (s.profileComplete ? 30 : 0) +
                ((s.skills?.length || 0) * 5) +
                (s.resumeUrl ? 20 : 0) +
                (s.githubUsername ? 10 : 0) +
                (s.linkedinUrl ? 10 : 0)
            );
            if (score >= 76) placementReady++;
            else if (score >= 41) progressing++;
            else needsIntervention++;
        });

        return {
            department: dept,
            'Needs Intervention': needsIntervention,
            'Progressing': progressing,
            'Placement Ready': placementReady,
        };
    });


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

                        {/* Offer & Compensation Insights */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                            {/* Year-wise Trends Chart */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', gridColumn: '1 / -1' }}
                            >
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CalendarDays size={18} color="#10b981" /> Year-wise Placement Trends
                                </h2>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={[
                                            { year: '2020', placed: 180, offers: 210 },
                                            { year: '2021', placed: 240, offers: 280 },
                                            { year: '2022', placed: 320, offers: 400 },
                                            { year: '2023', placed: 450, offers: 510 },
                                            { year: '2024', placed: 520, offers: 640 }
                                        ]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#334155' }} />
                                            <Line type="monotone" dataKey="placed" name="Students Placed" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="offers" name="Total Offers" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Student Readiness Heatmap */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', gridColumn: '1 / -1' }}
                            >
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Award size={18} color="#f59e0b" />
                                    Student Readiness Heatmap (by Department)
                                </h2>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                                    Distribution of student readiness based on profile completeness, skill validation, and professional presence.
                                </p>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={readinessData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                cursor={{ fill: '#f8fafc' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                            <Bar dataKey="Needs Intervention" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="Progressing" stackId="a" fill="#f59e0b" />
                                            <Bar dataKey="Placement Ready" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}
                            >
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={18} color="#f59e0b" /> Compensation & Offers
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Highest CTC</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>₹42.5 LPA</div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Average CTC</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>₹8.2 LPA</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1, padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                        <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Accepted Offers</div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46' }}>342</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                        <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>Declined Offers</div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>14</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}
                            >
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={18} color="#2563eb" /> Company Funnel (Top 3)
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        { company: 'Google', applied: 420, shortlisted: 85, offered: 12 },
                                        { company: 'Microsoft', applied: 380, shortlisted: 60, offered: 8 },
                                        { company: 'Amazon', applied: 450, shortlisted: 110, offered: 25 }
                                    ].map(c => (
                                        <div key={c.company} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{c.company}</div>
                                            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${(c.applied/500)*100}%`, background: '#cbd5e1' }} title={`Applied: ${c.applied}`} />
                                                <div style={{ width: `${(c.shortlisted/c.applied)*100}%`, background: '#60a5fa' }} title={`Shortlisted: ${c.shortlisted}`} />
                                                <div style={{ width: `${(c.offered/c.shortlisted)*100}%`, background: '#2563eb' }} title={`Offered: ${c.offered}`} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                                                <span>{c.applied} Apps</span>
                                                <span>{c.offered} Offers</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.39 }}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}
                            >
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={18} color="#ec4899" /> Gender Diversity in Placements
                                </h2>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Female Hires</div>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#ec4899' }}>184</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Male Hires</div>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>158</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: '54%', background: '#ec4899' }} title="Female: 54%" />
                                    <div style={{ width: '46%', background: '#3b82f6' }} title="Male: 46%" />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}
                                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}
                            >
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={18} color="#8b5cf6" /> Time-to-Placement
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Within 1 Month (Aug)</span>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>45%</span>
                                    </div>
                                    <div style={{ background: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: '45%', background: '#8b5cf6', height: '100%' }} />
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Within 3 Months (Oct)</span>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>82%</span>
                                    </div>
                                    <div style={{ background: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: '82%', background: '#6366f1', height: '100%' }} />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

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
