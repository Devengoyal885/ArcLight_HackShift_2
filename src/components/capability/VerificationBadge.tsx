import './VerificationBadge.css';

type VerificationState = 'PREDICTED' | 'PRACTISED' | 'VERIFIED';

interface VerificationBadgeProps {
    state: VerificationState;
    size?: 'sm' | 'md';
}

export function VerificationBadge({ state, size = 'md' }: VerificationBadgeProps) {
    return (
        <span className={`vbadge vbadge--${state.toLowerCase()} vbadge--${size}`}>
            {state === 'VERIFIED' && '✓ '}
            {state === 'PRACTISED' && '◎ '}
            {state === 'PREDICTED' && '◌ '}
            {state}
        </span>
    );
}
