import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, MapPin, Upload, ArrowRight, Camera, Briefcase, Shirt, Crown, Dumbbell, Minus } from 'lucide-react';
import clsx from 'clsx';

const STYLES = [
    { id: 'business', icon: Briefcase, emoji: '👔' },
    { id: 'casual', icon: Shirt, emoji: '👕' },
    { id: 'streetwear', icon: Shirt, emoji: '🧢' },
    { id: 'old_money', icon: Crown, emoji: '🏛️' },
    { id: 'sporty', icon: Dumbbell, emoji: '🏋️' },
    { id: 'minimal', icon: Minus, emoji: '◻️' },
];

export default function OnboardingPage() {
    const { t } = useTranslation(['onboarding', 'common', 'wardrobe']);
    const { user } = useAuth();

    // Steps: 1 = City, 2 = Style, 3 = Model Photo, 4 = Clothes
    const TOTAL_STEPS = 4;
    const [step, setStep] = useState(1);
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

    // Step 3 state
    const [modelUploading, setModelUploading] = useState(false);

    // Step 4 state (Clothes)
    const [uploadedCount, setUploadedCount] = useState(0);
    const [uploading, setUploading] = useState(false);

    const handleUpdateCity = async () => {
        if (!city || !user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ciudad: city })
                .eq('id', user.id);

            if (error) throw error;
            setStep(2);
        } catch (err) {
            console.error('Error updating city:', err);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Style Selection
    const toggleStyle = (styleId: string) => {
        setSelectedStyles(prev =>
            prev.includes(styleId)
                ? prev.filter(s => s !== styleId)
                : [...prev, styleId]
        );
    };

    const handleSaveStyles = async () => {
        if (!user || selectedStyles.length === 0) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ preferred_styles: selectedStyles })
                .eq('id', user.id);

            if (error) throw error;
            setStep(3);
        } catch (err) {
            console.error('Error saving styles:', err);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Model Photo
    const handleModelPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setModelUploading(true);

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/model.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('user-models')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('user-models')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    model_photo_url: publicUrl + '?t=' + Date.now(),
                    use_default_model: false
                })
                .eq('id', user.id);

            if (updateError) throw updateError;
            setStep(4);
        } catch (err) {
            console.error('Error uploading model photo:', err);
        } finally {
            setModelUploading(false);
        }
    };

    const handleUseDefaultModel = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ use_default_model: true })
                .eq('id', user.id);

            if (error) throw error;
            setStep(4);
        } catch (err) {
            console.error('Error setting default model:', err);
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Clothes Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setUploading(true);

        const files = Array.from(e.target.files);

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('garments')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('garments')
                    .getPublicUrl(fileName);

                const { error: dbError } = await supabase
                    .from('garments')
                    .insert({
                        user_id: user.id,
                        imagen_url: publicUrl,
                        categoria: 'Camiseta',
                    });

                if (dbError) throw dbError;
                setUploadedCount(prev => prev + 1);
            }
        } catch (err) {
            console.error('Error uploading:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleFinish = async () => {
        window.location.href = '/app';
    };

    const stepTitles: Record<number, string> = {
        1: t('onboarding:welcome_title'),
        2: t('onboarding:step_style_title'),
        3: t('onboarding:step_2_title'),
        4: t('onboarding:step_3_title'),
    };

    const stepDescs: Record<number, string> = {
        1: t('onboarding:welcome_subtitle'),
        2: t('onboarding:step_style_desc'),
        3: t('onboarding:step_2_desc'),
        4: t('onboarding:step_3_desc'),
    };

    return (
        <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_20px_40px_-4px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-50">
                {/* Progress Bar */}
                <div className="flex w-full h-1 bg-gray-100">
                    <div
                        className="h-full bg-[#0a0a0a] transition-all duration-500 ease-out"
                        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                    />
                </div>

                <div className="p-10">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-[#d4af37] uppercase mb-3 block">
                            {t('onboarding:step_indicator', { step })}
                        </span>
                        <h1 className="text-3xl font-serif font-medium text-[#0a0a0a] mb-3">
                            {stepTitles[step]}
                        </h1>
                        <p className="text-[#4b5563] font-light text-sm">
                            {stepDescs[step]}
                        </p>
                    </div>

                    {/* Step 1: City */}
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-[#f9f9f9] p-6 rounded-2xl flex justify-center border border-gray-100">
                                <MapPin className="w-10 h-10 text-[#0a0a0a]" strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <h2 className="text-lg font-medium text-[#0a0a0a] mb-2">{t('onboarding:step_city_title')}</h2>
                                <p className="text-xs text-[#4b5563]">{t('onboarding:step_city_desc')}</p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder={t('onboarding:city_placeholder')}
                                    className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-[#f9f9f9] focus:bg-white focus:ring-1 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] outline-none transition-all placeholder-gray-400 text-center text-lg shadow-sm font-medium text-[#0a0a0a]"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={handleUpdateCity}
                                disabled={!city || loading}
                                className="w-full bg-[#0a0a0a] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center group transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        {t('onboarding:next')}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Style Selection */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-2 gap-3">
                                {STYLES.map((style) => {
                                    const isSelected = selectedStyles.includes(style.id);
                                    return (
                                        <button
                                            key={style.id}
                                            onClick={() => toggleStyle(style.id)}
                                            className={clsx(
                                                "flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300",
                                                isSelected
                                                    ? "border-[#0a0a0a] bg-[#0a0a0a] text-white shadow-lg scale-[1.02]"
                                                    : "border-gray-200 bg-white text-[#0a0a0a] hover:border-gray-400 hover:bg-gray-50"
                                            )}
                                        >
                                            <span className="text-2xl mb-2">{style.emoji}</span>
                                            <span className="text-xs font-bold tracking-wider uppercase">
                                                {t(`onboarding:style_${style.id}`)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleSaveStyles}
                                disabled={selectedStyles.length === 0 || loading}
                                className="w-full bg-[#0a0a0a] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center group transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        {t('onboarding:next')}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 3: Model Photo */}
                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="relative group cursor-pointer">
                                <input type="file" accept="image/*" onChange={handleModelPhotoUpload} className="hidden" id="model-upload" disabled={modelUploading} />
                                <label htmlFor="model-upload" className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-[#0a0a0a] hover:bg-[#f9f9f9] transition-all cursor-pointer">
                                    {modelUploading ? (
                                        <Loader2 className="w-8 h-8 mx-auto text-[#0a0a0a] animate-spin" />
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-white border border-gray-200 group-hover:border-gray-300 transition-all">
                                                <Camera className="w-6 h-6 text-[#0a0a0a]" strokeWidth={1.5} />
                                            </div>
                                            <p className="text-sm font-medium text-[#0a0a0a]">{t('onboarding:upload_photo_label')}</p>
                                            <p className="text-xs text-[#4b5563]">{t('onboarding:upload_photo_hint')}</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="space-y-4">
                                <button
                                    className="w-full bg-[#0a0a0a] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center group transition-all"
                                    onClick={() => document.getElementById('model-upload')?.click()}
                                >
                                    {t('onboarding:select_photo_btn')}
                                </button>
                                <button
                                    onClick={handleUseDefaultModel}
                                    disabled={loading || modelUploading}
                                    className="w-full text-[#4b5563] font-medium text-sm hover:text-[#0a0a0a] transition-colors"
                                >
                                    {t('onboarding:skip_model_btn')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Clothes */}
                    {step === 4 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center">
                                <div className="inline-block p-4 rounded-full bg-[#f9f9f9] mb-4 border border-gray-100">
                                    <Upload className="w-8 h-8 text-[#0a0a0a]" strokeWidth={1.5} />
                                </div>
                            </div>

                            <label className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#0a0a0a] hover:bg-[#f9f9f9] transition-colors cursor-pointer group">
                                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 mx-auto text-[#0a0a0a] animate-spin" />
                                ) : (
                                    <div className="space-y-2">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-white transition-all border border-gray-200">
                                            <span className="text-xl">📸</span>
                                        </div>
                                        <p className="text-sm font-medium text-[#0a0a0a]">{t('onboarding:upload_button')}</p>
                                        <p className="text-xs text-[#4b5563]">{t('onboarding:multiple_selection_hint')}</p>
                                    </div>
                                )}
                            </label>

                            {uploadedCount > 0 && (
                                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-center text-sm font-medium border border-green-100 flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    {t('onboarding:garments_uploaded_msg', { count: uploadedCount })}
                                </div>
                            )}

                            <div className="space-y-3 pt-4">
                                <button
                                    onClick={handleFinish}
                                    className="w-full bg-[#0a0a0a] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-900 flex items-center justify-center transition-all"
                                >
                                    {t('onboarding:finish_button')}
                                </button>
                                <button
                                    onClick={handleFinish}
                                    className="w-full text-[#4b5563] font-medium text-xs hover:text-[#0a0a0a] transition-colors uppercase tracking-widest"
                                >
                                    {t('onboarding:skip')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
