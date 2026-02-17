import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';
import UpsellModal from '../components/wardrobe/UpsellModal';
import { OccasionSelector } from '../components/outfit/OccasionSelector';
import { supabase } from '../lib/supabase';
import { Loader2, Calendar, Check, RefreshCw, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    const { canAccessFeature, isTrial } = useSubscription();

    // State
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const [activeWeekStart, setActiveWeekStart] = useState<Date>(new Date()); // Monday of current week
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
        const today = new Date().toISOString().split('T')[0];
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
        <div className="pb-24 px-4 pt-4 max-w-4xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t('planning:title')}</h1>
                <p className="text-gray-500 text-sm mt-1">{weekDays[0].toLocaleDateString()} - {weekDays[4].toLocaleDateString()}</p>
            </header>

            {!generatedPlan.length ? (
                // CONFIGURATION STEP
                <div className="space-y-6">
                    {/* Style Mode Selector */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex space-x-4 mb-4">
                            <button
                                onClick={() => setCurrentStyleMode('same')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${currentStyleMode === 'same' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {t('planning:same_style')}
                            </button>
                            <button
                                onClick={() => setCurrentStyleMode('daily')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${currentStyleMode === 'daily' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {t('planning:per_day_style')}
                            </button>
                        </div>

                        {currentStyleMode === 'same' && (
                            <OccasionSelector value={globalOccasion} onChange={handleGlobalOccasionChange} />
                        )}
                    </div>

                    {/* Days List */}
                    <div className="space-y-3">
                        {weekDays.map(date => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = selectedDays.includes(dateStr);
                            const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });

                            return (
                                <div key={dateStr} className={`bg-white p-4 rounded-xl shadow-sm border transaction-colors ${isSelected ? 'border-gray-200' : 'border-transparent opacity-60'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleDaySelection(dateStr)}
                                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                            />
                                            <span className="font-medium text-gray-900 capitalize">{dayName}</span>
                                            <span className="text-gray-400 text-sm">{date.toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {isSelected && currentStyleMode === 'daily' && (
                                        <div className="ml-8 mt-2">
                                            <OccasionSelector
                                                value={occasions[dateStr] || 'Casual'}
                                                onChange={(val) => handleDayOccasionChange(dateStr, val)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={generating || selectedDays.length === 0}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="animate-spin" />
                                <span>{t('planning:generating')}</span>
                            </>
                        ) : (
                            <>
                                <Calendar className="w-5 h-5" />
                                <span>{t('planning:generate_button')}</span>
                            </>
                        )}
                    </button>
                </div>
            ) : (
                // GENERATED PLAN VIEW
                <div className="space-y-6">
                    {generatedPlan.map((day, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div className="p-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                                <div>
                                    <h3 className="font-bold text-gray-900 capitalize">
                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                    </h3>
                                    <p className="text-xs text-gray-500">{day.date}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{day.weather.temp}°</div>
                                        <div className="text-xs text-gray-500 capitalize">{day.weather.description}</div>
                                    </div>
                                    {/* Weather Icon could go here */}
                                </div>
                            </div>

                            {/* Outfit Content */}
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-lg">{day.outfit.nombre_look}</h4>
                                        <p className="text-gray-600 text-sm mt-1">{day.outfit.explicacion}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {/* Color Palette */}
                                    {day.outfit.color_palette?.map((color, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="mt-6 flex space-x-3">
                                    {day.approved ? (
                                        <div className="flex-1 bg-green-100 text-green-800 py-2 rounded-lg flex items-center justify-center space-x-2 cursor-default">
                                            <Check className="w-4 h-4" />
                                            <span className="font-medium">{t('planning:status_approved')}</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleApproveDay(day)}
                                            className="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800"
                                        >
                                            {t('planning:approve_day')}
                                        </button>
                                    )}
                                    {/* RegExp/Change logic to be added - simple placeholder */}
                                    <button className="p-2 text-gray-400 hover:text-gray-600">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="sticky bottom-20 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 shadow-lg flex space-x-3">
                        <button
                            onClick={handleApproveAll}
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-indigo-700"
                        >
                            {t('planning:approve_all')}
                        </button>
                        <button
                            onClick={() => setGeneratedPlan([])} // Reset to config
                            className="px-4 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {t('planning:new_plan')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
