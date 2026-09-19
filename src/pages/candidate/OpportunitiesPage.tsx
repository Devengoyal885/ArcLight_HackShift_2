import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { OpportunityFitSignature } from '../../components/capability/OpportunityFitSignature';
import { opportunities } from '../../data/candidate';
import { Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import './OpportunitiesPage.css';

type OppState = 'READY NOW' | 'NEAR MATCH' | 'SKILL-BUILDING' | 'ALL';

const stateColors: Record<string, string> = {
    'READY NOW': '#10b981',
    'NEAR MATCH': '#2563eb',
    'SKILL-BUILDING': '#f59e0b',
};

export default function OpportunitiesPage() {
    const [filter, setFilter] = useState<OppState>('ALL');
    const [expanded, setExpanded] = useState<string | null>(null);

    const filtered = filter === 'ALL' ? opportunities : opportunities.filter(o => o.state === filter);

    return (
        <div className="opp-page">
            <FloatingNavbar variant="candidate" />
            <div className="opp-bg" />

            <main className="opp-main">
                <motion.div className="opp-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="opp-eyebrow">OPPORTUNITY RADAR</p>
                    <h1 className="opp-title">Find opportunities that match<br /><em>what you can actually do.</em></h1>
                    <p className="opp-sub">Not based on keywords. Based on verified capabilities and evidence.</p>
                </motion.div>

                {/* Filter pills */}
                <div className="opp-filters">
                    {(['ALL', 'READY NOW', 'NEAR MATCH', 'SKILL-BUILDING'] as OppState[]).map((f) => (
                        <button
                            key={f}
                            className={`opp-filter-btn ${filter === f ? 'opp-filter-btn--active' : ''}`}
                            onClick={() => setFilter(f)}
                            style={filter === f && f !== 'ALL'
                                ? { background: stateColors[f] + '22', borderColor: stateColors[f] + '55', color: stateColors[f] }
                                : undefined}
                        >
                            {f !== 'ALL' && <span className="opp-filter-dot" style={{ background: stateColors[f] }} />}
                            {f}
                        </button>
                    ))}
                </div>

                {/* Opportunity cards */}
                <div className="opp-list">
                    <AnimatePresence>
                        {filtered.map((opp, i) => {
                            const isExpanded = expanded === opp.id;
                            return (
                                <motion.div
                                    key={opp.id}
                                    className="opp-card"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ delay: i * 0.06 }}
                                    layout
                                >
                                    <div className="opp-card-main" onClick={() => setExpanded(isExpanded ? null : opp.id)}>
                                        <div className="opp-card-match-col">
                                            <span className="opp-card-match" style={{ color: stateColors[opp.state] }}>
                                                {opp.match}%
                                            </span>
                                            <span className="opp-card-match-label">Match</span>
                                        </div>

                                        <div className="opp-card-info">
                                            <h3 className="opp-card-title">{opp.title}</h3>
                                            <p className="opp-card-company">{opp.company}</p>
                                            <div className="opp-card-meta">
                                                <span
                                                    className="opp-card-state"
                                                    style={{ color: stateColors[opp.state], borderColor: stateColors[opp.state] + '66' }}
                                                >
                                                    <span className="opp-state-dot" style={{ background: stateColors[opp.state] }} />
                                                    {opp.state}
                                                </span>
                                                <span className="opp-card-deadline">
                                                    <Calendar size={11} />
                                                    {opp.deadline}
                                                </span>
                                            </div>
                                        </div>

                                        <button className="opp-expand-btn">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                className="opp-card-detail"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            >
                                                <div className="opp-detail-inner">
                                                    <OpportunityFitSignature
                                                        capabilityMatch={opp.capabilityMatch}
                                                        evidenceMatch={opp.evidenceMatch}
                                                        experienceMatch={opp.experienceMatch}
                                                        learningAlignment={opp.learningAlignment}
                                                        overall={opp.match}
                                                    />
                                                    <div className="opp-detail-actions">
                                                        <button className="opp-action-primary">Generate Resume <ExternalLink size={14} /></button>
                                                        <button className="opp-action-secondary">View Details</button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
