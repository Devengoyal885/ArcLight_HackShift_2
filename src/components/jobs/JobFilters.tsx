/**
 * JobFilters.tsx
 * ──────────────
 * Ported & adapted from job-find's FilterSidebar.tsx
 *
 * A collapsible advanced filter panel that can be dropped into any
 * Capable page that shows job/opportunity listings.
 *
 * Provides: keyword · skills (multi-select) · work type chips ·
 *           experience level chips · salary slider · company · source
 */

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import './JobFilters.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkType = 'remote' | 'hybrid' | 'onsite';
export type ExperienceLevel = 'intern' | 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export interface JobFilterState {
    keyword: string;
    skills: string[];
    workTypes: WorkType[];
    experience: ExperienceLevel | '';
    salaryMin: number | null;
    company: string;
    source: string;
}

export const emptyFilters: JobFilterState = {
    keyword: '',
    skills: [],
    workTypes: [],
    experience: '',
    salaryMin: null,
    company: '',
    source: '',
};

export function countActiveFilters(f: JobFilterState): number {
    return (
        (f.keyword ? 1 : 0) +
        f.skills.length +
        f.workTypes.length +
        (f.experience ? 1 : 0) +
        (f.salaryMin != null ? 1 : 0) +
        (f.company ? 1 : 0) +
        (f.source ? 1 : 0)
    );
}

interface JobFiltersProps {
    filters: JobFilterState;
    onChange: (next: JobFilterState) => void;
    resultCount?: number;
    loading?: boolean;
    /** Available skills for autocomplete (from the platform's skill list) */
    suggestedSkills?: string[];
    /** Show inline (collapsed toggle) vs always-expanded */
    variant?: 'panel' | 'inline';
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['intern', 'entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
const WORK_TYPES: { value: WorkType; label: string; emoji: string }[] = [
    { value: 'remote',  label: 'Remote',  emoji: '🌍' },
    { value: 'hybrid',  label: 'Hybrid',  emoji: '🔀' },
    { value: 'onsite',  label: 'Onsite',  emoji: '🏢' },
];
const SALARY_STEPS = [0, 100000, 300000, 500000, 800000, 1200000, 2000000];

export default function JobFilters({
    filters,
    onChange,
    resultCount,
    loading = false,
    suggestedSkills = [],
    variant = 'panel',
}: JobFiltersProps) {
    const [open, setOpen] = useState(variant === 'panel');
    const [skillInput, setSkillInput] = useState('');

    const activeCount = countActiveFilters(filters);
    const set = <K extends keyof JobFilterState>(key: K, val: JobFilterState[K]) =>
        onChange({ ...filters, [key]: val });

    const toggleWorkType = (wt: WorkType) => {
        const next = filters.workTypes.includes(wt)
            ? filters.workTypes.filter(w => w !== wt)
            : [...filters.workTypes, wt];
        set('workTypes', next);
    };

    const addSkill = (skill: string) => {
        const s = skill.trim().toLowerCase();
        if (!s || filters.skills.includes(s)) { setSkillInput(''); return; }
        set('skills', [...filters.skills, s]);
        setSkillInput('');
    };

    const removeSkill = (skill: string) =>
        set('skills', filters.skills.filter(s => s !== skill));

    const formatSalary = (val: number) =>
        val === 0 ? 'Any' : val >= 100000 ? `₹${(val / 100000).toFixed(0)}L+` : `₹${(val / 1000).toFixed(0)}k+`;

    const filteredSuggestions = suggestedSkills
        .filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !filters.skills.includes(s))
        .slice(0, 5);

    if (!open) {
        return (
            <button className="jf-toggle" onClick={() => setOpen(true)} id="job-filters-toggle">
                <Filter size={15} />
                <span>Filters{activeCount > 0 ? ` · ${activeCount}` : ''}</span>
                <ChevronDown size={14} />
            </button>
        );
    }

    return (
        <div className="jf-panel" id="job-filters-panel">
            {/* Header */}
            <div className="jf-header">
                <div className="jf-header-left">
                    <Filter size={15} />
                    <span className="jf-title">Filters{activeCount > 0 ? ` (${activeCount})` : ''}</span>
                    {loading && <span className="jf-loading-dot" />}
                    {resultCount !== undefined && !loading && (
                        <span className="jf-count">{resultCount.toLocaleString()} result{resultCount === 1 ? '' : 's'}</span>
                    )}
                </div>
                <div className="jf-header-right">
                    {activeCount > 0 && (
                        <button className="jf-clear" onClick={() => onChange(emptyFilters)}>
                            Clear all
                        </button>
                    )}
                    {variant === 'inline' && (
                        <button className="jf-close" onClick={() => setOpen(false)} aria-label="Close filters">
                            <ChevronUp size={15} />
                        </button>
                    )}
                </div>
            </div>

            <div className="jf-body">
                {/* Keyword */}
                <Field label="Keyword">
                    <input
                        className="jf-input"
                        id="jf-keyword"
                        placeholder="Job title, e.g. Backend Engineer"
                        value={filters.keyword}
                        onChange={e => set('keyword', e.target.value)}
                    />
                </Field>

                {/* Skills */}
                <Field label="Skills">
                    <div className="jf-skill-chips">
                        {filters.skills.map(s => (
                            <span key={s} className="jf-skill-chip">
                                {s}
                                <button onClick={() => removeSkill(s)} aria-label={`Remove ${s}`}><X size={11} /></button>
                            </span>
                        ))}
                    </div>
                    <div className="jf-skill-input-wrap">
                        <input
                            className="jf-input"
                            id="jf-skills"
                            placeholder="Type a skill and press Enter…"
                            value={skillInput}
                            onChange={e => setSkillInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSkill(skillInput)}
                        />
                        {filteredSuggestions.length > 0 && skillInput && (
                            <div className="jf-suggestions">
                                {filteredSuggestions.map(s => (
                                    <button key={s} className="jf-suggestion-item" onClick={() => addSkill(s)}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Field>

                {/* Work Type */}
                <Field label="Work type">
                    <div className="jf-chip-row">
                        {WORK_TYPES.map(({ value, label, emoji }) => (
                            <button
                                key={value}
                                className={`jf-chip${filters.workTypes.includes(value) ? ' active' : ''}`}
                                onClick={() => toggleWorkType(value)}
                                id={`jf-worktype-${value}`}
                            >
                                {emoji} {label}
                            </button>
                        ))}
                    </div>
                </Field>

                {/* Experience */}
                <Field label="Experience level">
                    <div className="jf-chip-row jf-chip-wrap">
                        {EXPERIENCE_LEVELS.map(lvl => (
                            <button
                                key={lvl}
                                className={`jf-chip${filters.experience === lvl ? ' active' : ''}`}
                                onClick={() => set('experience', filters.experience === lvl ? '' : lvl)}
                                id={`jf-exp-${lvl}`}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                </Field>

                {/* Salary */}
                <Field label={`Min salary — ${formatSalary(filters.salaryMin ?? 0)}`}>
                    <input
                        type="range"
                        className="jf-slider"
                        id="jf-salary"
                        min={0}
                        max={SALARY_STEPS.length - 1}
                        step={1}
                        value={SALARY_STEPS.findIndex(v => v === (filters.salaryMin ?? 0)) < 0 ? 0 : SALARY_STEPS.findIndex(v => v >= (filters.salaryMin ?? 0))}
                        onChange={e => {
                            const idx = Number(e.target.value);
                            const val = SALARY_STEPS[idx];
                            set('salaryMin', val === 0 ? null : val);
                        }}
                        aria-label="Minimum salary filter"
                    />
                    <div className="jf-slider-labels">
                        <span>Any</span>
                        <span>₹1L</span>
                        <span>₹3L</span>
                        <span>₹5L</span>
                        <span>₹8L</span>
                        <span>₹12L</span>
                        <span>₹20L+</span>
                    </div>
                </Field>

                {/* Company */}
                <Field label="Company">
                    <input
                        className="jf-input"
                        id="jf-company"
                        placeholder="Company name"
                        value={filters.company}
                        onChange={e => set('company', e.target.value)}
                    />
                </Field>

                {/* Source */}
                <Field label="Source">
                    <div className="jf-chip-row jf-chip-wrap">
                        {['remotive', 'adzuna', 'linkedin', 'internal', 'serper'].map(src => (
                            <button
                                key={src}
                                className={`jf-chip${filters.source === src ? ' active' : ''}`}
                                onClick={() => set('source', filters.source === src ? '' : src)}
                                id={`jf-source-${src}`}
                            >
                                {src}
                            </button>
                        ))}
                    </div>
                </Field>
            </div>
        </div>
    );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="jf-field">
            <div className="jf-field-label">{label}</div>
            {children}
        </div>
    );
}

// ─── Filter logic helper ───────────────────────────────────────────────────────

/**
 * Apply JobFilterState to any array of opportunity-like objects.
 * Call this instead of duplicating the filter logic across pages.
 */
export function applyJobFilters<T extends {
    title?: string;
    company?: string;
    tags?: string[];
    remote?: boolean;
    location?: string;
    salary?: string;
    stipend?: string;
    source?: string;
    description?: string;
}>(items: T[], filters: JobFilterState): T[] {
    let out = [...items];

    if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        out = out.filter(o =>
            (o.title || '').toLowerCase().includes(kw) ||
            (o.company || '').toLowerCase().includes(kw) ||
            (o.description || '').toLowerCase().includes(kw)
        );
    }

    if (filters.skills.length > 0) {
        out = out.filter(o => {
            const itemText = ((o.title || '') + ' ' + (o.description || '') + ' ' + (o.tags || []).join(' ')).toLowerCase();
            return filters.skills.some(sk => itemText.includes(sk));
        });
    }

    if (filters.workTypes.length > 0) {
        out = out.filter(o => {
            const loc = ((o.location || '') + ' ' + (o.description || '')).toLowerCase();
            return filters.workTypes.some(wt => {
                if (wt === 'remote') return o.remote || loc.includes('remote') || loc.includes('wfh');
                if (wt === 'hybrid') return loc.includes('hybrid');
                if (wt === 'onsite') return !o.remote && !loc.includes('remote') && !loc.includes('hybrid');
                return true;
            });
        });
    }

    if (filters.experience) {
        const exp = filters.experience;
        out = out.filter(o => {
            const text = ((o.title || '') + ' ' + (o.description || '')).toLowerCase();
            if (exp === 'intern') return text.includes('intern') || text.includes('trainee');
            if (exp === 'entry') return text.includes('entry') || text.includes('fresher') || text.includes('graduate');
            if (exp === 'junior') return text.includes('junior') || text.includes('jr');
            if (exp === 'mid') return text.includes('mid') || text.includes('2-4') || text.includes('2-5');
            if (exp === 'senior') return text.includes('senior') || text.includes('sr');
            if (exp === 'lead') return text.includes('lead') || text.includes('tech lead');
            if (exp === 'principal') return text.includes('principal') || text.includes('staff');
            return true;
        });
    }

    if (filters.salaryMin != null) {
        out = out.filter(o => {
            const raw = String(o.salary || o.stipend || '');
            if (!raw) return false;
            // Parse "6 LPA", "₹8–12 LPA", "600000" etc.
            const nums = raw.replace(/[^0-9.]/g, ' ').trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
            if (!nums.length) return false;
            const val = nums[0];
            // If value looks like LPA (< 100), convert to absolute
            const abs = val < 1000 ? val * 100000 : val;
            return abs >= (filters.salaryMin ?? 0);
        });
    }

    if (filters.company) {
        const co = filters.company.toLowerCase();
        out = out.filter(o => (o.company || '').toLowerCase().includes(co));
    }

    if (filters.source) {
        out = out.filter(o => (o.source || '').toLowerCase() === filters.source);
    }

    return out;
}
