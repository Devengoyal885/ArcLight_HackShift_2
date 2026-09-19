import './OpportunityFitSignature.css';

interface OpportunityFitSignatureProps {
    capabilityMatch: number;
    evidenceMatch: number;
    experienceMatch: number;
    learningAlignment: number;
    overall: number;
}

export function OpportunityFitSignature({ capabilityMatch, evidenceMatch, experienceMatch, learningAlignment, overall }: OpportunityFitSignatureProps) {
    const bars = [
        { label: 'Capability Match', value: capabilityMatch },
        { label: 'Evidence Match', value: evidenceMatch },
        { label: 'Experience Match', value: experienceMatch },
        { label: 'Learning Alignment', value: learningAlignment },
    ];

    const getColor = (v: number) => v >= 90 ? '#10b981' : v >= 75 ? '#2563eb' : v >= 60 ? '#f59e0b' : '#f4845f';

    return (
        <div className="opp-fit">
            <div className="opp-fit-overall">
                <span className="opp-fit-number" style={{ color: getColor(overall) }}>{overall}%</span>
                <span className="opp-fit-label">Match</span>
            </div>
            <div className="opp-fit-bars">
                {bars.map((b) => (
                    <div key={b.label} className="opp-fit-row">
                        <span className="opp-fit-bar-label">{b.label}</span>
                        <div className="opp-fit-bar-track">
                            <div className="opp-fit-bar-fill" style={{ width: `${b.value}%`, background: getColor(b.value) }} />
                        </div>
                        <span className="opp-fit-bar-val" style={{ color: getColor(b.value) }}>{b.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
