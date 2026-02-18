import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { t } = useTranslation(['auth', 'common']);
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
                    redirectTo: `${window.location.origin}/app`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(t('auth.errors.google_login', 'Error ejecutando login con Google') + ': ' + (err.message || ''));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/app');
        } catch (err: any) {
            let errorMessage = err.message;
            if (errorMessage === 'Invalid login credentials') {
                errorMessage = t('auth.errors.invalid_credentials', 'Email o contraseña incorrectos.');
            } else if (errorMessage.includes('valid email')) {
                errorMessage = t('auth.errors.invalid_email', 'Por favor introduce un email válido.');
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
            <div className="max-w-sm w-full space-y-10 animate-fade-in">
                {/* Logo */}
                <div className="text-center">
                    <span className="font-serif font-normal tracking-[0.15em] text-[#1A1A1A]" style={{ fontSize: '22px' }}>
                        SARTORIA
                    </span>
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-serif font-normal text-[#1A1A1A]">
                        {t('login.title', 'Iniciar sesión')}
                    </h1>
                    <p className="text-sm text-[#6B6B6B] font-light">
                        {t('login.subtitle', 'Bienvenido de vuelta')}
                    </p>
                </div>

                {/* Google */}
                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex justify-center items-center gap-3 py-4 border border-[#E5E0DB] text-[12px] tracking-[0.1em] uppercase text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
                >
                    <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t('login.google', 'Continuar con Google')}
                </button>

                {/* Separator */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E5E0DB]" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-4 bg-white text-[11px] tracking-[0.1em] uppercase text-[#AAAAAA]">o</span>
                    </div>
                </div>

                {/* Form */}
                <form className="space-y-8" onSubmit={handleLogin}>
                    <div className="space-y-6">
                        <input
                            type="email"
                            autoComplete="email"
                            required
                            className="input-md"
                            placeholder={t('auth.email_placeholder', 'Email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            autoComplete="current-password"
                            required
                            className="input-md"
                            placeholder={t('auth.password_placeholder', 'Contraseña')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-[#C41E3A] text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-4 w-4 text-white" />
                        ) : (
                            t('login.button', 'Entrar')
                        )}
                    </button>
                </form>

                {/* Footer link */}
                <p className="text-center text-sm text-[#6B6B6B] font-light">
                    {t('login.no_account', '¿No tienes cuenta?')}{' '}
                    <Link to="/register" className="text-[#1A1A1A] border-b border-[#1A1A1A] hover:opacity-70 transition-opacity">
                        {t('login.signup_link', 'Crear cuenta')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
