import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
    const { t } = useTranslation('landing');

    return (
        <section className="relative bg-gray-900 overflow-hidden min-h-[90vh] flex items-center">
            <div className="absolute inset-0 z-0">
                {/* High-fashion background */}
                <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=2600&auto=format&fit=crop"
                    alt="Man adjusting suit cuffs"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl tracking-tight font-serif font-medium text-white sm:text-7xl md:text-8xl mb-8 animate-fade-in-up drop-shadow-lg">
                        <span className="block">SARTORIA</span>
                        <span className="block text-[#d4af37] italic">.IA</span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-200 font-light leading-relaxed animate-fade-in-up delay-100 drop-shadow-md">
                        {t('hero_subtitle', 'Your AI personal stylist. Curated outfits for every occasion, tailored to your unique wardrobe.')}
                    </p>
                    <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4 animate-fade-in-up delay-200">
                        <Link
                            to="/register"
                            className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-black bg-white hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            {t('cta', 'Start now')}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        {/* Secondary CTA */}
                        <a
                            href="#how-it-works"
                            className="w-full flex items-center justify-center px-8 py-4 border border-white/30 text-lg font-medium rounded-xl text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                        >
                            {t('learn_more', 'How it works')}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
