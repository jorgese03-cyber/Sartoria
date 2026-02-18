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
        <section id="how-it-works" className="py-24 bg-[#F5F0EB]">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2
                        className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-4"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                        {t('how_it_works.title', 'Cómo funciona')}
                    </h2>
                    <div className="w-8 h-px bg-[#8B7355] mx-auto" />
                </div>

                <div className="grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-12">
                    {steps.map((step) => (
                        <div key={step.id} className="text-center">
                            <div className="mb-6">
                                <step.icon className="h-6 w-6 mx-auto text-[#1A1A1A]" strokeWidth={1} />
                            </div>
                            <span className="text-[11px] tracking-[0.15em] uppercase text-[#8B7355] mb-3 block">
                                Paso {step.id}
                            </span>
                            <h3 className="font-serif font-normal text-xl text-[#1A1A1A] mb-3 tracking-wide">
                                {step.title}
                            </h3>
                            <p className="text-[#6B6B6B] font-light text-sm leading-relaxed max-w-xs mx-auto">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
