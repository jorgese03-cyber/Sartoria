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
            <div className="p-4 flex flex-col items-center justify-center h-[70vh] animate-fade-in">
                <div className="bg-gray-50 p-6 rounded-full mb-6">
                    <Plane className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-serif font-medium text-gray-900 mb-3">{t('travel:title')}</h2>
                <p className="text-gray-500 mb-8 text-center max-w-md font-light text-lg">{t('subscription:trial_limit_feature')}</p>
                <button
                    className="bg-black text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-gray-900 transition-all transform hover:-translate-y-1"
                    onClick={() => setShowUpsell(true)}
                >
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
        <div className="pb-24 min-h-screen bg-[#F9F9F9]">
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 animate-fade-in">
                {/* Header */}
                <header className="flex flex-col gap-3 text-center sm:text-left">
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-4xl font-serif font-medium text-gray-900 tracking-tight">
                            Smart <span className="italic text-[#d4af37]">Packing</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 font-light text-lg max-w-2xl sm:ml-10">
                        Generate a complete packing list and outfits for your next trip based on weather and destination.
                    </p>
                </header>

                {!generatedPlan.length ? (
                    <div className="bg-white p-8 rounded-3xl shadow-premium border border-gray-50 space-y-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 uppercase tracking-wide mb-3">
                                {t('travel:destination_label', 'Where are you going?')}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-focus-within:text-black group-focus-within:bg-gray-100 transition-colors">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder={t('travel:destination_placeholder', 'e.g. Paris, Tokyo, New York')}
                                    className="block w-full rounded-2xl border-gray-100 bg-gray-50/50 pl-16 pr-4 py-4 text-lg placeholder-gray-400 focus:border-black focus:ring-black transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 uppercase tracking-wide mb-3">
                                {t('travel:start_date_label', 'When does the trip start?')}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-focus-within:text-black group-focus-within:bg-gray-100 transition-colors">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <input
                                    type="date"
                                    value={startDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="block w-full rounded-2xl border-gray-100 bg-gray-50/50 pl-16 pr-4 py-4 text-lg text-gray-900 focus:border-black focus:ring-black transition-all shadow-sm appearance-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={generating || !destination}
                            className={`
                                w-full py-5 rounded-full font-serif text-xl tracking-wide transition-all transform active:scale-[0.99]
                                flex items-center justify-center gap-3 relative overflow-hidden group
                                ${generating || !destination
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white shadow-xl hover:shadow-2xl hover:bg-gray-900'
                                }
                            `}
                        >
                            {generating ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin w-5 h-5" />
                                    <span>{t('travel:generating', 'Curating Trip...')}</span>
                                </span>
                            ) : (
                                <>
                                    <span>{t('travel:generate_button', 'Generate Packing List')}</span>
                                    <Plane className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
                                    <Plane className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-medium text-gray-900">{destination}</h2>
                                    <span className="text-sm text-gray-500 font-light">5 Days Trip</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setGeneratedPlan([])}
                                className="px-6 py-2.5 rounded-full border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors text-gray-600"
                            >
                                {t('planning:new_plan', 'Plan New Trip')}
                            </button>
                        </div>

                        <div className="space-y-6">
                            {generatedPlan.map((day, index) => (
                                <div key={index} className="bg-white rounded-3xl shadow-premium overflow-hidden border border-gray-100 flex flex-col md:flex-row transition-transform hover:scale-[1.01] duration-300">
                                    {/* Date Column */}
                                    <div className="md:w-32 bg-gray-50 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-100 text-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{day.date}</span>
                                        <h3 className="text-lg font-serif font-medium text-gray-900 mt-1 capitalize leading-tight">
                                            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                        </h3>
                                        <div className="mt-3 flex flex-col items-center gap-1">
                                            <span className="text-2xl font-light text-gray-900">{Math.round(day.weather.temp)}°</span>
                                            <span className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">{day.weather.condition}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 md:p-8">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-xl font-serif font-medium text-gray-900">{day.outfit.nombre_look}</h4>
                                                <p className="text-gray-500 font-light text-sm mt-1 mb-4 italic">
                                                    "{day.outfit.explicacion}"
                                                </p>
                                            </div>
                                            <div className="hidden md:flex -space-x-2">
                                                {day.outfit.color_palette?.slice(0, 4).map((color, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end pt-4 border-t border-gray-50">
                                            {day.approved ? (
                                                <span className="bg-[#F0FDF4] text-[#166534] px-4 py-2 rounded-full font-medium flex items-center text-xs tracking-wide shadow-sm border border-[#DCFCE7]">
                                                    <Check className="w-3.5 h-3.5 mr-1.5" strokeWidth={3} /> PACKED
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleApproveDay(day)}
                                                    className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider hover:bg-gray-800 transition-all shadow-md active:scale-95"
                                                >
                                                    Confirm & Pack
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
