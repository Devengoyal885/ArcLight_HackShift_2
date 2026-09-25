import './CapabilityFingerprint.css';

interface CapabilityFingerprintProps {
    capabilities: Record<string, number>;
    size?: number;
    accentColor?: string;
}

export function CapabilityFingerprint({ capabilities, size = 320, accentColor = '#6366f1' }: CapabilityFingerprintProps) {
    const entries = Object.entries(capabilities).slice(0, 10); // cap at 10 axes max
    const n = entries.length;
    if (n < 3) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            Add at least 3 capabilities to see your fingerprint.
        </div>
    );

    const center = size / 2;
    const maxRadius = center - 52; // leave room for labels
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

    function polar(angle: number, r: number) {
        const rad = (angle - 90) * (Math.PI / 180);
        return {
            x: center + r * Math.cos(rad),
            y: center + r * Math.sin(rad),
        };
    }

    const angleStep = 360 / n;

    // Build the filled skill polygon
    const shapePts = entries
        .map(([, v], i) => polar(i * angleStep, (v / 100) * maxRadius))
        .map(p => `${p.x},${p.y}`)
        .join(' ');

    // Gradient ID must be unique
    const gradId = 'fp-gradient';
    const glowId = 'fp-glow';

    return (
        <div className="fingerprint-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
                    </radialGradient>
                    <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background circle */}
                <circle cx={center} cy={center} r={maxRadius} fill="#f8faff" stroke="#e2e8f0" strokeWidth={1} />

                {/* Grid rings */}
                {levels.map((l, li) => {
                    const pts = entries.map((_, i) => {
                        const p = polar(i * angleStep, l * maxRadius);
                        return `${p.x},${p.y}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={l}
                            points={pts}
                            fill="none"
                            stroke={li === levels.length - 1 ? '#cbd5e1' : '#e2e8f0'}
                            strokeWidth={li === levels.length - 1 ? 1.5 : 1}
                            strokeDasharray={li < levels.length - 1 ? '3,3' : undefined}
                        />
                    );
                })}

                {/* Ring percentage labels */}
                {levels.map((l) => {
                    const p = polar(0, l * maxRadius);
                    return (
                        <text
                            key={l}
                            x={p.x + 4}
                            y={p.y - 3}
                            fontSize="8"
                            fill="#94a3b8"
                            fontFamily="Inter, sans-serif"
                            fontWeight="600"
                        >
                            {Math.round(l * 100)}
                        </text>
                    );
                })}

                {/* Spokes */}
                {entries.map((_, i) => {
                    const outer = polar(i * angleStep, maxRadius);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={outer.x}
                            y2={outer.y}
                            stroke="#e2e8f0"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Filled capability shape */}
                <polygon
                    points={shapePts}
                    fill={`url(#${gradId})`}
                    stroke={accentColor}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    filter={`url(#${glowId})`}
                />

                {/* Data points on the shape */}
                {entries.map(([, v], i) => {
                    const p = polar(i * angleStep, (v / 100) * maxRadius);
                    return (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r={5} fill="white" stroke={accentColor} strokeWidth={2} />
                            <circle cx={p.x} cy={p.y} r={2.5} fill={accentColor} />
                        </g>
                    );
                })}

                {/* Skill Labels */}
                {entries.map(([label, val], i) => {
                    const labelR = maxRadius + 28;
                    const p = polar(i * angleStep, labelR);
                    const anchor = p.x < center - 6 ? 'end' : p.x > center + 6 ? 'start' : 'middle';
                    // Score label (small, inside)
                    const scoreP = polar(i * angleStep, (val / 100) * maxRadius - 12);
                    return (
                        <g key={i}>
                            <text
                                x={p.x}
                                y={p.y - 4}
                                textAnchor={anchor}
                                dominantBaseline="auto"
                                fontSize="10"
                                fill="#1e293b"
                                fontFamily="Inter, sans-serif"
                                fontWeight="700"
                            >
                                {label.length > 12 ? label.slice(0, 11) + '…' : label}
                            </text>
                            <text
                                x={p.x}
                                y={p.y + 9}
                                textAnchor={anchor}
                                dominantBaseline="auto"
                                fontSize="9"
                                fill={accentColor}
                                fontFamily="Inter, sans-serif"
                                fontWeight="600"
                            >
                                {val}%
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px 16px',
                justifyContent: 'center', maxWidth: `${size}px`
            }}>
                {entries.map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: accentColor, opacity: Math.max(0.3, val / 100),
                        }} />
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
