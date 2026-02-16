import { useTranslation } from 'react-i18next';
import { Sparkles, CloudSun, Layers, Search, ShoppingBag, Smartphone, Image as ImageIcon, Calendar, Briefcase } from 'lucide-react';

export default function FeaturesSection() {
    const { t } = useTranslation('landing');

    const features = [
        { name: t('features.ai_style'), icon: Sparkles },
        { name: t('features.weather'), icon: CloudSun },
        { name: t('features.no_repeat'), icon: Layers }, // Approximate icon
        { name: t('features.wardrobe_analysis'), icon: Search },
        { name: t('features.shopping'), icon: ShoppingBag },
        { name: t('features.mobile'), icon: Smartphone },
        { name: t('features.ai_image'), icon: ImageIcon },
        { name: t('features.planning'), icon: Calendar },
        { name: t('features.travel'), icon: Briefcase }, // Briefcase for travel/suitcase based
    ];

    return (
        <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        {t('features.title')}
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.name} className="flex flex-col items-center text-center">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                                <feature.icon className="h-8 w-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
