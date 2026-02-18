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
        <div className="min-h-screen bg-[#F9F9F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-8">
                    <span className="text-2xl font-serif font-bold tracking-tight text-gray-900">
                        SARTORIA<span className="text-[#d4af37]">.IA</span>
                    </span>
                </div>
                <h2 className="mt-6 text-center text-3xl font-serif font-medium text-gray-900">
                    {t('pricing:title', 'Unlock the full potential of your wardrobe')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500 font-light">
                    {t('subscription:expired', 'Your trial has ended. Subscribe to continue.')}
                </p>
            </div>

            <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Monthly */}
                    <div className="bg-white rounded-2xl shadow-premium border border-gray-100 p-8 text-center hover:shadow-lg transition-all duration-300 flex flex-col">
                        <h3 className="text-xl font-medium text-gray-900 font-serif">{t('pricing:monthly', 'Monthly')}</h3>
                        <p className="mt-6 flex items-baseline justify-center">
                            <span className="text-5xl font-light text-gray-900 tracking-tight">€4.99</span>
                            <span className="ml-2 text-gray-500">/mo</span>
                        </p>
                        <p className="text-sm text-gray-400 mt-2 mb-8">{t('pricing:monthly', 'Monthly billing')}</p>

                        <ul className="text-left space-y-4 mb-8 flex-1">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                    </div>
                                    <span className="ml-3 text-sm text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleCheckout('monthly')}
                            disabled={loading}
                            className="w-full inline-flex justify-center py-4 px-6 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('pricing:start_trial', 'Subscribe Monthly')}
                        </button>
                    </div>

                    {/* Yearly */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-[#d4af37]/30 p-8 text-center relative hover:shadow-[#d4af37]/10 transition-all duration-300 flex flex-col">
                        <div className="absolute top-0 right-0 -mt-4 mr-6 px-4 py-1.5 bg-[#d4af37] text-white text-xs font-bold uppercase tracking-widest shadow-lg rounded-full">
                            {t('pricing:save_badge', 'Save 25%')}
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 font-serif">{t('pricing:yearly', 'Yearly')}</h3>
                        <p className="mt-6 flex items-baseline justify-center">
                            <span className="text-5xl font-light text-gray-900 tracking-tight">€44.99</span>
                            <span className="ml-2 text-gray-500">/year</span>
                        </p>
                        <p className="text-sm text-[#d4af37] font-medium mt-2 mb-8">{t('pricing:yearly_equivalent', 'Just €3.75/mo')}</p>

                        <ul className="text-left space-y-4 mb-8 flex-1">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />
                                    </div>
                                    <span className="ml-3 text-sm text-gray-900 font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleCheckout('yearly')}
                            disabled={loading}
                            className="w-full inline-flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all hover:shadow-xl"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : t('pricing:start_trial', 'Subscribe Yearly')}
                        </button>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => signOut()}
                        className="group inline-flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        {t('auth:login', 'Back to Login')}
                    </button>
                </div>
            </div>
        </div>
    );
}
