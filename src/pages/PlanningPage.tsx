import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';
import UpsellModal from '../components/wardrobe/UpsellModal';
import { OccasionSelector } from '../components/outfit/OccasionSelector';
import { supabase } from '../lib/supabase';
import { Loader2, Check, RefreshCw, Lock } from 'lucide-react';

interface DailyPlan {
    date: string;
    outfit: { nombre_look: string; explicacion: string; prendas: any; style_notes: string; color_palette: string[]; imagen_prompt: string; };
    weather: { temp: number; condition: string; description: string; };
    approved: boolean;
}

export default function PlanningPage() {
    const { t } = useTranslation(['planning', 'common', 'outfit']);
    const { canAccessFeature } = useSubscription();

    const [generating, setGenerating] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const [activeWeekStart] = useState<Date>(new Date());
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [occasions, setOccasions] = useState<Record<string, string>>({});
    const [generatedPlan, setGeneratedPlan] = useState<DailyPlan[]>([]);
    const [currentStyleMode, setCurrentStyleMode] = useState<'same' | 'daily'>('same');
    const [globalOccasion, setGlobalOccasion] = useState<string>('Casual');

    const getWeekDays = (startDate: Date) => {
        const days = [];
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(startDate.setDate(diff));
        for (let i = 0; i < 5; i++) { const d = new Date(monday); d.setDate(monday.getDate() + i); days.push(d); }
        return days;
    };

    const weekDays = getWeekDays(new Date(activeWeekStart));

    useEffect(() => {
        if (!canAccessFeature('planning')) { setShowUpsell(true); }
        const defaultSelected = weekDays.map(d => d.toISOString().split('T')[0]);
        setSelectedDays(defaultSelected);
    }, [canAccessFeature]);

    const handleGlobalOccasionChange = (val: string) => {
        setGlobalOccasion(val);
        const newOccasions = { ...occasions };
        weekDays.forEach(d => { newOccasions[d.toISOString().split('T')[0]] = val; });
        setOccasions(newOccasions);
    };

    const handleDayOccasionChange = (date: string, val: string) => { setOccasions(prev => ({ ...prev, [date]: val })); };
    const toggleDaySelection = (date: string) => {
        if (selectedDays.includes(date)) { setSelectedDays(prev => prev.filter(d => d !== date)); }
        else { setSelectedDays(prev => [...prev, date]); }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const preferences = selectedDays.map(date => ({
                date,
                occasion: currentStyleMode === 'same' ? globalOccasion : (occasions[date] || 'Casual'),
                style: 'Adaptado a la ocasión'
            }));
            const { data, error } = await supabase.functions.invoke('generate-weekly-plan', {
                body: { user_id: user.id, start_date: weekDays[0].toISOString().split('T')[0], preferences }
            });
            if (error) throw error;
            if (data?.plan) { setGeneratedPlan(data.plan.map((p: any) => ({ ...p, approved: false }))); }
        } catch (err) { console.error(err); alert('Error generando plan'); }
        finally { setGenerating(false); }
    };

    const handleApproveDay = async (dayPlan: DailyPlan) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabase.from('outfits').insert({
                user_id: user.id, fecha: dayPlan.date, ocasion: occasions[dayPlan.date] || globalOccasion,
                prenda_superior_id: dayPlan.outfit.prendas.prenda_superior_id,
                prenda_inferior_id: dayPlan.outfit.prendas.prenda_inferior_id,
                prenda_calzado_id: dayPlan.outfit.prendas.prenda_calzado_id,
                prenda_cinturon_id: dayPlan.outfit.prendas.prenda_cinturon_id,
                prenda_capa_exterior_id: dayPlan.outfit.prendas.prenda_capa_exterior_id,
                prenda_calcetines_id: dayPlan.outfit.prendas.prenda_calcetines_id,
                color_palette: dayPlan.outfit.color_palette, style_notes: dayPlan.outfit.style_notes,
                imagen_prompt: dayPlan.outfit.imagen_prompt, temperatura: dayPlan.weather.temp,
                condicion_clima: dayPlan.weather.condition, elegido: true, origen: 'planificacion'
            });
            if (error) throw error;
            setGeneratedPlan(prev => prev.map(p => p.date === dayPlan.date ? { ...p, approved: true } : p));
        } catch (err) { console.error(err); alert('Error guardando outfit'); }
    };

    const handleApproveAll = async () => {
        for (const day of generatedPlan) { if (!day.approved) await handleApproveDay(day); }
    };

    if (showUpsell) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[50vh] animate-fade-in">
                <Lock className="w-8 h-8 text-[#AAAAAA] mb-4" strokeWidth={1} />
                <h2 className="font-serif font-normal text-xl text-[#1A1A1A] mb-2">{t('planning:title')}</h2>
                <p className="text-sm text-[#6B6B6B] mb-6 text-center">{t('subscription:trial_limit_feature')}</p>
                <button onClick={() => setShowUpsell(true)} className="btn-primary w-auto px-10" style={{ width: 'auto' }}>
                    {t('subscription:reactivate')}
                </button>
                <UpsellModal isOpen={showUpsell} onClose={() => window.location.href = '/app'} featureName="planning"
                    title={t('subscription:trial_limit_feature')}
                    description={t('subscription:trial_limit_wardrobe').replace('{{category}}', 'features')} />
            </div>
        );
    }

    return (
        <div className="pb-24 min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
                <header className="space-y-2">
                    <h1 className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {t('planning:title', 'Plan semanal')}
                    </h1>
                    <p className="text-sm text-[#AAAAAA] font-light">
                        {weekDays[0].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} — {weekDays[4].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </p>
                </header>

                {!generatedPlan.length ? (
                    <div className="space-y-10">
                        {/* Style Mode */}
                        <div className="space-y-4">
                            <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">{t('planning:style_preference', 'Modo de estilo')}</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCurrentStyleMode('same')}
                                    className={`flex-1 py-4 border transition-all text-[12px] tracking-[0.1em] uppercase
                                        ${currentStyleMode === 'same' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E5E0DB] text-[#6B6B6B] hover:border-[#1A1A1A]'}`}
                                >
                                    {t('planning:same_style', 'Mismo estilo')}
                                </button>
                                <button
                                    onClick={() => setCurrentStyleMode('daily')}
                                    className={`flex-1 py-4 border transition-all text-[12px] tracking-[0.1em] uppercase
                                        ${currentStyleMode === 'daily' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E5E0DB] text-[#6B6B6B] hover:border-[#1A1A1A]'}`}
                                >
                                    {t('planning:per_day_style', 'Por día')}
                                </button>
                            </div>

                            {currentStyleMode === 'same' && (
                                <div className="pt-4 border-t border-[#E5E0DB] animate-fade-in">
                                    <OccasionSelector value={globalOccasion} onChange={handleGlobalOccasionChange} />
                                </div>
                            )}
                        </div>

                        {/* Days */}
                        <div className="space-y-4">
                            <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">{t('planning:select_days', 'Seleccionar días')}</p>
                            {weekDays.map(date => {
                                const dateStr = date.toISOString().split('T')[0];
                                const isSelected = selectedDays.includes(dateStr);
                                const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => toggleDaySelection(dateStr)}
                                        className={`flex items-center justify-between p-5 border cursor-pointer transition-all
                                            ${isSelected ? 'border-[#1A1A1A]' : 'border-[#E5E0DB] hover:border-[#AAAAAA]'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 border flex items-center justify-center transition-colors
                                                ${isSelected ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'border-[#E5E0DB]'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={2} />}
                                            </div>
                                            <div>
                                                <span className={`block text-sm capitalize ${isSelected ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'}`}>{dayName}</span>
                                                <span className="text-[11px] text-[#AAAAAA]">{date.toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {isSelected && currentStyleMode === 'daily' && (
                                            <div className="w-1/2" onClick={(e) => e.stopPropagation()}>
                                                <OccasionSelector value={occasions[dateStr] || 'Casual'} onChange={(val) => handleDayOccasionChange(dateStr, val)} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={generating || selectedDays.length === 0}
                            className="btn-primary"
                        >
                            {generating ? <Loader2 className="animate-spin h-4 w-4" /> : t('planning:generate_button', 'Generar plan')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {generatedPlan.map((day, index) => (
                            <div key={index} className="border border-[#E5E0DB] animate-fade-in">
                                {/* Date + Weather */}
                                <div className="p-6 border-b border-[#E5E0DB]">
                                    <p className="text-[11px] tracking-[0.15em] uppercase text-[#AAAAAA]">{day.date}</p>
                                    <h3 className="font-serif font-normal text-lg text-[#1A1A1A] capitalize mt-1">
                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                    </h3>
                                    <p className="text-sm text-[#6B6B6B] font-light mt-1">
                                        {Math.round(day.weather.temp)}°C · <span className="capitalize">{day.weather.description}</span>
                                    </p>
                                </div>

                                {/* Outfit info */}
                                <div className="p-6 space-y-4">
                                    <h4 className="font-serif font-normal text-lg text-[#1A1A1A]">{day.outfit.nombre_look}</h4>
                                    <p className="text-sm text-[#6B6B6B] font-light italic">"{day.outfit.explicacion}"</p>

                                    {day.outfit.color_palette?.length > 0 && (
                                        <div className="flex gap-2">
                                            {day.outfit.color_palette.map((color, i) => (
                                                <div key={i} className="w-4 h-4" style={{ backgroundColor: color }} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-[#E5E0DB]">
                                        {day.approved ? (
                                            <div className="flex items-center gap-2 text-[#2D5A27]">
                                                <Check className="w-4 h-4" />
                                                <span className="text-[12px] tracking-[0.1em] uppercase">{t('planning:status_approved', 'Aprobado')}</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleApproveDay(day)} className="btn-primary w-auto px-8" style={{ width: 'auto' }}>
                                                {t('planning:approve_day', 'Aprobar')}
                                            </button>
                                        )}
                                        <button className="p-2 text-[#AAAAAA] hover:text-[#1A1A1A] transition-colors" title="Regenerar">
                                            <RefreshCw className="w-4 h-4" strokeWidth={1} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-4">
                            <button onClick={handleApproveAll} className="btn-primary flex-1">
                                {t('planning:approve_all', 'Aprobar todo')}
                            </button>
                            <button onClick={() => setGeneratedPlan([])} className="btn-secondary flex-1">
                                {t('planning:new_plan', 'Nuevo plan')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
