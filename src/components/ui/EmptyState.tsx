import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    actionElement?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, actionElement }: EmptyStateProps) {
    return (
        <motion.div 
            className="empty-state-wrapper"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="empty-state-icon-container">
                <Icon size={48} className="empty-state-icon" strokeWidth={1.5} />
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-description">{description}</p>
            
            {action && !actionElement && (
                <button className="empty-state-btn" onClick={action.onClick}>
                    {action.label}
                </button>
            )}
            
            {actionElement && (
                <div className="empty-state-action-element">
                    {actionElement}
                </div>
            )}
        </motion.div>
    );
}
