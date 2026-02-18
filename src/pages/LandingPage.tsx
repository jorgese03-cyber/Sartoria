import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';
import StickyCTA from '../components/landing/StickyCTA';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
    const { i18n } = useTranslation();
    const { user, loading } = useAuth();

    // Redirect if logged in
    if (!loading && user) {
        return <Navigate to="/app" replace />;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    // Simple header for landing page
    const LandingHeader = () => {
        const { t } = useTranslation('landing');
        return (
            <header className="fixed w-full bg-black/20 backdrop-blur-sm border-b border-white/10 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-serif font-bold tracking-tight whitespace-nowrap text-white">
                            SARTORIA<span className="text-[#d4af37] italic">.IA</span>
                        </span>
                    </div>
                    <div className="flex items-center space-x-8">
                        <button
                            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')}
                            className="text-sm font-medium text-gray-300 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            {i18n.language === 'en' ? 'ES' : 'EN'}
                        </button>
                        {user ? (
                            <Link to="/app" className="text-sm font-medium text-black bg-white px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl">
                                {t('nav.app', 'Go to App')}
                            </Link>
                        ) : (
                            <div className="flex items-center gap-6">
                                <Link to="/login" className="text-sm font-medium text-white hover:text-[#d4af37] transition-colors">
                                    {t('landing:nav.login', 'Log in')}
                                </Link>
                                <Link to="/register" className="text-sm font-medium text-white bg-white/10 border border-white/20 backdrop-blur-md px-6 py-2.5 rounded-xl hover:bg-white hover:text-black transition-all shadow-md hover:shadow-lg">
                                    {t('landing:nav.register', 'Get Started')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        );
    };

    return (
        <div className="bg-white min-h-screen font-sans text-gray-900">
            <LandingHeader />
            <HeroSection />
            <HowItWorksSection />
            <FeaturesSection />
            <PricingSection />
            <FAQSection />
            <Footer />
            <StickyCTA />
        </div>
    );
}
