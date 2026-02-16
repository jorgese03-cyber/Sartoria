import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export default function PricingSection() {
    const { t } = useTranslation(['pricing', 'landing']);

    const features = [
        t('feature_unlimited_wardrobe'),
        t('feature_daily_outfits'),
        t('feature_weekly_planning'),
        t('feature_ai_image'),
        t('feature_wardrobe_analysis'),
        t('feature_purchase_recommendations'),
        t('feature_travel_planner'),
    ];

    return (
        <section className="bg-gray-900 py-12 sm:py-16 lg:py-20 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="sm:text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        {t('title')}
                    </h2>
                </div>

                <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">

                    {/* Monthly Plan */}
                    <div className="border border-gray-700 rounded-lg shadow-sm divide-y divide-gray-700 bg-gray-800">
                        <div className="p-6">
                            <h3 className="text-lg leading-6 font-medium text-white">{t('monthly')}</h3>
                            <p className="mt-4">
                                <span className="text-4xl font-extrabold text-white tracking-tight">{t('monthly_price')}</span>
                            </p>
                            <p className="mt-1 text-sm text-gray-400">{t('trial')}</p>
                            <Link
                                to="/register"
                                className="mt-8 block w-full bg-gray-600 border border-gray-600 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-700"
                            >
                                {t('start_trial')}
                            </Link>
                        </div>
                        <div className="pt-6 pb-8 px-6">
                            <h4 className="text-sm font-medium text-gray-300 tracking-wide uppercase">What's included</h4>
                            <ul className="mt-6 space-y-4">
                                {features.map((feature) => (
                                    <li key={feature} className="flex space-x-3">
                                        <Check className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                                        <span className="text-sm text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Yearly Plan */}
                    <div className="border border-indigo-500 rounded-lg shadow-lg divide-y divide-gray-700 bg-gray-800 relative">
                        <div className="absolute top-0 right-0 -mt-3 -mr-3 px-3 py-1 bg-green-500 rounded-full text-xs font-bold uppercase tracking-wide text-white transform rotate-2">
                            {t('save_badge')}
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg leading-6 font-medium text-white">{t('yearly')}</h3>
                            <p className="mt-4">
                                <span className="text-4xl font-extrabold text-white tracking-tight">{t('yearly_price')}</span>
                            </p>
                            <p className="mt-1 text-sm text-indigo-400 font-semibold">{t('yearly_equivalent')}</p>
                            <p className="mt-1 text-sm text-gray-400">{t('trial')}</p>
                            <Link
                                to="/register"
                                className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700"
                            >
                                {t('start_trial')}
                            </Link>
                        </div>
                        <div className="pt-6 pb-8 px-6">
                            <h4 className="text-sm font-medium text-gray-300 tracking-wide uppercase">What's included</h4>
                            <ul className="mt-6 space-y-4">
                                {features.map((feature) => (
                                    <li key={feature} className="flex space-x-3">
                                        <Check className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                                        <span className="text-sm text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
