import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { i18n } = useTranslation();
    const { user, loading } = useAuth();

    if (!loading && user) {
        return <Navigate to="/app" replace />;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <span className="text-[#6B6B6B] text-sm tracking-[0.1em] uppercase">Cargando...</span>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen text-[#1A1A1A]">
            {/* Navbar — Massimo Dutti style */}
            <header className="fixed w-full bg-transparent z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                    <span className="font-serif font-normal tracking-[0.15em] text-white" style={{ fontSize: '18px' }}>
                        SARTORIA
                    </span>
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')}
                            className="text-[11px] tracking-[0.1em] uppercase text-white/70 hover:text-white transition-colors"
                        >
                            {i18n.language === 'en' ? 'ES' : 'EN'}
                        </button>
                        <Link
                            to="/login"
                            className="text-[12px] tracking-[0.1em] uppercase text-white/90 hover:text-white transition-colors"
                        >
                            Acceso
                        </Link>
                    </div>
                </div>
            </header>

            <HeroSection />
            <HowItWorksSection />
            <FeaturesSection />
            <PricingSection />
            <FAQSection />
            <Footer />
        </div>
    );
}
