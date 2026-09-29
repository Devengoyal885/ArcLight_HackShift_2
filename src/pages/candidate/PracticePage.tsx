import { useState, useEffect } from 'react';
import { fetchLeetCodeProblems, normalizeDifficulty } from '../../services/leetcodeService';
import type { LCProblem } from '../../services/leetcodeService';
import { Link } from 'react-router-dom';
import { Code2, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import './PracticePage.css';

export default function PracticePage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const [problems, setProblems] = useState<LCProblem[]>([]);
    const [totalProblems, setTotalProblems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [difficulty, setDifficulty] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [practiceTab, setPracticeTab] = useState<'coding' | 'hr' | 'company' | 'papers'>('coding');
    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        setLoading(true);
        const skip = (page - 1) * ITEMS_PER_PAGE;
        fetchLeetCodeProblems(ITEMS_PER_PAGE, skip, search, difficulty, [])
            .then(data => {
                setProblems(data.questions);
                setTotalProblems(data.total);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, search, difficulty]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [search, difficulty]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const totalPages = Math.ceil(totalProblems / ITEMS_PER_PAGE);

    return (
        <div className="prac-page">
            <div className="prac-header">
                    <div>
                        <h1 className="prac-title"><Code2 size={28} color="#2563eb" /> Practice Hub</h1>
                        <p className="prac-subtitle">Master coding problems, HR questions, and company papers.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <button 
                        onClick={() => setPracticeTab('coding')} 
                        style={{ padding: '8px 16px', background: practiceTab === 'coding' ? '#eff6ff' : 'transparent', color: practiceTab === 'coding' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Coding (LeetCode)
                    </button>
                    <button 
                        onClick={() => setPracticeTab('hr')} 
                        style={{ padding: '8px 16px', background: practiceTab === 'hr' ? '#eff6ff' : 'transparent', color: practiceTab === 'hr' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        HR Question Bank
                    </button>
                    <button 
                        onClick={() => setPracticeTab('company')} 
                        style={{ padding: '8px 16px', background: practiceTab === 'company' ? '#eff6ff' : 'transparent', color: practiceTab === 'company' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Company Specific
                    </button>
                    <button 
                        onClick={() => setPracticeTab('papers')} 
                        style={{ padding: '8px 16px', background: practiceTab === 'papers' ? '#eff6ff' : 'transparent', color: practiceTab === 'papers' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Past Placement Papers
                    </button>
                </div>

                {practiceTab === 'coding' && (
                    <>

                <div className="prac-filters">
                    <form className="prac-search-box" onSubmit={handleSearchSubmit}>
                        <Search size={18} color="#64748b" />
                        <input
                            type="text"
                            placeholder="Search problems... (Press Enter)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="prac-search-input"
                        />
                    </form>
                    
                    <select
                        className="prac-select"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="all">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>

                {loading ? (
                    <div className="prac-loading">
                        <div className="prac-spinner" />
                        <p>Loading problems...</p>
                    </div>
                ) : (
                    <div className="prac-table-container">
                        <table className="prac-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Title</th>
                                    <th>Difficulty</th>
                                    <th>Tags</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {problems.map((p, i) => {
                                    const diff = normalizeDifficulty(p.difficulty);
                                    return (
                                        <tr key={p.titleSlug} className="prac-row">
                                            <td className="prac-col-status">
                                                <div className="prac-status-dash" />
                                            </td>
                                            <td className="prac-col-title">
                                                {((page - 1) * ITEMS_PER_PAGE) + i + 1}. {p.title}
                                            </td>
                                            <td className="prac-col-diff">
                                                <span className={`prac-diff-badge prac-diff-${diff}`}>
                                                    {p.difficulty}
                                                </span>
                                            </td>
                                            <td className="prac-col-tags">
                                                <div className="prac-tags-wrap">
                                                    {p.topicTags.slice(0, 3).map(t => (
                                                        <span key={t.slug} className="prac-tag">{t.name}</span>
                                                    ))}
                                                    {p.topicTags.length > 3 && <span className="prac-tag">+{p.topicTags.length - 3}</span>}
                                                </div>
                                            </td>
                                            <td className="prac-col-action">
                                                <Link
                                                    to={`/candidate/practice/solve/${p.titleSlug}`}
                                                    state={{ lcProblem: p }}
                                                    className="prac-solve-btn"
                                                >
                                                    Solve <ExternalLink size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {problems.length === 0 && (
                            <div className="prac-empty">No problems match your filters.</div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="prac-pagination">
                        <button
                            className="prac-page-btn"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <span className="prac-page-info">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className="prac-page-btn"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
                </>
                )}

                {practiceTab === 'hr' && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '16px' }}>HR Round Question Bank</h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Top behavioral and cultural questions asked by FAANG and top startups.</p>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {['Tell me about a time you failed.', 'Why do you want to join our company?', 'Where do you see yourself in 5 years?', 'Describe a conflict with a teammate and how you resolved it.'].map((q, i) => (
                                <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 500, color: '#1e293b' }}>{q}</span>
                                    <button style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#334155', fontSize: '13px', cursor: 'pointer' }}>View Tips</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {practiceTab === 'company' && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '16px' }}>Company-Specific Interview Questions</h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Filter real interview questions asked by specific companies.</p>
                        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {['Google', 'Microsoft', 'Amazon', 'Meta', 'Goldman Sachs', 'Atlassian'].map(c => (
                                <div key={c} style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#0f172a' }}>{c}</h3>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>120+ Questions</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {practiceTab === 'papers' && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '16px' }}>Previous Year Placement Papers</h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Download or practice past aptitude and technical papers from on-campus drives.</p>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {['TCS NQT 2023 - Slot 1', 'Infosys SP Mock Test', 'Wipro Elite NLTH 2022', 'Cognizant GenC Aptitude'].map((paper, i) => (
                                <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{paper}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Aptitude • Logical • Verbal</div>
                                    </div>
                                    <button style={{ padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Start Test</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
}
