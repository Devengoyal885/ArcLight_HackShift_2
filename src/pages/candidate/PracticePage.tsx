import { useState, useEffect } from 'react';
import { fetchLeetCodeProblems, normalizeDifficulty } from '../../services/leetcodeService';
import type { LCProblem } from '../../services/leetcodeService';
import { Link } from 'react-router-dom';
import { Code2, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import './PracticePage.css';

export default function PracticePage() {
    const [problems, setProblems] = useState<LCProblem[]>([]);
    const [totalProblems, setTotalProblems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [difficulty, setDifficulty] = useState<string>('all');
    const [page, setPage] = useState(1);
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
                        <p className="prac-subtitle">Master {totalProblems > 0 ? totalProblems.toLocaleString() : '4,000'}+ coding problems powered by LeetCode</p>
                    </div>
                </div>

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
        </div>
    );
}
