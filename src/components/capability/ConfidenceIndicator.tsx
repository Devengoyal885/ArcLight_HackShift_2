import './ConfidenceIndicator.css';

interface ConfidenceIndicatorProps {
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    percent?: number;
}

export function ConfidenceIndicator({ level, percent }: ConfidenceIndicatorProps) {
    return (
        <span className={`confidence confidence--${level.toLowerCase()}`}>
            <span className="confidence-dot" />
            {percent ? `${percent}% confidence` : level}
        </span>
    );
}
