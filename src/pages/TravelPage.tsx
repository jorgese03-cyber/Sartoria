import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';
import UpsellModal from '../components/wardrobe/UpsellModal';
import { supabase } from '../lib/supabase';
import { Loader2, Calendar, MapPin, Check, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Types (Reusing similar structure to PlanningPage but simplified or adapted)
interface DailyPlan {
    date: string;
    outfit: {
        nombre_look: string;
        explicacion: string;
        prendas: any;
        style_notes: string;
        color_palette: string[];
        imagen_prompt: string;
    };
    weather: {
        temp: number;
        condition: string;
        description: string;
    };
    approved: boolean; // repurposed as "packed" or similar? Or just reuse approval logic
}

export default function TravelPage() {
    const { t } = useTranslation(['travel', 'common', 'outfit', 'planning']); // Fallback to planning/outfit for common terms
    const { canAccessFeature } = useSubscription();
    const navigate = useNavigate();

    // State
    const [generating, setGenerating] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);

    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [generatedPlan, setGeneratedPlan] = useState<DailyPlan[]>([]);

    // Initial check
    useEffect(() => {
        if (!canAccessFeature('travel')) {
            setShowUpsell(true);
        }
    }, [canAccessFeature]);

    const handleGenerate = async () => {
        if (!destination) return;
        setGenerating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Prepare pseudo-preferences to guide the styler
            // We generate 5 days starting from startDate
            const start = new Date(startDate);
            const days = [];
            for (let i = 0; i < 5; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                days.push({
                    date: d.toISOString().split('T')[0],
                    occasion: 'Turismo / Casual', // Default for travel? Or add selector?
                    style: 'Cómodo y estiloso'
                });
            }

            const { data, error } = await supabase.functions.invoke('generate-weekly-plan', {
                body: {
                    user_id: user.id,
                    start_date: startDate,
                    city: destination,
                    preferences: days
                }
            });

            if (error) throw error;

            if (data && data.plan) {
                const planWithState = data.plan.map((p: any) => ({ ...p, approved: false }));
                setGeneratedPlan(planWithState);
            }

        } catch (err) {
            console.error(err);
            alert('Error generating travel plan');
        } finally {
            setGenerating(false);
        }
    };

    const handleApproveDay = async (dayPlan: DailyPlan) => {
        // Logic to save/approve. For now, just local state update to simulate "Packed" or "Approved"
        // Actually, saving to outfits table is good practice to have history.
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('outfits').insert({
                user_id: user.id,
                fecha: dayPlan.date,
                ocasion: 'Travel',
                prenda_superior_id: dayPlan.outfit.prendas.prenda_superior_id,
                prenda_inferior_id: dayPlan.outfit.prendas.prenda_inferior_id,
                prenda_calzado_id: dayPlan.outfit.prendas.prenda_calzado_id,
                prenda_cinturon_id: dayPlan.outfit.prendas.prenda_cinturon_id,
                prenda_capa_exterior_id: dayPlan.outfit.prendas.prenda_capa_exterior_id,
                prenda_calcetines_id: dayPlan.outfit.prendas.prenda_calcetines_id,
                color_palette: dayPlan.outfit.color_palette,
                style_notes: dayPlan.outfit.style_notes,
                imagen_prompt: dayPlan.outfit.imagen_prompt,
                temperatura: dayPlan.weather.temp,
                condicion_clima: dayPlan.weather.condition,
                elegido: true,
                origen: 'planificacion' // or 'travel' if we add that enum
            });

            if (error) throw error;
            setGeneratedPlan(prev => prev.map(p => p.date === dayPlan.date ? { ...p, approved: true } : p));

        } catch (err) {
            console.error(err);
        }
    };

    if (showUpsell) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-[50vh]">
                <Plane className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('travel:title')}</h2>
                <p className="text-gray-500 mb-6 text-center">{t('subscription:trial_limit_feature')}</p>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium" onClick={() => setShowUpsell(true)}>
                    {t('subscription:reactivate')}
                </button>
                <UpsellModal
                    isOpen={showUpsell}
                    onClose={() => navigate(-1)}
                    featureName="travel"
                    title={t('subscription:trial_limit_feature')}
                    description={t('subscription:trial_limit_wardrobe').replace('{{category}}', 'features')}
                />
            </div>
        )
    }

    return (
        <div className="pb-24 px-4 pt-4 max-w-4xl mx-auto">
            <header className="mb-6 flex items-center space-x-2">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{t('travel:title')}</h1>
            </header>

            {!generatedPlan.length ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('travel:destination_label')}
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder={t('travel:destination_placeholder')}
                                className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3 border"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('travel:start_date_label')}
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3 border"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={generating || !destination}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {generating ? <Loader2 className="animate-spin" /> : <Plane className="w-5 h-5" />}
                        <span>{generating ? t('travel:generating') : t('travel:generate_button')}</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">{t('travel:trip_plan')} - {destination}</h2>
                        <button onClick={() => setGeneratedPlan([])} className="text-sm text-indigo-600 font-medium">
                            {t('planning:new_plan')}
                        </button>
                    </div>

                    {generatedPlan.map((day, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Reusing view from PlanningPage mostly */}
                            <div className="p-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                                <div>
                                    <h3 className="font-bold text-gray-900 capitalize">
                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                    </h3>
                                    <p className="text-xs text-gray-500">{day.date}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">{day.weather.temp}°</div>
                                    <div className="text-xs text-gray-500 capitalize">{day.weather.description}</div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h4 className="font-bold text-lg">{day.outfit.nombre_look}</h4>
                                <p className="text-gray-600 text-sm mt-1 mb-4">{day.outfit.explicacion}</p>

                                <div className="flex justify-end">
                                    {day.approved ? (
                                        <span className="text-green-600 font-medium flex items-center text-sm">
                                            <Check className="w-4 h-4 mr-1" /> Packed
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleApproveDay(day)}
                                            className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
