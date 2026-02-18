import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Upload, ArrowRight, ArrowLeft, Camera } from 'lucide-react';

const STYLES = [
    { id: 'business', emoji: '👔' },
    { id: 'casual', emoji: '👕' },
    { id: 'streetwear', emoji: '🧢' },
    { id: 'old_money', emoji: '🏛️' },
    { id: 'sporty', emoji: '🏋️' },
    { id: 'minimal', emoji: '◻️' },
];

export default function OnboardingPage() {
    const { t } = useTranslation(['onboarding', 'common', 'wardrobe']);
    const { user } = useAuth();

    const [step, setStep] = useState(1);
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [modelUploading, setModelUploading] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [uploading, setUploading] = useState(false);

    /* ── Step 1: City ── */
    const handleUpdateCity = async () => {
        if (!city || !user) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').update({ ciudad: city }).eq('id', user.id);
            if (error) throw error;
            setStep(2);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    /* ── Step 2: Style ── */
    const toggleStyle = (id: string) => {
        setSelectedStyles(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const handleSaveStyles = async () => {
        if (!user || selectedStyles.length === 0) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').update({ preferred_styles: selectedStyles }).eq('id', user.id);
            if (error) throw error;
            setStep(3);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    /* ── Step 3: Model Photo ── */
    const handleModelPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setModelUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/model.${fileExt}`;
        try {
            const { error: uploadError } = await supabase.storage.from('user-models').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('user-models').getPublicUrl(filePath);
            const { error: updateError } = await supabase.from('profiles').update({ model_photo_url: publicUrl + '?t=' + Date.now(), use_default_model: false }).eq('id', user.id);
            if (updateError) throw updateError;
            setStep(4);
        } catch (err) { console.error(err); }
        finally { setModelUploading(false); }
    };

    const handleUseDefaultModel = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').update({ use_default_model: true }).eq('id', user.id);
            if (error) throw error;
            setStep(4);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    /* ── Step 4: Clothes Upload ── */
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setUploading(true);
        const files = Array.from(e.target.files);
        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('garments').upload(fileName, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('garments').getPublicUrl(fileName);
                const { error: dbError } = await supabase.from('garments').insert({ user_id: user.id, imagen_url: publicUrl, categoria: 'Camiseta' });
                if (dbError) throw dbError;
                setUploadedCount(prev => prev + 1);
            }
        } catch (err) { console.error(err); }
        finally { setUploading(false); }
    };

    const handleFinish = () => { window.location.href = '/app'; };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
            <div className="max-w-md w-full animate-fade-in">
                {/* Step Indicator: 1 — 2 — 3 — 4 */}
                <div className="flex items-center justify-center gap-3 mb-16">
                    {[1, 2, 3, 4].map((s, i) => (
                        <React.Fragment key={s}>
                            {i > 0 && <div className={`w-8 h-px ${s <= step ? 'bg-[#1A1A1A]' : 'bg-[#E5E0DB]'}`} />}
                            <span
                                className={`text-[13px] tracking-wide ${s === step ? 'text-[#1A1A1A]' : s < step ? 'text-[#8B7355]' : 'text-[#AAAAAA]'}`}
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                {s}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                {/* ──── Step 1: City ──── */}
                {step === 1 && (
                    <div className="space-y-12 animate-fade-in text-center">
                        <div>
                            <h1 className="font-serif font-normal text-3xl text-[#1A1A1A] mb-3">
                                ¿Dónde vives?
                            </h1>
                            <p className="text-sm text-[#6B6B6B] font-light">
                                {t('onboarding:step_city_desc', 'Para adaptar tu outfit al clima local')}
                            </p>
                        </div>

                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={t('onboarding:city_placeholder', 'Ej: Madrid')}
                            className="input-md text-center"
                            autoFocus
                        />

                        <button
                            onClick={handleUpdateCity}
                            disabled={!city || loading}
                            className="btn-primary"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                                <span className="flex items-center gap-2">
                                    Siguiente <ArrowRight size={14} strokeWidth={1.5} />
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* ──── Step 2: Style Selection ──── */}
                {step === 2 && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="text-center">
                            <h1 className="font-serif font-normal text-3xl text-[#1A1A1A] mb-3">
                                {t('onboarding:step_style_title', 'Define tu estilo')}
                            </h1>
                            <p className="text-sm text-[#6B6B6B] font-light">
                                {t('onboarding:step_style_desc', 'Selecciona uno o más estilos')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {STYLES.map((style) => {
                                const isSelected = selectedStyles.includes(style.id);
                                return (
                                    <button
                                        key={style.id}
                                        onClick={() => toggleStyle(style.id)}
                                        className={`flex flex-col items-center justify-center py-6 border transition-all duration-200
                                            ${isSelected
                                                ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                                                : 'border-[#E5E0DB] text-[#1A1A1A] hover:border-[#1A1A1A]'
                                            }`}
                                    >
                                        <span className="text-xl mb-2">{style.emoji}</span>
                                        <span className="text-[11px] tracking-[0.12em] uppercase">
                                            {t(`onboarding:style_${style.id}`)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between">
                            <button onClick={() => setStep(1)} className="btn-ghost">
                                <ArrowLeft size={14} strokeWidth={1.5} /> Atrás
                            </button>
                            <button
                                onClick={handleSaveStyles}
                                disabled={selectedStyles.length === 0 || loading}
                                className="btn-primary w-auto px-10"
                                style={{ width: 'auto' }}
                            >
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                                    <span className="flex items-center gap-2">
                                        Siguiente <ArrowRight size={14} strokeWidth={1.5} />
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ──── Step 3: Model Photo ──── */}
                {step === 3 && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="text-center">
                            <h1 className="font-serif font-normal text-3xl text-[#1A1A1A] mb-3">
                                {t('onboarding:step_2_title', 'Tu foto de cuerpo entero')}
                            </h1>
                            <p className="text-sm text-[#6B6B6B] font-light">
                                {t('onboarding:step_2_desc', 'Para visualizar los outfits sobre ti')}
                            </p>
                        </div>

                        <div className="relative">
                            <input type="file" accept="image/*" onChange={handleModelPhotoUpload} className="hidden" id="model-upload" disabled={modelUploading} />
                            <label
                                htmlFor="model-upload"
                                className="block w-full border border-dashed border-[#E5E0DB] py-16 text-center hover:border-[#1A1A1A] transition-colors cursor-pointer"
                            >
                                {modelUploading ? (
                                    <Loader2 className="w-6 h-6 mx-auto text-[#1A1A1A] animate-spin" />
                                ) : (
                                    <div className="space-y-3">
                                        <Camera className="w-6 h-6 mx-auto text-[#6B6B6B]" strokeWidth={1} />
                                        <p className="text-sm text-[#1A1A1A]">{t('onboarding:upload_photo_label', 'Subir foto')}</p>
                                        <p className="text-[11px] text-[#AAAAAA]">{t('onboarding:upload_photo_hint', 'JPG o PNG, cuerpo completo')}</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <button onClick={() => setStep(2)} className="btn-ghost">
                                <ArrowLeft size={14} strokeWidth={1.5} /> Atrás
                            </button>
                            <button
                                onClick={handleUseDefaultModel}
                                disabled={loading || modelUploading}
                                className="btn-ghost text-[#6B6B6B]"
                            >
                                Usar modelo genérico
                            </button>
                        </div>
                    </div>
                )}

                {/* ──── Step 4: Clothes Upload ──── */}
                {step === 4 && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="text-center">
                            <h1 className="font-serif font-normal text-3xl text-[#1A1A1A] mb-3">
                                {t('onboarding:step_3_title', 'Sube tus prendas')}
                            </h1>
                            <p className="text-sm text-[#6B6B6B] font-light">
                                {t('onboarding:step_3_desc', 'Fotos de tu ropa para crear outfits')}
                            </p>
                        </div>

                        <label className="block w-full border border-dashed border-[#E5E0DB] py-14 text-center hover:border-[#1A1A1A] transition-colors cursor-pointer">
                            <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                            {uploading ? (
                                <Loader2 className="w-6 h-6 mx-auto text-[#1A1A1A] animate-spin" />
                            ) : (
                                <div className="space-y-3">
                                    <Upload className="w-6 h-6 mx-auto text-[#6B6B6B]" strokeWidth={1} />
                                    <p className="text-sm text-[#1A1A1A]">{t('onboarding:upload_button', 'Seleccionar fotos')}</p>
                                    <p className="text-[11px] text-[#AAAAAA]">{t('onboarding:multiple_selection_hint', 'Puedes seleccionar varias')}</p>
                                </div>
                            )}
                        </label>

                        {uploadedCount > 0 && (
                            <p className="text-center text-sm text-[#2D5A27]">
                                {t('onboarding:garments_uploaded_msg', { count: uploadedCount })}
                            </p>
                        )}

                        <div className="space-y-4">
                            <button onClick={handleFinish} className="btn-primary">
                                Empezar
                            </button>
                            <button onClick={handleFinish} className="btn-ghost w-full justify-center text-[#6B6B6B]">
                                {t('onboarding:skip', 'Omitir por ahora')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
