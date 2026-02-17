import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, LogOut } from 'lucide-react';

export default function Paywall() {
    const { t } = useTranslation(['landing', 'common']);
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    const features = [
        t('pricing:feature_unlimited_wardrobe', 'Unlimited wardrobe'),
        t('pricing:feature_daily_outfits', 'Daily outfit recommendations'),
        t('pricing:feature_weekly_planning', 'Weekly planning'),
        t('pricing:feature_ai_image', 'AI-generated visuals'),
        t('pricing:feature_wardrobe_analysis', 'Wardrobe analysis'),
        t('pricing:feature_travel_planner', 'Travel planner')
    ];

    const handleCheckout = async (plan: 'monthly' | 'yearly') => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    plan,
                    user_id: user.id,
                    email: user.email,
                    return_url: window.location.origin
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
            alert('Error initiating checkout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {t('pricing:title', 'Unlock the full potential of your wardrobe')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('subscription:expired', 'Your trial has ended. Subscribe to continue.')}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Monthly */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition-shadow flex flex-col">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('pricing:monthly', 'Monthly')}</h3>
                        <p className="mt-4 text-4xl font-extrabold text-gray-900">{t('pricing:monthly_price', '€4.99')}</p>
                        <p className="text-sm text-gray-500 mb-6">{t('pricing:monthly', 'Monthly billing')}</p>

                        <ul className="text-left space-y-3 mb-8 flex-1">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2 text-sm text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleCheckout('monthly')}
                            disabled={loading}
                            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('pricing:start_trial', 'Subscribe Monthly')}
                        </button>
                    </div>

                    {/* Yearly */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border-2 border-indigo-500 p-6 text-center relative hover:shadow-md transition-shadow flex flex-col">
                        <div className="absolute top-0 right-0 -mt-2 mr-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                            {t('pricing:save_badge', 'Save 25%')}
                        </div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('pricing:yearly', 'Yearly')}</h3>
                        <p className="mt-4 text-4xl font-extrabold text-gray-900">{t('pricing:yearly_price', '€44.99')}</p>
                        <p className="text-sm text-gray-500 mb-6">{t('pricing:yearly_equivalent', 'Just €3.75/mo')}</p>

                        <ul className="text-left space-y-3 mb-8 flex-1">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2 text-sm text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleCheckout('yearly')}
                            disabled={loading}
                            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('pricing:start_trial', 'Subscribe Yearly')}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => signOut()}
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center justify-center mx-auto"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('auth:login', 'Back to Login')}
                    </button>
                </div>
            </div>
        </div>
    );
}
