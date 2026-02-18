import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, MapPin, Upload, ArrowRight, Camera } from 'lucide-react';

export default function OnboardingPage() {
    const { t } = useTranslation(['onboarding', 'common', 'wardrobe']);
    const { user } = useAuth();

    // Steps: 1 = City, 2 = Model Photo, 3 = Clothes
    const [step, setStep] = useState(1);
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 2 state
    const [modelUploading, setModelUploading] = useState(false);

    // Step 3 state (Clothes)
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

    // Step 2: Model Photo
    const handleModelPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setModelUploading(true);

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        // Path: userId/model.<ext> to always overwrite or keep one per user
        const filePath = `${user.id}/model.${fileExt}`;

        try {
            // Check if bucket exists? No, assumed created by migration/hook. 
            // Just try upload.
            const { error: uploadError } = await supabase.storage
                .from('user-models')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-models')
                .getPublicUrl(filePath);

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    model_photo_url: publicUrl + '?t=' + Date.now(), // Cache bust 
                    use_default_model: false
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Go to next step
            setStep(3);

        } catch (err) {
            console.error('Error uploading model photo:', err);
            alert('Error uploading photo. Please try again.');
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
            setStep(3);
        } catch (err) {
            console.error('Error setting default model:', err);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Clothes Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        setUploading(true);

        const files = Array.from(e.target.files);

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('garments')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('garments')
                    .getPublicUrl(filePath);

                const { error: dbError } = await supabase
                    .from('garments')
                    .insert({
                        user_id: user.id,
                        imagen_url: publicUrl,
                        categoria: 'Camiseta', // Default
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
        window.location.href = '/app';
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-premium overflow-hidden border border-gray-50">
                {/* Progress Bar - Minimalist */}
                <div className="flex w-full h-1 bg-gray-100">
                    <div
                        className="h-full bg-black transition-all duration-500 ease-out"
                        style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                    />
                </div>

                <div className="p-10">
                    <div className="text-center mb-10">
                        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2 block">Step {step} of 3</span>
                        <h1 className="text-3xl font-serif font-medium text-gray-900 mb-3">
                            {step === 1 && t('onboarding:welcome_title', 'Welcome')}
                            {step === 2 && 'Your Style Profile'}
                            {step === 3 && 'Build Your Wardrobe'}
                        </h1>
                        <p className="text-gray-500 font-light text-sm">
                            {step === 1 && t('onboarding:welcome_subtitle', 'Let\'s get started')}
                            {step === 2 && 'Upload a photo to see yourself in new outfits.'}
                            {step === 3 && 'Add a few items to get your first recommendation.'}
                        </p>
                    </div>

                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-gray-50 p-6 rounded-2xl flex justify-center border border-gray-100">
                                <MapPin className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                                <h2 className="text-lg font-medium text-gray-900 mb-2">{t('onboarding:step_city_title', 'Where are you based?')}</h2>
                                <p className="text-xs text-gray-500">{t('onboarding:step_city_desc', 'For accurate weather-based recommendations')}</p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder={t('onboarding:city_placeholder', 'e.g. Madrid, ES')}
                                    className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400 text-center text-lg"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={handleUpdateCity}
                                disabled={!city || loading}
                                className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center group transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        {t('onboarding:next', 'Continue')}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            {/* <div className="bg-gray-50 p-6 rounded-2xl flex justify-center border border-gray-100">
                                <User className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
                            </div> */}

                            <div className="relative group cursor-pointer">
                                <input type="file" accept="image/*" onChange={handleModelPhotoUpload} className="hidden" id="model-upload" disabled={modelUploading} />
                                <label htmlFor="model-upload" className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-black hover:bg-gray-50 transition-all cursor-pointer">
                                    {modelUploading ? (
                                        <Loader2 className="w-8 h-8 mx-auto text-black animate-spin" />
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-white border border-gray-200 group-hover:border-gray-300 transition-all">
                                                <Camera className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">Upload full body photo</p>
                                            <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="space-y-4">
                                <button
                                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center group transition-all"
                                    onClick={() => document.getElementById('model-upload')?.click()}
                                >
                                    Select Photo
                                </button>
                                <button
                                    onClick={handleUseDefaultModel}
                                    disabled={loading || modelUploading}
                                    className="w-full text-gray-500 font-medium text-sm hover:text-black transition-colors"
                                >
                                    Skip & use default model
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center">
                                <div className="inline-block p-4 rounded-full bg-gray-50 mb-4 border border-gray-100">
                                    <Upload className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
                                </div>
                                {/* <h2 className="text-lg font-medium text-gray-900 mb-2">{t('onboarding:step_clothes_title', 'Upload Garments')}</h2>
                                <p className="text-xs text-gray-500">{t('onboarding:step_clothes_desc', 'Take photos of your clothes')}</p> */}
                            </div>

                            <label className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-black hover:bg-gray-50 transition-colors cursor-pointer group">
                                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 mx-auto text-black animate-spin" />
                                ) : (
                                    <div className="space-y-2">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-white transition-all border border-gray-200">
                                            <span className="text-xl">📸</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{t('onboarding:upload_button', 'Add Photos')}</p>
                                        <p className="text-xs text-gray-400">Multiple selection allowed</p>
                                    </div>
                                )}
                            </label>

                            {uploadedCount > 0 && (
                                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-center text-sm font-medium border border-green-100 flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    {uploadedCount} garments uploaded!
                                </div>
                            )}

                            <div className="space-y-3 pt-4">
                                <button
                                    onClick={handleFinish}
                                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-800 flex items-center justify-center transition-all"
                                >
                                    {t('onboarding:finish_button', 'Finish Setup')}
                                </button>
                                <button
                                    onClick={handleFinish}
                                    className="w-full text-gray-400 font-medium text-xs hover:text-gray-600 transition-colors uppercase tracking-widest"
                                >
                                    {t('onboarding:skip', 'Skip for now')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
