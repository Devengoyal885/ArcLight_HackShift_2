import React from 'react';
import { motion } from 'framer-motion';

export function JobSkeleton() {
    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                    zIndex: 1
                }}
            />
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Logo skeleton */}
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ width: '60%', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ width: '40%', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}></div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '80px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ width: '60px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ width: '70px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}></div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }}></div>

            <div style={{ width: '100%', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ width: '80px', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ width: '120px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }}></div>
            </div>
        </div>
    );
}
