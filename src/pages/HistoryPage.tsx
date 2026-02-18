import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import UpsellModal from '../components/wardrobe/UpsellModal';
import { Loader2, Star, Lock } from 'lucide-react';
import { OutfitCard } from '../components/outfit/OutfitCard';

export default function HistoryPage() {
    const { t } = useTranslation(['history', 'common', 'outfit', 'subscription']);
    const { canAccessFeature } = useSubscription();

    const [loading, setLoading] = useState(true);
    const [outfits, setOutfits] = useState<any[]>([]);
    const [garments, setGarments] = useState<any[]>([]);
    const [showUpsell, setShowUpsell] = useState(false);
    const [filterOccasion, setFilterOccasion] = useState('all');
    const [filterOrigin, setFilterOrigin] = useState('all');
    const [selectedOutfit, setSelectedOutfit] = useState<any | null>(null);

    useEffect(() => {
        if (!canAccessFeature('history')) { setShowUpsell(true); setLoading(false); return; }
        fetchHistory(); fetchGarments();
    }, [canAccessFeature]);

    const fetchHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase.from('outfits').select('*').eq('user_id', user.id).order('fecha', { ascending: false });
            if (error) throw error;
            setOutfits(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchGarments = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('garments').select('*').eq('user_id', user.id);
        setGarments(data || []);
    };

    const toggleFavorite = async (e: React.MouseEvent, id: string, currentVal: boolean) => {
        e.stopPropagation();
        try {
            const { error } = await supabase.from('outfits').update({ favorito: !currentVal }).eq('id', id);
            if (error) throw error;
            setOutfits(prev => prev.map(o => o.id === id ? { ...o, favorito: !currentVal } : o));
        } catch (err) { console.error(err); }
    };

    const filteredOutfits = outfits.filter(o => {
        if (filterOccasion !== 'all' && o.ocasion !== filterOccasion) return false;
        if (filterOrigin !== 'all' && o.origen !== filterOrigin) return false;
        return true;
    });

    const getOutfitForCard = (details: any) => ({
        nombre_look: details.nombre_look || t('outfit:title'),
        explicacion: details.descripcion_ocasion || '',
        style_notes: details.style_notes || '',
        color_palette: details.color_palette || [],
        prendas: {
            prenda_superior_id: details.prenda_superior_id,
            prenda_inferior_id: details.prenda_inferior_id,
            prenda_calzado_id: details.prenda_calzado_id,
            prenda_cinturon_id: details.prenda_cinturon_id,
            prenda_capa_exterior_id: details.prenda_capa_exterior_id,
            prenda_calcetines_id: details.prenda_calcetines_id,
        },
        imagen_prompt: details.imagen_prompt
    });

    if (showUpsell) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[70vh] animate-fade-in">
                <Lock className="w-8 h-8 text-[#AAAAAA] mb-4" strokeWidth={1} />
                <h2 className="font-serif font-normal text-xl text-[#1A1A1A] mb-2">{t('history:title')}</h2>
                <p className="text-sm text-[#6B6B6B] mb-6 text-center">{t('subscription:trial_limit_feature')}</p>
                <button onClick={() => setShowUpsell(true)} className="btn-primary w-auto px-10" style={{ width: 'auto' }}>
                    {t('subscription:reactivate')}
                </button>
                <UpsellModal isOpen={showUpsell} onClose={() => window.location.href = '/app'} featureName="history"
                    title={t('subscription:trial_limit_feature')}
                    description={t('subscription:trial_limit_wardrobe').replace('{{category}}', 'features')} />
            </div>
        );
    }

    return (
        <div className="pb-24 min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
                {/* Header + Filters */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E5E0DB] pb-8">
                    <div>
                        <h1 className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {t('history:title', 'Historial')}
                        </h1>
                        <p className="text-sm text-[#AAAAAA] font-light">{t('history:subtitle', 'Tus outfits guardados')}</p>
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={filterOccasion}
                            onChange={(e) => setFilterOccasion(e.target.value)}
                            className="input-md text-[12px] py-2 w-auto"
                        >
                            <option value="all">{t('history:filters.all_occasions', 'Todas')}</option>
                            <option value="Casual">{t('outfit:casual', 'Casual')}</option>
                            <option value="Smart Casual">{t('outfit:smart_casual', 'Elegante')}</option>
                            <option value="Business Casual">{t('outfit:business_casual', 'Negocios')}</option>
                            <option value="Formal">{t('outfit:formal', 'Formal')}</option>
                            <option value="Special">{t('outfit:special_event', 'Evento')}</option>
                        </select>
                        <select
                            value={filterOrigin}
                            onChange={(e) => setFilterOrigin(e.target.value)}
                            className="input-md text-[12px] py-2 w-auto"
                        >
                            <option value="all">{t('history:filters.all_origins', 'Todos')}</option>
                            <option value="diario">{t('history:filters.daily', 'Diario')}</option>
                            <option value="planificacion">{t('history:filters.weekly', 'Planificación')}</option>
                        </select>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center p-24">
                        <Loader2 className="animate-spin h-6 w-6 text-[#AAAAAA]" />
                    </div>
                ) : filteredOutfits.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-[#E5E0DB]">
                        <Star className="w-6 h-6 text-[#AAAAAA] mx-auto mb-4" strokeWidth={1} />
                        <h3 className="font-serif font-normal text-lg text-[#1A1A1A] mb-2">{t('history:empty', 'Sin outfits')}</h3>
                        <p className="text-sm text-[#6B6B6B] font-light">Empieza creando tus looks diarios.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredOutfits.map((outfit) => (
                            <div
                                key={outfit.id}
                                onClick={() => setSelectedOutfit(outfit)}
                                className="cursor-pointer border border-[#E5E0DB] hover:border-[#1A1A1A] transition-colors group"
                            >
                                {/* Thumbnail */}
                                <div className="aspect-[4/3] bg-[#F5F0EB] relative overflow-hidden">
                                    {outfit.imagen_generada_url ? (
                                        <img src={outfit.imagen_generada_url} className="w-full h-full object-cover" alt="Outfit" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-serif text-2xl text-[#E5E0DB] italic">Sartoria</span>
                                        </div>
                                    )}

                                    <div className="absolute top-3 left-3">
                                        <span className="text-[10px] tracking-[0.1em] uppercase px-2 py-1 bg-white/90 text-[#1A1A1A]">
                                            {outfit.origen === 'diario' ? t('history:daily_tag', 'Diario') : t('history:weekly_tag', 'Semanal')}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => toggleFavorite(e, outfit.id, outfit.favorito)}
                                        className={`absolute top-3 right-3 p-2 transition-all ${outfit.favorito ? 'text-[#8B7355]' : 'text-[#AAAAAA] hover:text-[#1A1A1A]'}`}
                                    >
                                        <Star className={`w-4 h-4 ${outfit.favorito ? 'fill-current' : ''}`} />
                                    </button>
                                </div>

                                <div className="p-5">
                                    <h3 className="font-serif font-normal text-sm text-[#1A1A1A] capitalize">
                                        {new Date(outfit.fecha).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B]">{outfit.ocasion}</span>
                                        {outfit.color_palette?.slice(0, 3).map((c: string, i: number) => (
                                            <div key={i} className="w-3 h-3" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedOutfit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setSelectedOutfit(null)}>
                    <div className="w-full max-w-lg bg-white max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedOutfit(null)} className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors float-right text-2xl font-light">&times;</button>
                        <OutfitCard outfit={getOutfitForCard(selectedOutfit)} allGarments={garments} onSelect={() => setSelectedOutfit(null)} />
                    </div>
                </div>
            )}
        </div>
    );
}
