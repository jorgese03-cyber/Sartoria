import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

export default function FAQSection() {
    const { t } = useTranslation('landing');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q4'), a: t('faq.a4') },
        { q: t('faq.q5'), a: t('faq.a5') },
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        {t('faq.title')}
                    </h2>
                </div>
                <dl className="space-y-6 divide-y divide-gray-200">
                    {faqs.map((faq, index) => (
                        <div key={index} className="pt-6">
                            <dt className="text-lg">
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="text-left w-full flex justify-between items-start text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded p-2 -ml-2"
                                >
                                    <span className="font-medium text-gray-900">{faq.q}</span>
                                    <span className="ml-6 h-7 flex items-center">
                                        {openIndex === index ? (
                                            <ChevronUp className="h-6 w-6 transform" aria-hidden="true" />
                                        ) : (
                                            <ChevronDown className="h-6 w-6 transform" aria-hidden="true" />
                                        )}
                                    </span>
                                </button>
                            </dt>
                            <dd
                                className={clsx(
                                    "mt-2 pr-12 transition-all duration-300 ease-in-out overflow-hidden",
                                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <p className="text-base text-gray-500">{faq.a}</p>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
