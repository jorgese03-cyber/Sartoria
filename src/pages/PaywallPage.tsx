import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, LogOut } from 'lucide-react';

export default function Paywall() {
    const { t } = useTranslation(['landing', 'common']);
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

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
                    {t('paywall.title', 'Your subscription has expired')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('paywall.subtitle', 'Choose a plan to continue using SARTORIA')}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Monthly */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('plans.monthly.name', 'Monthly')}</h3>
                        <p className="mt-4 text-4xl font-extrabold text-gray-900">€4.99</p>
                        <p className="text-sm text-gray-500">/mo</p>
                        <button
                            onClick={() => handleCheckout('monthly')}
                            disabled={loading}
                            className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('reactivate', 'Reactivate')}
                        </button>
                    </div>

                    {/* Yearly */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border-2 border-indigo-500 p-6 text-center relative hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 -mt-2 mr-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                            {t('plans.best_value', 'Save 25%')}
                        </div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">{t('plans.yearly.name', 'Yearly')}</h3>
                        <p className="mt-4 text-4xl font-extrabold text-gray-900">€44.99</p>
                        <p className="text-sm text-gray-500">/year</p>
                        <button
                            onClick={() => handleCheckout('yearly')}
                            disabled={loading}
                            className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('reactivate', 'Reactivate')}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => signOut()}
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center justify-center mx-auto"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('sign_out', 'Sign out')}
                    </button>
                </div>
            </div>
        </div>
    );
}
