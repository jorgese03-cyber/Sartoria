import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';
import StickyCTA from '../components/landing/StickyCTA';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
    const { i18n } = useTranslation();

    // Simple header for landing page
    const LandingHeader = () => (
        <header className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-serif font-bold tracking-tight">
                        SARTORIA<span className="text-indigo-600">.IA</span>
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en')}
                        className="text-sm text-gray-500 hover:text-gray-900"
                    >
                        {i18n.language === 'en' ? 'ES' : 'EN'}
                    </button>
                    <Link to="/app" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        {/* Temporary link to app */}
                        Login
                    </Link>
                </div>
            </div>
        </header>
    );

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
