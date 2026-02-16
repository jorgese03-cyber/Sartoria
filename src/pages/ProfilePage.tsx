import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Loader2, CreditCard, LogOut, Trash2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { status, plan, daysRemaining, isActive } = useSubscription();
    const { t, i18n } = useTranslation('common');
    const [loadingPortal, setLoadingPortal] = useState(false);

    // Fallback for user name/city if not in context yet (would usually fetch profile here)
    const [profile] = useState({
        ciudad: 'Alicante, ES', // Placeholder
    });

    const handleManageSubscription = async () => {
        setLoadingPortal(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: {
                    user_id: user?.id,
                    return_url: window.location.href
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            console.error('Error opening portal:', err);
            alert('Could not open subscription portal');
        } finally {
            setLoadingPortal(false);
        }
    };

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        // Ideally update profile in DB too
    };

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/';
    }

    if (!user) return <div className="p-8">Please log in.</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">{t('profile_title', 'Account Settings')}</h1>

            {/* User Info Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">{t('personal_info', 'Personal Information')}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-50 rounded-md text-gray-500 sm:text-sm">
                            {user.email}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <div className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            {profile.ciudad}
                        </div>
                    </div>
                </div>
            </section>

            {/* Language Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">{t('language', 'Language')}</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={() => handleLanguageChange('es')}
                        className={`px-4 py-2 rounded-md ${i18n.language.startsWith('es') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        Español 🇪🇸
                    </button>
                    <button
                        onClick={() => handleLanguageChange('en')}
                        className={`px-4 py-2 rounded-md ${i18n.language.startsWith('en') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        English 🇬🇧
                    </button>
                </div>
            </section>

            {/* Subscription Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">{t('subscription', 'Subscription')}</h2>

                <div className={`p-4 rounded-md mb-4 ${isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 capitalize">
                                {status === 'trialing' ? `Free Trial (${daysRemaining} days left)` :
                                    status === 'active' ? `${plan} Plan Active` :
                                        'Subscription Inactive'}
                            </p>
                            {!isActive && <p className="text-sm text-red-600 mt-1">Please subscribe to access all features.</p>}
                        </div>
                        {isActive && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleManageSubscription}
                    disabled={loadingPortal}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {loadingPortal ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    {t('manage_billing', 'Manage Billing & Subscription')}
                </button>
            </section>

            {/* Danger Zone */}
            <div className="mt-8 border-t pt-8">
                <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium mb-4"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('sign_out', 'Sign Out')}
                </button>

                <button
                    className="flex items-center text-red-600 hover:text-red-900 text-sm font-medium"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('delete_account', 'Delete Account')}
                </button>
            </div>
        </div>
    );
}
