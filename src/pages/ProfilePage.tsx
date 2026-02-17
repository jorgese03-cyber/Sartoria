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
    const [profile, setProfile] = useState({
        ciudad: '',
        nombre: ''
    });

    const [updating, setUpdating] = useState(false);
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Fetch profile and photo on load
    useState(() => {
        async function loadProfile() {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('ciudad, nombre')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setProfile({ ciudad: data.ciudad || '', nombre: data.nombre || '' });
                }

                // Fetch latest user photo
                const { data: photoData } = await supabase
                    .from('foto_usuario')
                    .select('foto_url')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (photoData) {
                    setUserPhoto(photoData.foto_url);
                }
            } catch (err) {
                console.error('Error loading profile:', err);
            } finally {

            }
        }
        loadProfile();
    });

    const handleUpdateProfile = async () => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ciudad: profile.ciudad, nombre: profile.nombre })
                .eq('id', user?.id);

            if (error) throw error;
            // Optionally show success feedback
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setUploadingPhoto(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            // Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('user-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-photos')
                .getPublicUrl(filePath);

            // Save to DB
            const { error: dbError } = await supabase
                .from('foto_usuario')
                .insert({
                    user_id: user.id,
                    foto_url: publicUrl,
                    descripcion_fisica: 'Uploaded via Profile' // Placeholder
                });

            if (dbError) throw dbError;

            setUserPhoto(publicUrl);
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Error uploading photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

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
        // Save to profile
        if (user) {
            supabase.from('profiles').update({ idioma: lang }).eq('id', user.id).then(() => { });
        }
    };

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/';
    }

    const handleDeleteAccount = async () => {
        if (confirm(t('common:confirm_delete_account_msg', { defaultValue: 'Are you sure you want to delete your account? This action cannot be undone.' }))) {
            // In a real app, call an Edge Function to clean up Stripe + Auth + Data
            alert('Please contact support to delete your account completely. We will sign you out now.');
            await signOut();
            window.location.href = '/';
        }
    }

    if (!user) return <div className="p-8">Please log in.</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
            <h1 className="text-2xl font-bold mb-8">{t('profile_title', { defaultValue: 'Account Settings' })}</h1> // Using defaultValue temporarily if key missing

            {/* Travel Suitcase Link */}
            {isActive && (
                <section className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg mb-6 text-white cursor-pointer" onClick={() => window.location.href = '/travel'}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="text-2xl">🧳</span>
                                {t('travel:title', { defaultValue: 'Travel Suitcase' })}
                            </h2>
                            <p className="text-indigo-100 mt-1 text-sm">Plan your outfits for your next trip.</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-full">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </section>
            )}

            {/* User Info Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">{t('personal_info', 'Personal Information')}</h2>

                {/* Photo Upload */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        {userPhoto ? (
                            <img src={userPhoto} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <span className="text-2xl">👤</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reference Photo</label>
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                {uploadingPhoto ? <Loader2 className="animate-spin w-4 h-4" /> : 'Upload Photo'}
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                            </label>
                            <span className="text-xs text-gray-500">Full body photo for best results</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-50 rounded-md text-gray-500 sm:text-sm">
                            {user.email}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            value={profile.nombre}
                            onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                            onBlur={handleUpdateProfile}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={profile.ciudad}
                                onChange={(e) => setProfile({ ...profile, ciudad: e.target.value })}
                                onBlur={handleUpdateProfile} // Auto-save on blur
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {updating && <span className="text-xs text-gray-400 self-center">Saving...</span>}
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
                    onClick={handleDeleteAccount}
                    className="flex items-center text-red-600 hover:text-red-900 text-sm font-medium"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('delete_account', 'Delete Account')}
                </button>
            </div>
        </div>
    );
}
