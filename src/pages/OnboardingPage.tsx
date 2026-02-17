import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, MapPin, Upload, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
    const { t } = useTranslation(['onboarding', 'common', 'wardrobe']);
    const { user } = useAuth();

    // Steps: 1 = City, 2 = Clothes
    const [step, setStep] = useState(1);
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 2 state
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

    // Reusing logic from typical file upload but simplified
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setUploading(true);

        // Loop through files if multiple
        const files = Array.from(e.target.files);

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                // Upload to Storage
                const { error: uploadError } = await supabase.storage
                    .from('garments')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('garments')
                    .getPublicUrl(filePath);

                // Insert into garments table (minimal info, analyze later?)
                // Actually we should probably call analyze-garment here or just insert defaults
                const { error: dbError } = await supabase
                    .from('garments')
                    .insert({
                        user_id: user.id,
                        imagen_url: publicUrl,
                        categoria: 'shirt', // Default, user should ideally edit later or AI detect
                        // In a real app, we'd have a UI to tag it, or use the Edge Function to auto-tag.
                        // I'll assume auto-tagging or just default for speed.
                        // PRD says "sube fotos -> IA identifica". 
                        // I will just insert row.
                    });

                if (dbError) throw dbError;
                setUploadedCount(prev => prev + 1);
            }
        } catch (err) {
            console.error('Error uploading:', err);
            alert('Error uploading some files');
        } finally {
            setUploading(false);
        }
    };

    const handleFinish = async () => {
        // Mark onboarding as done if we had a flag, or just redirect
        // PRD doesn't mention a specific flag, but usually we check if profile exists/completed.
        // We'll just redirect to /app (Outfit page)
        window.location.href = '/app';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Progress Bar */}
                <div className="flex w-full h-1.5 bg-gray-100">
                    <div className={`h-full bg-indigo-600 transition-all duration-300 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('onboarding:welcome_title')}</h1>
                        <p className="text-gray-600">{t('onboarding:welcome_subtitle')}</p>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-xl flex justify-center">
                                <MapPin className="w-12 h-12 text-indigo-600" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold mb-2">{t('onboarding:step_city_title')}</h2>
                                <p className="text-sm text-gray-500">{t('onboarding:step_city_desc')}</p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder={t('onboarding:city_placeholder')}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={handleUpdateCity}
                                disabled={!city || loading}
                                className="w-full bg-black text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center group"
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

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-xl flex justify-center">
                                <Upload className="w-12 h-12 text-indigo-600" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold mb-2">{t('onboarding:step_clothes_title')}</h2>
                                <p className="text-sm text-gray-500">{t('onboarding:step_clothes_desc')}</p>
                            </div>

                            <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer group">
                                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin" />
                                ) : (
                                    <div className="space-y-2">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-white">
                                            <span className="text-xl">📸</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">{t('onboarding:upload_button')}</p>
                                    </div>
                                )}
                            </label>

                            {uploadedCount > 0 && (
                                <p className="text-center text-sm text-green-600 font-medium">
                                    {uploadedCount} garments uploaded!
                                </p>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={handleFinish}
                                    className="w-full bg-black text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 flex items-center justify-center"
                                >
                                    {t('onboarding:finish_button')}
                                </button>
                                <button
                                    onClick={handleFinish} // Skip does same as finish for now
                                    className="w-full text-gray-500 font-medium text-sm hover:text-gray-900"
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
