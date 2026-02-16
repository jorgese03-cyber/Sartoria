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
        <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center">
                    <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
                        {t('how_it_works.title')}
                    </h2>
                </div>

                <div className="mt-10">
                    <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                        {steps.map((step) => (
                            <div key={step.id} className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                        <step.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{step.title}</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">
                                    {step.desc}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}
