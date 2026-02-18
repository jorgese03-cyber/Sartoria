import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
    const { t } = useTranslation('landing');

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Full-screen editorial photo */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2600&auto=format&fit=crop"
                    alt="Editorial Fashion"
                    className="w-full h-full object-cover"
                />
                {/* Subtle dark overlay for text readability */}
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-fade-in">
                <h1
                    className="font-serif font-normal text-white tracking-[0.08em] leading-tight mb-8"
                    style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}
                >
                    Tu estilista personal<br />con inteligencia artificial
                </h1>
                <p className="text-white/70 text-base font-light max-w-lg mx-auto mb-12 leading-relaxed">
                    {t('hero_subtitle', 'SARTORIA analiza tu armario, el clima y tu agenda para vestirte impecable cada día.')}
                </p>
                <Link
                    to="/register"
                    className="inline-block border border-white text-white text-[12px] tracking-[0.12em] uppercase px-12 py-4 hover:bg-white hover:text-[#1A1A1A] transition-all duration-300"
                >
                    Descubrir
                </Link>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                <div className="w-px h-12 bg-white/30 mx-auto mb-2" />
                <span className="text-[10px] tracking-[0.15em] uppercase text-white/40">Scroll</span>
            </div>
        </section>
    );
}
