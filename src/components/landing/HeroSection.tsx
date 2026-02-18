import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
    const { t } = useTranslation('landing');

    return (
        <section className="relative bg-white overflow-hidden min-h-[90vh] flex items-center">
            <div className="absolute inset-0 z-0">
                {/* Placeholder for high-fashion background */}
                <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2940&auto=format&fit=crop"
                    alt="Fashion Background"
                    className="w-full h-full object-cover opacity-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl tracking-tight font-serif font-medium text-gray-900 sm:text-7xl md:text-8xl mb-8 animate-fade-in-up">
                        <span className="block">SARTORIA</span>
                        <span className="block text-[#d4af37] italic">.IA</span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500 font-light leading-relaxed animate-fade-in-up delay-100">
                        {t('hero_subtitle', 'Your AI personal stylist. Curated outfits for every occasion, tailored to your unique wardrobe.')}
                    </p>
                    <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4 animate-fade-in-up delay-200">
                        <Link
                            to="/register"
                            className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-black hover:bg-gray-800 md:text-lg transition-all shadow-lg hover:shadow-xl"
                        >
                            {t('cta', 'Start your style journey')}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        {/* Secondary CTA if needed */}
                        <a
                            href="#how-it-works"
                            className="w-full flex items-center justify-center px-8 py-4 border border-gray-200 text-base font-medium rounded-full text-gray-900 bg-white hover:bg-gray-50 md:text-lg transition-all"
                        >
                            {t('learn_more', 'How it works')}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
