import './SkillGapIndicator.css';

type GapStatus = 'met' | 'gap' | 'missing';

interface SkillGapIndicatorProps {
    label: string;
    current: number;
    required: number;
    status: GapStatus;
}

const statusIcons: Record<GapStatus, string> = { met: '✓', gap: '△', missing: '✕' };
const statusLabels: Record<GapStatus, string> = { met: 'Met', gap: 'Gap', missing: 'Missing' };

export function SkillGapIndicator({ label, current, required, status }: SkillGapIndicatorProps) {
    const pct = Math.min((current / required) * 100, 100);
    return (
        <div className={`skill-gap skill-gap--${status}`}>
            <div className="skill-gap-header">
                <span className="skill-gap-icon">{statusIcons[status]}</span>
                <span className="skill-gap-label">{label}</span>
                <span className="skill-gap-status-label">{statusLabels[status]}</span>
            </div>
            <div className="skill-gap-bar-track">
                <div
                    className="skill-gap-bar-fill"
                    style={{ width: `${pct}%` }}
                />
                <div className="skill-gap-required-mark" style={{ left: '100%' }} title={`Required: ${required}%`} />
            </div>
            <div className="skill-gap-numbers">
                <span>{current > 0 ? `${current}%` : '—'}</span>
                <span>Target: {required}%</span>
            </div>
        </div>
    );
}
