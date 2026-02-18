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
        <section className="py-24 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif font-medium text-gray-900 sm:text-4xl">
                        {t('features.title')}
                    </h2>
                    <div className="mt-4 w-24 h-1 bg-[#d4af37] mx-auto opacity-50"></div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.name} className="flex flex-col items-center text-center group p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gray-50 text-gray-900 mb-6 group-hover:bg-white group-hover:shadow-md transition-all border border-gray-100">
                                <feature.icon className="h-8 w-8" strokeWidth={1} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 font-serif tracking-wide">{feature.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
