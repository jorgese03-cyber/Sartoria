import { useTranslation } from 'react-i18next';
import { Sparkles, CloudSun, Layers, Search, ShoppingBag, Smartphone, Image as ImageIcon, Calendar, Briefcase } from 'lucide-react';

export default function FeaturesSection() {
    const { t } = useTranslation('landing');

    const features = [
        { name: t('features.ai_style'), icon: Sparkles },
        { name: t('features.weather'), icon: CloudSun },
        { name: t('features.no_repeat'), icon: Layers },
        { name: t('features.wardrobe_analysis'), icon: Search },
        { name: t('features.shopping'), icon: ShoppingBag },
        { name: t('features.mobile'), icon: Smartphone },
        { name: t('features.ai_image'), icon: ImageIcon },
        { name: t('features.planning'), icon: Calendar },
        { name: t('features.travel'), icon: Briefcase },
    ];

    return (
        <section id="features" className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2
                        className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-4"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                        {t('features.title', 'Características')}
                    </h2>
                    <div className="w-8 h-px bg-[#8B7355] mx-auto" />
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-14 md:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.name} className="text-center group">
                            <feature.icon
                                className="h-5 w-5 mx-auto mb-4 text-[#1A1A1A] opacity-60 group-hover:opacity-100 transition-opacity"
                                strokeWidth={1}
                            />
                            <h3 className="text-sm text-[#1A1A1A] tracking-wide">
                                {feature.name}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
