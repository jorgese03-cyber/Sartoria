import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Loader2, ArrowRight, Check } from 'lucide-react';

export default function RegisterPage() {
    const { t } = useTranslation(['auth', 'landing']);

    const [step, setStep] = useState<'register' | 'plan'>('register');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                setUserId(data.user.id);
                setStep('plan'); // Move to plan selection
            }
        } catch (err: any) {
            setError(err.message || 'Error creating account');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelection = async (plan: 'monthly' | 'yearly') => {
        if (!userId) return;
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    plan,
                    user_id: userId,
                    email: email,
                    return_url: window.location.origin
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err: any) {
            setError(err.message || 'Error creating checkout session');
            setLoading(false);
        }
    };

    if (step === 'register') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="text-center">
                        <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
                            {t('signup.title', 'Create your account')}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {t('signup.subtitle', 'Start your journey with SARTORIA')}
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="email-address" className="sr-only">
                                    {t('email', 'Email address')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder={t('email_placeholder', 'Email address')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    {t('password', 'Password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        minLength={8}
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder={t('password_placeholder', 'Password (min. 8 chars)')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                ) : (
                                    <span className="flex items-center">
                                        {t('signup.button', 'Create Account')}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            {t('has_account', 'Already have an account?')}{' '}
                            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                {t('login_link', 'Sign in')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Plan Selection Step
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    {t('plans.title', 'Choose your plan')}
                </h2>
                <p className="mt-4 text-xl text-gray-600">
                    {t('plans.subtitle', 'First 15 days free. Cancel anytime.')}
                </p>

                {error && (
                    <div className="max-w-md mx-auto mt-4 text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="mt-8 flex justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                        <span className="ml-2 text-gray-600">{t('processing', 'Processing...')}</span>
                    </div>
                )}

                <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-8 max-w-2xl mx-auto">
                    {/* Monthly Plan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-gray-900">{t('plans.monthly.name', 'Monthly')}</h3>
                        <p className="mt-4 flex items-baseline justify-center text-gray-900">
                            <span className="text-4xl font-extrabold tracking-tight">€4.99</span>
                            <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
                        </p>
                        <p className="mt-2 text-sm text-green-600 font-medium">{t('trial_badge', '15 days free trial')}</p>

                        <ul role="list" className="mt-6 space-y-4">
                            {/* Features list - simplified for brevity */}
                            {['Unlimited wardrobe', '2 daily outfits', 'Weekly planning'].map((feature) => (
                                <li key={feature} className="flex">
                                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                    <span className="ml-3 text-gray-500">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handlePlanSelection('monthly')}
                            disabled={loading}
                            className="mt-8 w-full block bg-indigo-50 border border-transparent rounded-md py-3 px-6 text-base font-medium text-indigo-700 hover:bg-indigo-100 md:py-4 md:text-lg md:px-10"
                        >
                            {t('plans.monthly.cta', 'Start Free Trial')}
                        </button>
                    </div>

                    {/* Yearly Plan */}
                    <div className="relative bg-white rounded-2xl shadow-sm border-2 border-indigo-500 p-8 hover:shadow-lg transition-shadow">
                        <div className="absolute top-0 right-0 -mt-4 mr-4 bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wide">
                            {t('plans.best_value', 'Save 25%')}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('plans.yearly.name', 'Yearly')}</h3>
                        <p className="mt-4 flex items-baseline justify-center text-gray-900">
                            <span className="text-4xl font-extrabold tracking-tight">€44.99</span>
                            <span className="ml-1 text-xl font-semibold text-gray-500">/year</span>
                        </p>
                        <p className="mt-2 text-sm text-gray-500">{t('plans.yearly.equivalent', 'Just €3.75/month')}</p>
                        <p className="mt-1 text-sm text-green-600 font-medium">{t('trial_badge', '15 days free trial')}</p>

                        <ul role="list" className="mt-6 space-y-4">
                            {/* Features list */}
                            {['Unlimited wardrobe', '2 daily outfits', 'Weekly planning'].map((feature) => (
                                <li key={feature} className="flex">
                                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                    <span className="ml-3 text-gray-500">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handlePlanSelection('yearly')}
                            disabled={loading}
                            className="mt-8 w-full block bg-indigo-600 border border-transparent rounded-md py-3 px-6 text-base font-medium text-white hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-md"
                        >
                            {t('plans.yearly.cta', 'Start Free Trial')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
