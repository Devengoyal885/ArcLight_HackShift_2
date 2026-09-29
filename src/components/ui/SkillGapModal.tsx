import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { X, Brain, Target, AlertTriangle } from 'lucide-react';
import type { RoleRecommendation } from '../../services/jobRecommendationService';
import './SkillGapModal.css';

interface SkillGapModalProps {
    isOpen: boolean;
    onClose: () => void;
    recommendation: RoleRecommendation | null;
}

export function SkillGapModal({ isOpen, onClose, recommendation }: SkillGapModalProps) {
    if (!isOpen || !recommendation) return null;

    // Generate radar chart data based on job requirements and missing skills
    const requiredSkills = recommendation.role.requiredSkills || [];
    const missingSkills = recommendation.missingSkills || [];
    
    // Fallback if no skills are defined
    if (requiredSkills.length === 0) {
        requiredSkills.push('Communication', 'Problem Solving', 'Teamwork', 'Technical', 'Adaptability');
    }

    // Limit to top 6 skills for radar chart readability
    const chartSkills = requiredSkills.slice(0, 6);
    
    const data = chartSkills.map(skill => {
        // Is this skill missing?
        const isMissing = missingSkills.some(m => m.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(m.toLowerCase()));
        
        return {
            subject: skill,
            A: isMissing ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 20) + 80, // User Score
            B: 90, // Required Score
            fullMark: 100,
        };
    });

    return (
        <AnimatePresence>
            <div className="sg-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="sg-modal-content"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                >
                    <button className="sg-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>

                    <div className="sg-header">
                        <h2><Brain size={24} color="#7c3aed" /> AI Match Analysis</h2>
                        <p>{recommendation.role.title} at {recommendation.role.companyName}</p>
                    </div>

                    <div className="sg-body">
                        <div className="sg-chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Your Skills" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
                                    <Radar name="Job Requirements" dataKey="B" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="sg-analysis">
                            <div className="sg-match-score">
                                <span className="sg-score-label">Overall Match</span>
                                <div className="sg-score-value">
                                    <span style={{ color: recommendation.score >= 80 ? '#10b981' : recommendation.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                                        {recommendation.score}%
                                    </span>
                                </div>
                            </div>
                            
                            <div className="sg-section">
                                <h3><Target size={16} /> Strengths</h3>
                                <ul>
                                    {recommendation.matchReasons.map((reason, i) => (
                                        <li key={i}>{reason}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="sg-section sg-gaps">
                                <h3><AlertTriangle size={16} /> Skill Gaps</h3>
                                {missingSkills.length > 0 ? (
                                    <ul>
                                        {missingSkills.map((gap, i) => (
                                            <li key={i}>{gap}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="sg-no-gaps">Perfect match! No major skill gaps detected.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
