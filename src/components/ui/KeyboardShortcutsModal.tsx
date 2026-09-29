import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import './KeyboardShortcutsModal.css';

export default function KeyboardShortcutsModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open shortcuts on Shift + / (which is ?)
            if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="shortcuts-modal-overlay" onClick={() => setIsOpen(false)}>
                    <motion.div 
                        className="shortcuts-modal-content"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="shortcuts-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Keyboard size={20} color="#6366f1" />
                                <h2>Keyboard Shortcuts</h2>
                            </div>
                            <button className="shortcuts-close" onClick={() => setIsOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="shortcuts-body">
                            <div className="shortcuts-section">
                                <h3>Global Navigation</h3>
                                <div className="shortcut-row">
                                    <span>Command Palette</span>
                                    <div className="keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></div>
                                </div>
                                <div className="shortcut-row">
                                    <span>Keyboard Shortcuts Help</span>
                                    <div className="keys"><kbd>?</kbd></div>
                                </div>
                                <div className="shortcut-row">
                                    <span>Go to Dashboard</span>
                                    <div className="keys"><kbd>G</kbd> then <kbd>D</kbd></div>
                                </div>
                                <div className="shortcut-row">
                                    <span>Go to Profile</span>
                                    <div className="keys"><kbd>G</kbd> then <kbd>P</kbd></div>
                                </div>
                            </div>
                            
                            <div className="shortcuts-section">
                                <h3>Actions</h3>
                                <div className="shortcut-row">
                                    <span>Save / Bookmark</span>
                                    <div className="keys"><kbd>S</kbd></div>
                                </div>
                                <div className="shortcut-row">
                                    <span>Search Opportunities</span>
                                    <div className="keys"><kbd>/</kbd></div>
                                </div>
                                <div className="shortcut-row">
                                    <span>Close Modal</span>
                                    <div className="keys"><kbd>Esc</kbd></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
