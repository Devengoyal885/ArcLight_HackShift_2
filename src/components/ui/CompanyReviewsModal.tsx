import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Building2, MapPin, ExternalLink, Loader2, ThumbsUp, Sparkles } from 'lucide-react';
import { geminiGenerate } from '../../services/geminiProxyService';
import './CompanyReviewsModal.css';

interface Review {
    id: string;
    rating: number;
    title: string;
    pros: string;
    cons: string;
    role: string;
}

interface Props {
    companyName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CompanyReviewsModal({ companyName, isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        if (isOpen && companyName) {
            loadCompanyData();
        }
    }, [isOpen, companyName]);

    const loadCompanyData = async () => {
        setLoading(true);
        try {
            const prompt = `Generate a realistic company culture review and 3 employee reviews for "${companyName}". 
Respond in JSON format:
{
  "summary": "2-3 sentences about the company's work culture, work-life balance, and growth opportunities.",
  "reviews": [
    {
      "id": "1",
      "rating": 4,
      "title": "Great learning curve",
      "pros": "Smart colleagues, good tech stack",
      "cons": "Long hours sometimes",
      "role": "Software Engineer"
    }
  ]
}
Make it sound like Glassdoor reviews.`;
            
            const raw = await geminiGenerate(prompt, { temperature: 0.7 });
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                setSummary(data.summary);
                setReviews(data.reviews);
            }
        } catch (e) {
            console.error(e);
            setSummary("Could not load company culture information at this time.");
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="company-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="company-modal-content"
                    onClick={e => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                >
                    <button className="company-modal-close" onClick={onClose}><X size={20} /></button>
                    
                    <div className="company-modal-header">
                        <div className="company-modal-logo">
                            <Building2 size={32} color="#3b82f6" />
                        </div>
                        <div>
                            <h2 className="company-modal-title">{companyName}</h2>
                            <div className="company-modal-subtitle">
                                <span className="company-rating">
                                    N/A <Star size={14} fill="#94a3b8" color="#94a3b8" />
                                </span>
                                <span>Based on AI synthesis</span>
                            </div>
                        </div>
                    </div>

                    <div className="company-modal-body">
                        {loading ? (
                            <div className="company-modal-loading">
                                <Loader2 size={32} className="spin" color="#3b82f6" />
                                <p>Analyzing company culture...</p>
                            </div>
                        ) : (
                            <>
                                <div className="company-culture-summary">
                                    <h3><Sparkles size={16} color="#6366f1" /> AI Synthesized Culture</h3>
                                    <p>{summary}</p>
                                </div>

                                <div className="company-reviews-list">
                                    <h3>Recent Reviews</h3>
                                    {reviews.map(r => (
                                        <div key={r.id} className="company-review-card">
                                            <div className="review-header">
                                                <div className="review-title">"{r.title}"</div>
                                                <span className="review-role">{r.role}</span>
                                            </div>
                                            <div className="review-rating">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={14} 
                                                        fill={i < r.rating ? "#f59e0b" : "#e2e8f0"} 
                                                        color={i < r.rating ? "#f59e0b" : "#e2e8f0"} 
                                                    />
                                                ))}
                                            </div>
                                            <div className="review-body">
                                                <div className="review-pros">
                                                    <strong>Pros</strong>
                                                    <span className="review-text">{r.pros}</span>
                                                </div>
                                                <div className="review-cons">
                                                    <strong>Cons</strong>
                                                    <span className="review-text">{r.cons}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
