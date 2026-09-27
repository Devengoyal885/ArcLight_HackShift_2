/**
 * LiquidMetalButton.tsx
 * ──────────────────────
 * A self-contained, reusable button system for CapAble.
 *
 * THREE VARIANTS:
 *   primary   – Liquid metal animated surface (dark navy / silver)
 *   secondary – Premium glass button
 *   tertiary  – Clean text/icon button
 *
 * All variants:
 *   - Preserve onClick, disabled, type, aria, loading, href
 *   - Respect prefers-reduced-motion
 *   - Are fully keyboard accessible
 *   - Scale/lift on hover, press-down on active
 */

import React, { forwardRef, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LiquidMetal as LiquidMetalShader } from '@paper-design/shaders-react';
import './LiquidMetalButton.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface LiquidMetalButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    href?: string;
    children: React.ReactNode;
    /** Override for link-rendered buttons (react-router Link) */
    as?: React.ElementType;
    to?: string;
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
    return (
        <svg className="lmb-spinner" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="20" />
        </svg>
    );
}

// ─── Primary — Liquid Metal ───────────────────────────────────────────────────

function PrimaryButton({
    children, loading, disabled, leftIcon, rightIcon, size = 'md', className = '', ...rest
}: LiquidMetalButtonProps) {
    const btnRef = useRef<HTMLButtonElement>(null);

    // Pointer-reactive tilt
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

    const rotateY = useTransform(springX, [0, 1], [-8, 8]);
    const rotateX = useTransform(springY, [0, 1], [6, -6]);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = btnRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
    };

    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    const sizeClass = `lmb--${size}`;
    const isDisabled = disabled || loading;

    return (
        <motion.button
            ref={btnRef as any}
            className={`lmb lmb-primary ${sizeClass} ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateY, rotateX, transformPerspective: 600 } as any}
            whileHover={isDisabled ? {} : { scale: 1.025, y: -2 }}
            whileTap={isDisabled ? {} : { scale: 0.975, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            disabled={isDisabled}
            aria-busy={loading}
            {...(rest as any)}
        >
            {/* Liquid metal background */}
            <span className="lmb-shader" aria-hidden="true">
                <LiquidMetalShader
                    colorBack="#1a2035"
                    colorTint="#c8d4f0"
                    speed={0.35}
                    repetition={3}
                    distortion={0.08}
                    softness={0}
                    shiftRed={0.2}
                    shiftBlue={-0.2}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                />
            </span>

            {/* Gloss overlay */}
            <span className="lmb-gloss" aria-hidden="true" />

            {/* Content */}
            <span className="lmb-content">
                {loading ? <Spinner /> : leftIcon}
                <span className="lmb-label">{children}</span>
                {!loading && rightIcon && <span className="lmb-icon-right">{rightIcon}</span>}
            </span>
        </motion.button>
    );
}

// ─── Secondary — Glass ───────────────────────────────────────────────────────

function SecondaryButton({
    children, loading, disabled, leftIcon, rightIcon, size = 'md', className = '', ...rest
}: LiquidMetalButtonProps) {
    const isDisabled = disabled || loading;
    return (
        <motion.button
            className={`lmb lmb-secondary lmb--${size} ${className}`}
            whileHover={isDisabled ? {} : { scale: 1.015, y: -1 }}
            whileTap={isDisabled ? {} : { scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            disabled={isDisabled}
            aria-busy={loading}
            {...(rest as any)}
        >
            <span className="lmb-content">
                {loading ? <Spinner /> : leftIcon}
                <span className="lmb-label">{children}</span>
                {!loading && rightIcon && <span className="lmb-icon-right">{rightIcon}</span>}
            </span>
        </motion.button>
    );
}

// ─── Tertiary — Text ─────────────────────────────────────────────────────────

function TertiaryButton({
    children, loading, disabled, leftIcon, rightIcon, size = 'md', className = '', ...rest
}: LiquidMetalButtonProps) {
    const isDisabled = disabled || loading;
    return (
        <motion.button
            className={`lmb lmb-tertiary lmb--${size} ${className}`}
            whileHover={isDisabled ? {} : { x: 2 }}
            whileTap={isDisabled ? {} : { x: 0, opacity: 0.7 }}
            transition={{ duration: 0.15 }}
            disabled={isDisabled}
            aria-busy={loading}
            {...(rest as any)}
        >
            <span className="lmb-content">
                {loading ? <Spinner /> : leftIcon}
                <span className="lmb-label">{children}</span>
                {!loading && rightIcon && <span className="lmb-icon-right">{rightIcon}</span>}
            </span>
        </motion.button>
    );
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const LiquidMetalButton = forwardRef<HTMLButtonElement, LiquidMetalButtonProps>(
    function LiquidMetalButton({ variant = 'primary', ...props }, _ref) {
        if (variant === 'secondary') return <SecondaryButton {...props} />;
        if (variant === 'tertiary') return <TertiaryButton {...props} />;
        return <PrimaryButton {...props} />;
    }
);

export default LiquidMetalButton;
