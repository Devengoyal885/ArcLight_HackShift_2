import './CapabilityScore.css';

interface CapabilityScoreProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    label?: string;
    showPercent?: boolean;
}

export function CapabilityScore({ score, size = 'md', color, label, showPercent = true }: CapabilityScoreProps) {
    const radius = size === 'lg' ? 44 : size === 'sm' ? 24 : 34;
    const stroke = size === 'lg' ? 4 : 3;
    const cx = radius + stroke;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const c = color || 'var(--color-electric)';

    return (
        <div className={`cap-score cap-score--${size}`}>
            <svg width={cx * 2} height={cx * 2} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cx} r={radius} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} />
                <circle
                    cx={cx} cy={cx} r={radius} fill="none"
                    stroke={c}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
                />
            </svg>
            <div className="cap-score-inner">
                <span className="cap-score-number" style={{ color: c }}>
                    {showPercent ? `${score}` : score}
                </span>
                {showPercent && <span className="cap-score-pct">%</span>}
            </div>
            {label && <div className="cap-score-label">{label}</div>}
        </div>
    );
}
