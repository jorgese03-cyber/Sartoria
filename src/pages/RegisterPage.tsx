import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Loader2 } from 'lucide-react';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

export default function RegisterPage() {
    const { t } = useTranslation(['auth', 'landing', 'common']);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(t('auth.errors.google_login', 'Error executing Google login') + ': ' + (err.message || ''));
        }
    };


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
                // Direct to onboarding, trial starts automatically based on created_at
                navigate('/onboarding');
            }
        } catch (err: any) {
            // Translate common error messages
            let errorMessage = err.message;
            if (errorMessage === 'Anonymous sign-ins are disabled') {
                errorMessage = t('auth.errors.anonymous_disabled', 'Registration is currently disabled. Please contact support.');
            } else if (errorMessage.includes('weak_password')) {
                errorMessage = t('auth.errors.weak_password', 'Password should be at least 6 characters.');
            } else if (errorMessage.includes('valid email')) {
                errorMessage = t('auth.errors.invalid_email', 'Please enter a valid email address.');
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] px-4 py-12 sm:px-6 lg:px-8 relative">
            <div className="absolute top-6 right-6">
                <LanguageSwitcher />
            </div>

            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-premium border border-gray-50">
                <div className="text-center">
                    <span className="text-2xl font-serif font-bold tracking-tight text-gray-900">
                        SARTORIA<span className="text-[#d4af37]">.IA</span>
                    </span>
                    <h2 className="mt-6 text-3xl font-serif font-medium text-gray-900">
                        {t('signup.title', 'Create your account')}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 font-light">
                        {t('signup.subtitle', 'Start your journey with SARTORIA')}
                    </p>
                </div>

                <div className="mt-10">
                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-300"
                    >
                        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="tracking-wide">{t('signup.google', 'Continue with Google')}</span>
                    </button>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400">
                            <span className="px-2 bg-white">
                                {t('auth.or', 'or')}
                            </span>
                        </div>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="space-y-5">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                            </div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm transition-all bg-gray-50/50 focus:bg-white"
                                placeholder={t('auth.email_placeholder', 'Email address')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm transition-all bg-gray-50/50 focus:bg-white"
                                placeholder={t('auth.password_placeholder', 'Password (min. 8 chars)')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-gray-200"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5 text-white" />
                            ) : (
                                <span className="flex items-center tracking-wide">
                                    {t('signup.button', 'Create Account')}
                                    {/* <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" /> */}
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500">
                        {t('signup.has_account', 'Already have an account?')}{' '}
                        <Link to="/login" className="font-semibold text-black hover:text-gray-700 transition-colors border-b border-black/20 hover:border-black">
                            {t('auth.login_link', 'Sign in')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
