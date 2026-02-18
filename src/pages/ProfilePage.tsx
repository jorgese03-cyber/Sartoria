import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Loader2, CreditCard, LogOut, Trash2, Plane } from 'lucide-react';

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
            alert('Error al actualizar el perfil');
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
            alert('No se pudo abrir el portal de suscripción');
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
        if (confirm(t('common:confirm_delete_account_msg', { defaultValue: '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.' }))) {
            alert('Por favor contacta con soporte para eliminar tu cuenta. Cerraremos tu sesión ahora.');
            await signOut();
            window.location.href = '/';
        }
    }

    if (!user) return <div className="p-8 text-center text-[#4b5563]">Inicia sesión para ver tu perfil.</div>;

    return (
        <div className="min-h-screen bg-[#f9f9f9] pb-24">
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
                <header className="mb-4">
                    <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#0a0a0a] tracking-tight">
                        {t('profile:title')}
                    </h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Photo & Main Info */}
                    <div className="md:col-span-1 space-y-6">
                        <section className="bg-white p-6 rounded-2xl shadow-[0_20px_40px_-4px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-col items-center text-center">
                            <div className="relative group mb-4">
                                <div className="w-32 h-32 rounded-full bg-gray-50 overflow-hidden border-4 border-white shadow-lg">
                                    {userPhoto ? (
                                        <img src={userPhoto} alt="User" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <span className="text-4xl">👤</span>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-1 right-1 bg-black text-white p-2.5 rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform">
                                    {uploadingPhoto ? <Loader2 className="animate-spin w-4 h-4" /> : <div className="w-4 h-4"><svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg></div>}
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                                </label>
                            </div>
                            <h2 className="text-xl font-serif font-medium text-gray-900">{profile.nombre || 'Fashionista'}</h2>
                            <p className="text-gray-600 text-sm">{user.email}</p>
                            <div className="mt-6 w-full">
                                <div className={`p-3 rounded-2xl border ${isActive ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                    <div className="text-xs font-bold uppercase tracking-wider mb-1">{t('profile:current_plan')}</div>
                                    <div className="font-medium">
                                        {status === 'trialing' ? `${t('profile:free_trial')} (${daysRemaining} ${t('profile:days_remaining')})` :
                                            status === 'active' ? `${plan} Plan` :
                                                t('profile:free_plan')}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Travel Link */}
                        {isActive && (
                            <button
                                onClick={() => window.location.href = '/travel'}
                                className="w-full bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group text-left"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                    <Plane className="w-24 h-24 rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md">
                                        <Plane className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">{t('profile:travel_mode')}</h3>
                                    <p className="text-gray-400 text-sm">{t('profile:travel_hint')} &rarr;</p>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Personal Info */}
                        <section className="bg-white p-8 rounded-2xl shadow-[0_20px_40px_-4px_rgba(0,0,0,0.08)] border border-gray-50">
                            <h2 className="text-xl font-serif font-medium text-gray-900 mb-6 flex items-center gap-2">
                                {t('profile:personal_info')}
                            </h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">{t('profile:name')}</label>
                                        <input
                                            type="text"
                                            value={profile.nombre}
                                            onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                                            onBlur={handleUpdateProfile}
                                            className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black transition-shadow"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">{t('profile:city')}</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={profile.ciudad}
                                                onChange={(e) => setProfile({ ...profile, ciudad: e.target.value })}
                                                onBlur={handleUpdateProfile}
                                                className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-black focus:ring-black transition-shadow"
                                                placeholder="ej. Madrid"
                                            />
                                            {updating && <span className="absolute right-3 top-3.5 text-xs text-gray-500 animate-pulse">{t('profile:saving')}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Preferences */}
                        <section className="bg-white p-8 rounded-2xl shadow-[0_20px_40px_-4px_rgba(0,0,0,0.08)] border border-gray-50">
                            <h2 className="text-xl font-serif font-medium text-gray-900 mb-6">{t('profile:preferences')}</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">{t('profile:language')}</label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleLanguageChange('en')}
                                            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${i18n.language.startsWith('en') ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            🇬🇧 English
                                        </button>
                                        <button
                                            onClick={() => handleLanguageChange('es')}
                                            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${i18n.language.startsWith('es') ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            🇪🇸 Español
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <button
                                        onClick={handleManageSubscription}
                                        disabled={loadingPortal}
                                        className="flex items-center text-indigo-700 hover:text-indigo-900 font-medium text-sm transition-colors"
                                    >
                                        {loadingPortal ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                                        {t('profile:billing')}
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="bg-white p-8 rounded-3xl shadow-sm border border-red-50">
                            <h2 className="text-red-600 font-serif font-medium mb-6 text-lg">{t('profile:account_actions')}</h2>
                            <div className="space-y-3">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors text-left group"
                                >
                                    <span className="font-medium text-sm">{t('profile:sign_out')}</span>
                                    <LogOut className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                                </button>

                                <button
                                    onClick={handleDeleteAccount}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-colors text-left group"
                                >
                                    <span className="font-medium text-sm">{t('profile:delete_account')}</span>
                                    <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
