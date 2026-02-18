import { useTranslation } from 'react-i18next';
import { Camera, Shirt, Check } from 'lucide-react';

export default function HowItWorksSection() {
    const { t } = useTranslation('landing');

    const steps = [
        {
            id: 1,
            title: t('how_it_works.step1_title'),
            desc: t('how_it_works.step1_desc'),
            icon: Camera,
        },
        {
            id: 2,
            title: t('how_it_works.step2_title'),
            desc: t('how_it_works.step2_desc'),
            icon: Shirt,
        },
        {
            id: 3,
            title: t('how_it_works.step3_title'),
            desc: t('how_it_works.step3_desc'),
            icon: Check,
        },
    ];

    return (
        <section id="how-it-works" className="py-24 bg-[#F9F9F9]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif font-medium text-gray-900 sm:text-4xl">
                        {t('how_it_works.title')}
                    </h2>
                    <div className="mt-4 w-24 h-1 bg-[#d4af37] mx-auto opacity-50"></div>
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                    {steps.map((step, index) => (
                        <div key={step.id} className="relative group">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-serif text-xl border-4 border-[#F9F9F9] z-10 shadow-lg">
                                {index + 1}
                            </div>
                            <div className="bg-white rounded-2xl p-10 shadow-premium border border-gray-50 h-full flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-2">
                                <div className="mb-6 p-4 bg-gray-50 rounded-full inline-block group-hover:bg-[#f3e5ab] transition-colors rounded-2xl">
                                    <step.icon className="h-8 w-8 text-gray-900" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-3 font-serif">
                                    {step.title}
                                </h3>
                                <p className="text-gray-500 font-light leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
