import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SkillRadarProps {
    capabilities: { skill: string; score: number; targetScore?: number }[];
    targetRole?: string;
}

export default function SkillRadarChart({ capabilities, targetRole }: SkillRadarProps) {
    if (!capabilities || capabilities.length === 0) return null;

    // We need at least 3 points for a radar chart to look like a polygon.
    // If we have fewer, we can pad it with empty placeholder skills.
    const data = [...capabilities].map(c => ({
        ...c,
        targetScore: c.targetScore || Math.min(100, c.score + 20) // Mock target score for demonstration if not provided
    }));
    while (data.length < 3 && data.length > 0) {
        data.push({ skill: `Skill ${data.length + 1}`, score: 0, targetScore: 50 });
    }

    return (
        <div style={{ width: '100%', height: 280, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                        dataKey="skill" 
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                    />
                    <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            background: '#1e293b', 
                            border: '1px solid #334155', 
                            borderRadius: '8px', 
                            color: '#f8fafc',
                            fontSize: '12px'
                        }} 
                        itemStyle={{ fontWeight: 600 }}
                    />
                    <Radar
                        name={targetRole ? `Target: ${targetRole}` : "Target Score"}
                        dataKey="targetScore"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.1}
                    />
                    <Radar
                        name="Your Score"
                        dataKey="score"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
