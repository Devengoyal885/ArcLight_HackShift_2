import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

interface LottieBackgroundProps {
    animationPath?: string;
}

export function LottieBackground({ animationPath = '/employee-animation.json' }: LottieBackgroundProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        
        let animation: any = null;
        let isDestroyed = false;

        fetch(animationPath)
            .then(res => res.json())
            .then(data => {
                if (isDestroyed || !containerRef.current) return;
                animation = lottie.loadAnimation({
                    container: containerRef.current,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    animationData: data,
                    rendererSettings: {
                        preserveAspectRatio: 'xMidYMid slice'
                    }
                });
            })
            .catch(console.error);

        return () => {
            isDestroyed = true;
            if (animation) {
                animation.destroy();
            }
        };
    }, [animationPath]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.15,
            }}
        />
    );
}
