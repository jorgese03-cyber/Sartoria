import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { status, plan, daysRemaining } = useSubscription();
    const { t, i18n } = useTranslation('common');
    const [loadingPortal, setLoadingPortal] = useState(false);

    const [profile, setProfile] = useState({ ciudad: '', nombre: '' });
    const [updating, setUpdating] = useState(false);
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useState(() => {
        async function loadProfile() {
            if (!user) return;
            try {
                const { data } = await supabase.from('profiles').select('ciudad, nombre').eq('id', user.id).single();
                if (data) setProfile({ ciudad: data.ciudad || '', nombre: data.nombre || '' });
                const { data: photoData } = await supabase.from('foto_usuario').select('foto_url').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
                if (photoData) setUserPhoto(photoData.foto_url);
            } catch (err) { console.error(err); }
        }
        loadProfile();
    });

    const handleUpdateProfile = async () => {
        setUpdating(true);
        try {
            const { error } = await supabase.from('profiles').update({ ciudad: profile.ciudad, nombre: profile.nombre }).eq('id', user?.id);
            if (error) throw error;
        } catch (err) { console.error(err); alert('Error al actualizar'); }
        finally { setUpdating(false); }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setUploadingPhoto(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        try {
            const { error: uploadError } = await supabase.storage.from('user-photos').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('user-photos').getPublicUrl(filePath);
            const { error: dbError } = await supabase.from('foto_usuario').insert({ user_id: user.id, foto_url: publicUrl, descripcion_fisica: 'Uploaded via Profile' });
            if (dbError) throw dbError;
            setUserPhoto(publicUrl);
        } catch (err) { console.error(err); alert('Error subiendo foto'); }
        finally { setUploadingPhoto(false); }
    };

    const handleManageSubscription = async () => {
        setLoadingPortal(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: { user_id: user?.id, return_url: window.location.href }
            });
            if (error) throw error;
            if (data?.url) window.location.href = data.url;
        } catch (err: any) { console.error(err); alert('No se pudo abrir el portal'); }
        finally { setLoadingPortal(false); }
    };

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        if (user) { supabase.from('profiles').update({ idioma: lang }).eq('id', user.id).then(() => { }); }
    };

    const handleLogout = async () => { await signOut(); window.location.href = '/'; };
    const handleDeleteAccount = async () => {
        if (confirm(t('common:confirm_delete_account_msg', { defaultValue: '¿Estás seguro? Esta acción no se puede deshacer.' }))) {
            alert('Contacta con soporte para eliminar tu cuenta.');
            await signOut();
            window.location.href = '/';
        }
    };

    if (!user) return <div className="p-8 text-center text-[#6B6B6B]">Inicia sesión para ver tu perfil.</div>;

    return (
        <div className="min-h-screen bg-white pb-24">
            <div className="max-w-lg mx-auto px-6 py-10 space-y-10 animate-fade-in">
                {/* Header */}
                <div className="text-center space-y-4">
                    {/* Photo */}
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-[#F5F0EB] overflow-hidden mx-auto">
                            {userPhoto ? (
                                <img src={userPhoto} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#AAAAAA] text-3xl">👤</div>
                            )}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-[#1A1A1A] text-white w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-black transition-colors">
                            {uploadingPhoto ? <Loader2 className="animate-spin w-3 h-3" /> : <span className="text-xs">+</span>}
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        </label>
                    </div>

                    <h1 className="font-serif font-normal text-xl text-[#1A1A1A]">{profile.nombre || 'Fashionista'}</h1>
                    <p className="text-sm text-[#6B6B6B] font-light">{user.email}</p>

                    {/* Plan badge */}
                    <div className="inline-block border border-[#E5E0DB] px-4 py-2">
                        <span className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">
                            {status === 'trialing' ? `Prueba gratuita · ${daysRemaining} días` :
                                status === 'active' ? `Plan ${plan}` : 'Plan gratuito'}
                        </span>
                    </div>
                </div>

                {/* Personal Info */}
                <section className="space-y-6">
                    <h2 className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">{t('profile:personal_info', 'Información personal')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#AAAAAA] mb-2">{t('profile:name', 'Nombre')}</label>
                            <input
                                type="text"
                                value={profile.nombre}
                                onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                                onBlur={handleUpdateProfile}
                                className="input-md"
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#AAAAAA] mb-2">{t('profile:city', 'Ciudad')}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={profile.ciudad}
                                    onChange={(e) => setProfile({ ...profile, ciudad: e.target.value })}
                                    onBlur={handleUpdateProfile}
                                    className="input-md"
                                    placeholder="Madrid"
                                />
                                {updating && <span className="absolute right-0 top-3 text-[10px] text-[#AAAAAA] animate-pulse">{t('profile:saving', 'Guardando...')}</span>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Language */}
                <section className="space-y-4 border-t border-[#E5E0DB] pt-8">
                    <h2 className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">{t('profile:language', 'Idioma')}</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className={`flex-1 py-3 border text-[12px] tracking-[0.1em] uppercase transition-all
                                ${i18n.language.startsWith('en') ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E5E0DB] text-[#6B6B6B] hover:border-[#1A1A1A]'}`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => handleLanguageChange('es')}
                            className={`flex-1 py-3 border text-[12px] tracking-[0.1em] uppercase transition-all
                                ${i18n.language.startsWith('es') ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E5E0DB] text-[#6B6B6B] hover:border-[#1A1A1A]'}`}
                        >
                            Español
                        </button>
                    </div>
                </section>

                {/* Subscription */}
                <section className="space-y-4 border-t border-[#E5E0DB] pt-8">
                    <h2 className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">{t('profile:billing', 'Facturación')}</h2>
                    <button
                        onClick={handleManageSubscription}
                        disabled={loadingPortal}
                        className="btn-ghost gap-2"
                    >
                        {loadingPortal && <Loader2 className="animate-spin w-4 h-4" />}
                        Gestionar suscripción →
                    </button>
                </section>

                {/* Account Actions */}
                <section className="space-y-4 border-t border-[#E5E0DB] pt-8">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left py-4 border-b border-[#E5E0DB] text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                    >
                        {t('profile:sign_out', 'Cerrar sesión')}
                    </button>
                    <button
                        onClick={handleDeleteAccount}
                        className="w-full text-left py-4 text-sm text-[#C41E3A] hover:opacity-70 transition-opacity"
                    >
                        {t('profile:delete_account', 'Eliminar cuenta')}
                    </button>
                </section>
            </div>
        </div>
    );
}
