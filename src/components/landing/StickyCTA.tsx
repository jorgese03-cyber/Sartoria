import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function StickyCTA() {
    const { t } = useTranslation('landing');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past hero section (approx 400px)
            if (window.scrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-sm transition-all duration-300 transform translate-y-0">
            <div className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-2xl rounded-full p-2 pl-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                    {t('sticky_cta.text', 'Ready to upgrade?')}
                </span>
                <Link
                    to="/register"
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-md text-white bg-black hover:bg-gray-800 transition-colors"
                >
                    {t('sticky_cta.button', 'Get Started')}
                </Link>
            </div>
        </div>
    );
}
