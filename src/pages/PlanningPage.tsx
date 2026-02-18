import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';
import UpsellModal from '../components/wardrobe/UpsellModal';
import { OccasionSelector } from '../components/outfit/OccasionSelector';
import { supabase } from '../lib/supabase';
import { Loader2, Calendar, Check, RefreshCw, Lock } from 'lucide-react';

// Types
interface DailyPlan {
    date: string;
    outfit: {
        nombre_look: string;
        explicacion: string;
        prendas: any; // Simplified for now
        style_notes: string;
        color_palette: string[];
        imagen_prompt: string;
    };
    weather: {
        temp: number;
        condition: string;
        description: string;
    };
    approved: boolean;
}

export default function PlanningPage() {
    const { t } = useTranslation(['planning', 'common', 'outfit']);
    const { canAccessFeature } = useSubscription();

    // State
    const [generating, setGenerating] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const [activeWeekStart] = useState<Date>(new Date()); // Monday of current week
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [occasions, setOccasions] = useState<Record<string, string>>({});
    const [generatedPlan, setGeneratedPlan] = useState<DailyPlan[]>([]);
    const [currentStyleMode, setCurrentStyleMode] = useState<'same' | 'daily'>('same');
    const [globalOccasion, setGlobalOccasion] = useState<string>('Casual');

    // Calculate week days
    const getWeekDays = (startDate: Date) => {
        const days = [];
        // Ensure we start on Monday
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(startDate.setDate(diff));

        for (let i = 0; i < 5; i++) { // Mon-Fri
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(new Date(activeWeekStart));

    // Initial setup
    useEffect(() => {
        // Check access
        if (!canAccessFeature('planning')) {
            setShowUpsell(true);
        }

        // Default: Select all days from today onwards (or all if next week)

        const defaultSelected = weekDays
            .map(d => d.toISOString().split('T')[0])
        // .filter(d => d >= today); // Allow planning for past days? Maybe not.

        setSelectedDays(defaultSelected);

        // Load existing plan if any? (Not implemented in backend yet, strictly generic generation for now)
    }, [canAccessFeature]);

    // Handlers
    const handleGlobalOccasionChange = (val: string) => {
        setGlobalOccasion(val);
        // Update all specific occasions
        const newOccasions = { ...occasions };
        weekDays.forEach(d => {
            const dateStr = d.toISOString().split('T')[0];
            newOccasions[dateStr] = val;
        });
        setOccasions(newOccasions);
    };

    const handleDayOccasionChange = (date: string, val: string) => {
        setOccasions(prev => ({ ...prev, [date]: val }));
    };

    const toggleDaySelection = (date: string) => {
        if (selectedDays.includes(date)) {
            setSelectedDays(prev => prev.filter(d => d !== date));
        } else {
            setSelectedDays(prev => [...prev, date]);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Prepare preferences
            const preferences = selectedDays.map(date => ({
                date,
                occasion: currentStyleMode === 'same' ? globalOccasion : (occasions[date] || 'Casual'),
                style: 'Adaptado a la ocasión' // Default logic
            }));

            const { data, error } = await supabase.functions.invoke('generate-weekly-plan', {
                body: {
                    user_id: user.id,
                    start_date: weekDays[0].toISOString().split('T')[0], // Send Monday
                    preferences
                }
            });

            if (error) throw error;

            if (data && data.plan) {
                // Add approved: false to each
                const planWithState = data.plan.map((p: any) => ({ ...p, approved: false }));
                setGeneratedPlan(planWithState);
            }

        } catch (err) {
            console.error(err);
            alert('Error generating plan');
        } finally {
            setGenerating(false);
        }
    };

    const handleApproveDay = async (dayPlan: DailyPlan) => {
        // Save to outfits table
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('outfits').insert({
                user_id: user.id,
                fecha: dayPlan.date,
                ocasion: occasions[dayPlan.date] || globalOccasion, // Fallback
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
                origen: 'planificacion'
            });

            if (error) throw error;

            // Update state
            setGeneratedPlan(prev => prev.map(p => p.date === dayPlan.date ? { ...p, approved: true } : p));

        } catch (err) {
            console.error('Error approving day:', err);
            alert('Error saving outfit');
        }
    };

    const handleApproveAll = async () => {
        for (const day of generatedPlan) {
            if (!day.approved) {
                await handleApproveDay(day);
            }
        }
    };

    if (showUpsell) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-[50vh]">
                <Lock className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('planning:title')}</h2>
                <p className="text-gray-500 mb-6 text-center">{t('subscription:trial_limit_feature')}</p>
                <button
                    onClick={() => setShowUpsell(true)} // Re-trigger modal just in case
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                    {t('subscription:reactivate')}
                </button>
                <UpsellModal
                    isOpen={showUpsell}
                    onClose={() => window.location.href = '/app'} // Redirect back if they verify close
                    featureName="planning"
                    title={t('subscription:trial_limit_feature')}
                    description={t('subscription:trial_limit_wardrobe').replace('{{category}}', 'features')} // Fallback text
                />
            </div>
        )
    }

    return (
        <div className="pb-24 min-h-screen bg-[#F9F9F9]">
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 animate-fade-in">
                {/* Header */}
                <header className="flex flex-col gap-3 text-center sm:text-left">
                    <h1 className="text-4xl font-serif font-medium text-gray-900 tracking-tight">
                        Weekly <span className="italic text-[#d4af37]">Planner</span>
                    </h1>
                    <p className="text-gray-500 font-light text-lg max-w-2xl">
                        Plan your outfits for the upcoming week based on your schedule and weather.
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mt-2">
                        {weekDays[0].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} - {weekDays[4].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </p>
                </header>

                {!generatedPlan.length ? (
                    // CONFIGURATION STEP
                    <div className="space-y-8 bg-white p-8 rounded-3xl shadow-premium border border-gray-50">
                        {/* Style Mode Selector */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-900 uppercase tracking-wide">Style Preference</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setCurrentStyleMode('same')}
                                    className={`py-4 px-6 rounded-xl text-sm font-medium transition-all duration-300 border ${currentStyleMode === 'same' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-900'}`}
                                >
                                    {t('planning:same_style', 'Same Style All Week')}
                                </button>
                                <button
                                    onClick={() => setCurrentStyleMode('daily')}
                                    className={`py-4 px-6 rounded-xl text-sm font-medium transition-all duration-300 border ${currentStyleMode === 'daily' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-900'}`}
                                >
                                    {t('planning:per_day_style', 'Different Style Per Day')}
                                </button>
                            </div>

                            {currentStyleMode === 'same' && (
                                <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                                    <OccasionSelector value={globalOccasion} onChange={handleGlobalOccasionChange} />
                                </div>
                            )}
                        </div>

                        {/* Days List */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-900 uppercase tracking-wide">Select Days</label>
                            <div className="grid gap-3">
                                {weekDays.map(date => {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isSelected = selectedDays.includes(dateStr);
                                    const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });

                                    return (
                                        <div
                                            key={dateStr}
                                            onClick={() => toggleDaySelection(dateStr)}
                                            className={`
                                                relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer group
                                                ${isSelected
                                                    ? 'bg-gray-50 border-gray-200 shadow-sm'
                                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`
                                                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300
                                                        ${isSelected ? 'bg-black border-black' : 'border-gray-300 group-hover:border-gray-400'}
                                                    `}>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <span className={`block text-lg font-serif font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{dayName}</span>
                                                        <span className="text-xs text-gray-400 font-light">{date.toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                {/* Only show selector here if daily mode AND selected */}
                                                {isSelected && currentStyleMode === 'daily' && (
                                                    <div className="w-1/2" onClick={(e) => e.stopPropagation()}>
                                                        <OccasionSelector
                                                            value={occasions[dateStr] || 'Casual'}
                                                            onChange={(val) => handleDayOccasionChange(dateStr, val)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={generating || selectedDays.length === 0}
                                className={`
                                    w-full py-5 rounded-full font-serif text-xl tracking-wide transition-all transform active:scale-[0.99]
                                    flex items-center justify-center gap-3 relative overflow-hidden group
                                    ${generating
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-black text-white shadow-xl hover:shadow-2xl hover:bg-gray-900'
                                    }
                                `}
                            >
                                {generating ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Curating your week...</span>
                                    </span>
                                ) : (
                                    <>
                                        <span>Generate Plan</span>
                                        <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    // GENERATED PLAN VIEW
                    <div className="space-y-8">
                        {generatedPlan.map((day, index) => (
                            <div key={index} className="bg-white rounded-3xl shadow-premium overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                                {/* Date Column */}
                                <div className="md:w-1/4 bg-gray-50 p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 text-center md:text-left">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{day.date}</span>
                                    <h3 className="text-2xl font-serif font-medium text-gray-900 mt-1 capitalize">
                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                    </h3>
                                    <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-gray-500">
                                        <span className="text-2xl font-light text-gray-900">{Math.round(day.weather.temp)}°</span>
                                        <span className="text-sm capitalize font-light border-l border-gray-300 pl-2">{day.weather.description}</span>
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 p-8">
                                    <div className="flex flex-col h-full justify-between gap-6">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-xl font-serif font-medium text-gray-900">{day.outfit.nombre_look}</h4>
                                                <div className="flex -space-x-2">
                                                    {day.outfit.color_palette?.map((color, i) => (
                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 font-light leading-relaxed border-l-2 border-[#d4af37] pl-4 italic">
                                                "{day.outfit.explicacion}"
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                            {day.approved ? (
                                                <div className="flex-1 bg-[#F0FDF4] text-[#166534] py-3 rounded-xl flex items-center justify-center gap-2 border border-[#DCFCE7]">
                                                    <Check className="w-5 h-5" />
                                                    <span className="font-medium text-sm tracking-wide">{t('planning:status_approved', 'Approved')}</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleApproveDay(day)}
                                                    className="flex-1 bg-black text-white py-3 rounded-xl font-medium text-sm tracking-wide shadow-lg hover:bg-gray-800 transition-all hover:shadow-xl active:scale-95"
                                                >
                                                    {t('planning:approve_day', 'Save & Approve')}
                                                </button>
                                            )}
                                            <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all" title="Regenerate">
                                                <RefreshCw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="sticky bottom-6 z-20 mx-auto max-w-md">
                            <div className="bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-2xl border border-gray-100 flex gap-2">
                                <button
                                    onClick={handleApproveAll}
                                    className="flex-1 bg-black text-white py-3 px-6 rounded-full font-medium text-sm transition-all hover:bg-gray-800 shadow-md"
                                >
                                    {t('planning:approve_all', 'Approve All Days')}
                                </button>
                                <button
                                    onClick={() => setGeneratedPlan([])} // Reset to config
                                    className="px-6 py-3 bg-gray-100 text-gray-600 font-medium text-sm rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    {t('planning:new_plan', 'Start Over')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
