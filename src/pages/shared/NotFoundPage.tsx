import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';
import './NotFoundPage.css';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <motion.div 
                className="not-found-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="not-found-icon-wrapper">
                    <ShieldAlert size={64} className="not-found-icon" />
                </div>
                
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Page Not Found</h2>
                <p className="not-found-desc">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="not-found-actions">
                    <button className="not-found-btn-secondary" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} /> Go Back
                    </button>
                    <button className="not-found-btn-primary" onClick={() => navigate('/')}>
                        <Home size={18} /> Home Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
