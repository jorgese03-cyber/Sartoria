import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

export default function FAQSection() {
    const { t } = useTranslation('landing');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        { q: t('faq.q1', 'How does the AI Stylist work?'), a: t('faq.a1', 'Our AI analyzes your wardrobe, local weather, and occasion to generate perfect outfit combinations.') },
        { q: t('faq.q2', 'Do I need to upload photos of my clothes?'), a: t('faq.a2', 'Yes, for the best results. You can also use our database of generic items to get started quickly.') },
        { q: t('faq.q3', 'Is there a free trial?'), a: t('faq.a3', 'Absolutely. You get 7 days of full access to all premium features.') },
        { q: t('faq.q4', 'Can I cancel anytime?'), a: t('faq.a4', 'Yes, you can cancel your subscription at any time from your account settings.') },
        { q: t('faq.q5', 'Does it work for travel packing?'), a: t('faq.a5', 'Yes! Just enter your destination and dates, and we\'ll generate a complete packing list.') },
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="bg-white py-24">
            <div className="max-w-3xl mx-auto px-6 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif font-medium text-gray-900 sm:text-4xl">
                        {t('faq.title', 'Frequently Asked Questions')}
                    </h2>
                    <div className="mt-4 w-24 h-1 bg-[#d4af37] mx-auto opacity-50"></div>
                </div>
                <dl className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-colors">
                            <dt>
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full flex justify-between items-center px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                                >
                                    <span className="font-medium text-gray-900 text-lg font-serif">{faq.q}</span>
                                    <span className="ml-6 flex-shrink-0">
                                        {openIndex === index ? (
                                            <ChevronUp className="h-5 w-5 text-[#d4af37]" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        )}
                                    </span>
                                </button>
                            </dt>
                            <dd
                                className={clsx(
                                    "px-6 transition-all duration-300 ease-in-out text-gray-600 bg-gray-50/30",
                                    openIndex === index ? "max-h-48 py-5 opacity-100" : "max-h-0 py-0 opacity-0 overflow-hidden"
                                )}
                            >
                                <p className="leading-relaxed">{faq.a}</p>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
