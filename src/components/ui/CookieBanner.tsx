import { useState, useEffect } from 'react';
import './CookieBanner.css';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-banner-container">
            <div className="cookie-banner-content">
                <p>
                    We use cookies and similar technologies (like Firebase) to securely authenticate your session, remember your preferences, and improve your experience on CapAble. 
                    By continuing to use this site, you agree to our <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </p>
                <div className="cookie-banner-actions">
                    <button onClick={acceptCookies} className="cookie-btn">
                        Accept & Close
                    </button>
                </div>
            </div>
        </div>
    );
}
