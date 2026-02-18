import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export default function PricingSection() {
    const { t } = useTranslation(['pricing', 'landing']);

    const features = [
        t('feature_unlimited_wardrobe', 'Unlimited Wardrobe'),
        t('feature_daily_outfits', 'Daily AI Outfits'),
        t('feature_weekly_planning', 'Weekly Planning'),
        t('feature_ai_image', 'AI Try-On'),
        t('feature_wardrobe_analysis', 'Wardrobe Analysis'),
        t('feature_purchase_recommendations', 'Smart Shopping'),
        t('feature_travel_planner', 'Travel Packer'),
    ];

    return (
        <section id="pricing" className="bg-[#0a0a0a] py-24 text-white relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif font-medium text-white sm:text-4xl">
                        {t('title', 'Simple, Transparent Pricing')}
                    </h2>
                    <p className="mt-4 text-gray-400 font-light">
                        Start with a 7-day free trial. Cancel anytime.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-2 lg:max-w-4xl lg:mx-auto">
                    {/* Monthly Plan */}
                    <div className="border border-gray-800 rounded-2xl p-8 bg-gray-900/50 backdrop-blur-sm flex flex-col hover:border-gray-700 transition-colors">
                        <div className="mb-6">
                            <h3 className="text-xl font-medium text-white font-serif">{t('monthly', 'Monthly')}</h3>
                            <p className="mt-4 flex items-baseline">
                                <span className="text-4xl font-light text-white tracking-tight">{t('monthly_price', '€9.99')}</span>
                                <span className="ml-2 text-gray-400">/mo</span>
                            </p>
                            <p className="mt-2 text-sm text-gray-400">{t('trial', '7-day free trial')}</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {features.map((feature) => (
                                <li key={feature} className="flex items-start">
                                    <Check className="flex-shrink-0 h-5 w-5 text-gray-400 mt-0.5" aria-hidden="true" />
                                    <span className="ml-3 text-sm text-gray-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            to="/register"
                            className="block w-full bg-gray-800 border border-transparent rounded-xl py-4 text-sm font-medium text-white text-center hover:bg-gray-700 transition-all"
                        >
                            {t('start_trial', 'Start Free Trial')}
                        </Link>
                    </div>

                    {/* Yearly Plan */}
                    <div className="border border-[#d4af37] rounded-2xl p-8 bg-gray-900 relative flex flex-col shadow-2xl shadow-indigo-900/10">
                        <div className="absolute top-0 right-0 -mt-4 mr-6 px-4 py-1 bg-[#d4af37] text-black rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                            {t('save_badge', 'Best Value')}
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-medium text-white font-serif">{t('yearly', 'Yearly')}</h3>
                            <p className="mt-4 flex items-baseline">
                                <span className="text-4xl font-light text-white tracking-tight">{t('yearly_price', '€79.99')}</span>
                                <span className="ml-2 text-gray-500">/year</span>
                            </p>
                            <p className="mt-2 text-sm text-[#d4af37]">{t('yearly_equivalent', 'Just €6.66/mo')}</p>
                            <p className="mt-1 text-sm text-gray-400">{t('trial', '7-day free trial')}</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {features.map((feature) => (
                                <li key={feature} className="flex items-start">
                                    <Check className="flex-shrink-0 h-5 w-5 text-[#d4af37] mt-0.5" aria-hidden="true" />
                                    <span className="ml-3 text-sm text-gray-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            to="/register"
                            className="block w-full bg-[#d4af37] border border-transparent rounded-xl py-4 text-sm font-bold text-black text-center hover:bg-[#b5952f] transition-all shadow-lg hover:shadow-[#d4af37]/20"
                        >
                            {t('start_trial', 'Start Free Trial')}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
