import './MetricStrip.css';

interface Metric {
    label: string;
    value: string | number;
    sublabel?: string;
    accent?: string;
}

interface MetricStripProps {
    metrics: Metric[];
}

export function MetricStrip({ metrics }: MetricStripProps) {
    return (
        <div className="metric-strip">
            {metrics.map((m, i) => (
                <div key={i} className="metric-strip-item">
                    <span className="metric-value" style={m.accent ? { color: m.accent } : undefined}>
                        {m.value}
                    </span>
                    <span className="metric-label">{m.label}</span>
                    {m.sublabel && <span className="metric-sublabel">{m.sublabel}</span>}
                </div>
            ))}
        </div>
    );
}
