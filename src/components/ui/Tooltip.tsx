import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Tooltip.css';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
    children, 
    content, 
    position = 'top',
    delay = 0.2
}) => {
    const [isVisible, setIsVisible] = useState(false);
    let timeout: NodeJS.Timeout;

    const showTip = () => {
        timeout = setTimeout(() => {
            setIsVisible(true);
        }, delay * 1000);
    };

    const hideTip = () => {
        clearTimeout(timeout);
        setIsVisible(false);
    };

    return (
        <div 
            className="tooltip-wrapper"
            onMouseEnter={showTip}
            onMouseLeave={hideTip}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        className={`tooltip-tip ${position}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
