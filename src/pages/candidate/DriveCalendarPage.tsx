/**
 * DriveCalendarPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Visual campus placement drive calendar for students.
 * Shows all active and upcoming drives from their institution
 * with month/week views, eligibility badges, and deadline alerts.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { useAuth } from '../../context/AuthContext';
import { getPlacementDrives } from '../../services/eligibilityService';
import type { PlacementDrive } from '../../services/eligibilityService';
import {
    ChevronLeft, ChevronRight, Calendar, Clock, MapPin,
    IndianRupee, Building2, CheckCircle2, XCircle, AlertTriangle,
    Loader2, Trophy, Filter,
} from 'lucide-react';
import './DriveCalendarPage.css';

const MONTH_NAMES = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    drives: PlacementDrive[];
}

export default function DriveCalendarPage() {
    const { profile, dbUid } = useAuth();
    const instCode = (profile as any)?.institutionCode || '';

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<PlacementDrive | null>(null);
    const [filter, setFilter] = useState<'all' | 'open' | 'upcoming'>('all');

    useEffect(() => {
        if (!instCode) { setLoading(false); return; }
        getPlacementDrives(instCode).then(d => setDrives(d)).finally(() => setLoading(false));
    }, [instCode]);

    // Build calendar grid
    const calendarDays = useMemo<CalendarDay[]>(() => {
        const firstDay = firstDayOfMonth(year, month);
        const totalDays = daysInMonth(year, month);
        const prevMonthDays = daysInMonth(year, month - 1);
        const days: CalendarDay[] = [];

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthDays - i);
            days.push({ date, isCurrentMonth: false, drives: getDrivesForDate(drives, date) });
        }

        // Current month
        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(year, month, d);
            days.push({ date, isCurrentMonth: true, drives: getDrivesForDate(drives, date) });
        }

        // Next month padding
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const date = new Date(year, month + 1, d);
            days.push({ date, isCurrentMonth: false, drives: getDrivesForDate(drives, date) });
        }

        return days;
    }, [year, month, drives]);

    const filteredDrives = useMemo(() => {
        const now = new Date();
        switch (filter) {
            case 'open': return drives.filter(d => new Date(d.deadline) >= now);
            case 'upcoming': return drives.filter(d => {
                const dl = new Date(d.deadline);
                const diff = (dl.getTime() - now.getTime()) / 86400000;
                return diff >= 0 && diff <= 7;
            });
            default: return drives;
        }
    }, [drives, filter]);

    function prevMonth() {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    }

    function nextMonth() {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    }

    const daysLeft = (deadline: string) => {
        const diff = new Date(deadline).getTime() - Date.now();
        return Math.ceil(diff / 86400000);
    };

    return (
        <div className="drc-page">
            <FloatingNavbar variant="candidate" />
            <div className="drc-content">

                {/* Header */}
                <motion.div className="drc-header" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <span className="drc-eyebrow">PLACEMENT DRIVES</span>
                        <h1>Drive Calendar</h1>
                        <p>All upcoming placement drives from your institution — at a glance</p>
                    </div>
                    <div className="drc-filter-row">
                        {(['all','open','upcoming'] as const).map(f => (
                            <button key={f} className={`drc-filter-btn ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
                                {f === 'all' ? 'All Drives' : f === 'open' ? 'Open Now' : 'Next 7 Days'}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {loading ? (
                    <div className="drc-loading"><Loader2 size={32} className="spin" /></div>
                ) : !instCode ? (
                    <div className="drc-empty">
                        <Building2 size={48} color="#e2e8f0" />
                        <h3>No Institution Linked</h3>
                        <p>Your account isn't linked to an institution. Ask your placement cell to invite you.</p>
                    </div>
                ) : (
                    <div className="drc-layout">
                        {/* Calendar panel */}
                        <div className="drc-calendar-panel">
                            <div className="drc-cal-nav">
                                <button className="drc-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
                                <h2>{MONTH_NAMES[month]} {year}</h2>
                                <button className="drc-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
                            </div>

                            <div className="drc-day-headers">
                                {DAY_NAMES.map(d => <div key={d} className="drc-day-label">{d}</div>)}
                            </div>

                            <div className="drc-grid">
                                {calendarDays.map((cell, i) => {
                                    const isToday = cell.date.toDateString() === today.toDateString();
                                    const hasDrives = cell.drives.length > 0;
                                    return (
                                        <div
                                            key={i}
                                            className={`drc-cell ${!cell.isCurrentMonth ? 'drc-cell--other' : ''} ${isToday ? 'drc-cell--today' : ''} ${hasDrives ? 'drc-cell--has-drives' : ''}`}
                                            onClick={() => cell.drives.length === 1 ? setSelected(cell.drives[0]) : undefined}
                                        >
                                            <span className="drc-cell-day">{cell.date.getDate()}</span>
                                            {cell.drives.slice(0, 2).map(drive => (
                                                <div
                                                    key={drive.id}
                                                    className="drc-event-dot"
                                                    onClick={e => { e.stopPropagation(); setSelected(drive); }}
                                                    title={drive.company + ' — ' + drive.roleTitle}
                                                >
                                                    <span>{drive.company.slice(0, 8)}</span>
                                                </div>
                                            ))}
                                            {cell.drives.length > 2 && (
                                                <div className="drc-more">+{cell.drives.length - 2} more</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Drive list sidebar */}
                        <div className="drc-sidebar">
                            <h3 className="drc-sidebar-title">
                                {filter === 'upcoming' ? '🔔 Next 7 Days' : filter === 'open' ? '✅ Open Drives' : '📅 All Drives'}
                                <span className="drc-count">{filteredDrives.length}</span>
                            </h3>

                            {filteredDrives.length === 0 ? (
                                <div className="drc-sidebar-empty">
                                    <Trophy size={32} color="#e2e8f0" />
                                    <p>No drives match this filter</p>
                                </div>
                            ) : (
                                <div className="drc-drive-list">
                                    {filteredDrives.map(drive => {
                                        const days = daysLeft(drive.deadline);
                                        const isUrgent = days >= 0 && days <= 3;
                                        const isExpired = days < 0;
                                        return (
                                            <motion.div
                                                key={drive.id}
                                                className={`drc-drive-card ${selected?.id === drive.id ? 'drc-drive-card--selected' : ''}`}
                                                onClick={() => setSelected(selected?.id === drive.id ? null : drive)}
                                                whileHover={{ scale: 1.01 }}
                                                layout
                                            >
                                                <div className="drc-drive-card-top">
                                                    <div className="drc-company-badge">{drive.company.charAt(0)}</div>
                                                    <div className="drc-drive-info">
                                                        <strong>{drive.roleTitle}</strong>
                                                        <span>{drive.company}</span>
                                                    </div>
                                                    {isExpired ? (
                                                        <div className="drc-badge drc-badge--expired">Closed</div>
                                                    ) : isUrgent ? (
                                                        <div className="drc-badge drc-badge--urgent">
                                                            <AlertTriangle size={10} />{days === 0 ? 'Today!' : `${days}d`}
                                                        </div>
                                                    ) : (
                                                        <div className="drc-badge drc-badge--open">{days}d left</div>
                                                    )}
                                                </div>

                                                <AnimatePresence>
                                                    {selected?.id === drive.id && (
                                                        <motion.div
                                                            className="drc-drive-details"
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                        >
                                                            <div className="drc-detail-grid">
                                                                {drive.package && <div className="drc-detail-item"><IndianRupee size={12} />{drive.package}</div>}
                                                                {drive.location && <div className="drc-detail-item"><MapPin size={12} />{drive.location}</div>}
                                                                <div className="drc-detail-item"><Calendar size={12} />Deadline: {new Date(drive.deadline).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                                                            </div>
                                                            {drive.description && <p className="drc-drive-desc">{drive.description}</p>}
                                                            <div className="drc-criteria">
                                                                <span className="drc-criteria-label">Eligibility:</span>
                                                                {drive.eligibility.minCGPA && <span>Min CGPA: {drive.eligibility.minCGPA}</span>}
                                                                {drive.eligibility.allowedBranches?.length && <span>Branches: {drive.eligibility.allowedBranches.join(', ')}</span>}
                                                                {drive.eligibility.maxBacklogs !== undefined && <span>Max Backlogs: {drive.eligibility.maxBacklogs}</span>}
                                                                {drive.eligibility.graduationYear && <span>Batch: {drive.eligibility.graduationYear}</span>}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Get all drives whose deadline falls on a given date */
function getDrivesForDate(drives: PlacementDrive[], date: Date): PlacementDrive[] {
    return drives.filter(d => {
        const dl = new Date(d.deadline);
        return dl.getDate() === date.getDate()
            && dl.getMonth() === date.getMonth()
            && dl.getFullYear() === date.getFullYear();
    });
}
