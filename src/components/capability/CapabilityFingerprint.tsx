import './CapabilityFingerprint.css';

interface CapabilityFingerprintProps {
    capabilities: Record<string, number>;
    size?: number;
    accentColor?: string;
}

export function CapabilityFingerprint({ capabilities, size = 200, accentColor = '#2563eb' }: CapabilityFingerprintProps) {
    const entries = Object.entries(capabilities);
    const n = entries.length;
    if (n === 0) return null;

    const center = size / 2;
    const maxRadius = center - 24;
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

    function polar(angle: number, r: number) {
        const rad = (angle - 90) * (Math.PI / 180);
        return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
    }

    const angleStep = 360 / n;
    const shapePts = entries
        .map(([, v], i) => polar(i * angleStep, (v / 100) * maxRadius))
        .map(p => `${p.x},${p.y}`)
        .join(' ');

    return (
        <div className="fingerprint-wrap">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Grid rings */}
                {levels.map((l) => (
                    <polygon
                        key={l}
                        points={entries.map((_, i) => {
                            const p = polar(i * angleStep, l * maxRadius);
                            return `${p.x},${p.y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth={1}
                    />
                ))}
                {/* Spokes */}
                {entries.map((_, i) => {
                    const outer = polar(i * angleStep, maxRadius);
                    return <line key={i} x1={center} y1={center} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />;
                })}
                {/* Shape */}
                <polygon
                    points={shapePts}
                    fill={accentColor}
                    fillOpacity={0.15}
                    stroke={accentColor}
                    strokeWidth={1.5}
                />
                {/* Points */}
                {entries.map(([, v], i) => {
                    const p = polar(i * angleStep, (v / 100) * maxRadius);
                    return <circle key={i} cx={p.x} cy={p.y} r={3} fill={accentColor} />;
                })}
                {/* Labels */}
                {entries.map(([label], i) => {
                    const labelR = maxRadius + 16;
                    const p = polar(i * angleStep, labelR);
                    const isLeft = p.x < center - 4;
                    return (
                        <text
                            key={i}
                            x={p.x}
                            y={p.y}
                            textAnchor={isLeft ? 'end' : p.x > center + 4 ? 'start' : 'middle'}
                            dominantBaseline="middle"
                            fontSize="9"
                            fill="rgba(255,255,255,0.5)"
                            fontFamily="Inter, sans-serif"
                            fontWeight="500"
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
