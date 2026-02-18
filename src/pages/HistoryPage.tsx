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
    const [garments, setGarments] = useState<any[]>([]); // Need garments to render cards
    const [showUpsell, setShowUpsell] = useState(false);

    const [filterOccasion, setFilterOccasion] = useState('all');
    const [filterOrigin, setFilterOrigin] = useState('all');
    const [selectedOutfit, setSelectedOutfit] = useState<any | null>(null);

    useEffect(() => {
        if (!canAccessFeature('history')) {
            setShowUpsell(true);
            setLoading(false);
            return;
        }
        fetchHistory();
        fetchGarments();
    }, [canAccessFeature]);

    const fetchHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from('outfits')
                .select('*')
                .eq('user_id', user.id)
                .order('fecha', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            setOutfits(data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
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
            const { error } = await supabase
                .from('outfits')
                .update({ favorito: !currentVal })
                .eq('id', id);

            if (error) throw error;
            setOutfits(prev => prev.map(o => o.id === id ? { ...o, favorito: !currentVal } : o));
        } catch (err) {
            console.error(err);
        }
    };

    const filteredOutfits = outfits.filter(o => {
        if (filterOccasion !== 'all' && o.ocasion !== filterOccasion) return false;
        if (filterOrigin !== 'all' && o.origen !== filterOrigin) return false;
        return true;
    });

    // Construct OutfitRecommendation object for the Card
    const getOutfitForCard = (details: any) => {
        return {
            nombre_look: details.nombre_look || t('outfit:title'),
            explicacion: details.descripcion_ocasion || '', // fallback
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
        };
    };

    if (showUpsell) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-[70vh] animate-fade-in">
                <div className="bg-gray-50 p-6 rounded-full mb-6">
                    <Lock className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-serif font-medium text-gray-900 mb-3">{t('history:title')}</h2>
                <p className="text-gray-500 mb-8 text-center max-w-md font-light text-lg">{t('subscription:trial_limit_feature')}</p>
                <button
                    className="bg-black text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-gray-900 transition-all transform hover:-translate-y-1"
                    onClick={() => setShowUpsell(true)}
                >
                    {t('subscription:reactivate')}
                </button>
                <UpsellModal
                    isOpen={showUpsell}
                    onClose={() => window.location.href = '/app'}
                    featureName="history"
                    title={t('subscription:trial_limit_feature')}
                    description={t('subscription:trial_limit_wardrobe').replace('{{category}}', 'features')}
                />
            </div>
        )
    }

    return (
        <div className="pb-24 min-h-screen bg-[#f9f9f9]">
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#0a0a0a] tracking-tight">
                            {t('history:title')}
                        </h1>
                        <p className="text-[#4b5563] font-light">{t('history:subtitle')}</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative group">
                            <select
                                value={filterOccasion}
                                onChange={(e) => setFilterOccasion(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-full py-2.5 pl-5 pr-10 focus:ring-1 focus:ring-black focus:border-black cursor-pointer shadow-sm hover:border-gray-300 transition-all font-medium"
                            >
                                <option value="all">{t('history:filters.all_occasions')}</option>
                                <option value="Casual">{t('outfit:casual')}</option>
                                <option value="Smart Casual">{t('outfit:smart_casual')}</option>
                                <option value="Business Casual">{t('outfit:business_casual')}</option>
                                <option value="Formal">{t('outfit:formal')}</option>
                                <option value="Special">{t('outfit:special_event')}</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        <div className="relative group">
                            <select
                                value={filterOrigin}
                                onChange={(e) => setFilterOrigin(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-full py-2.5 pl-5 pr-10 focus:ring-1 focus:ring-black focus:border-black cursor-pointer shadow-sm hover:border-gray-300 transition-all font-medium"
                            >
                                <option value="all">{t('history:filters.all_origins')}</option>
                                <option value="diario">{t('history:filters.daily')}</option>
                                <option value="planificacion">{t('history:filters.weekly')}</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center p-24">
                        <Loader2 className="animate-spin h-10 w-10 text-gray-300" />
                    </div>
                ) : filteredOutfits.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-serif font-medium text-gray-900 mb-2">{t('history:empty')}</h3>
                        <p className="text-[#4b5563] font-light max-w-sm mx-auto">Empieza creando tus looks diarios o planifica tu semana para ver tu historial aquí.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOutfits.map((outfit) => (
                            <div
                                key={outfit.id}
                                onClick={() => setSelectedOutfit(outfit)}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300 border border-gray-100 cursor-pointer flex flex-col h-full"
                            >
                                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                    {/* Thumbnail */}
                                    {outfit.imagen_generada_url ? (
                                        <img src={outfit.imagen_generada_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Outfit" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
                                            <span className="font-serif text-4xl font-light text-gray-200 italic">Sartoria</span>
                                        </div>
                                    )}

                                    {/* Overlay Tags */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium font-serif backdrop-blur-md
                                            ${outfit.origen === 'diario' ? 'bg-white/90 text-gray-900 border border-gray-100' : 'bg-black/80 text-white border border-transparent'}`}>
                                            {outfit.origen === 'diario' ? t('history:daily_tag') : t('history:weekly_tag')}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => toggleFavorite(e, outfit.id, outfit.favorito)}
                                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all
                                            ${outfit.favorito ? 'bg-black/5 text-yellow-400 hover:bg-black/10' : 'bg-white/50 text-gray-400 hover:bg-white hover:text-gray-600'}`}
                                    >
                                        <Star className={`w-4 h-4 ${outfit.favorito ? 'fill-current' : ''}`} />
                                    </button>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-serif font-medium text-lg text-gray-900 leading-tight group-hover:text-[#d4af37] transition-colors">{new Date(outfit.fecha).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-widest">{outfit.ocasion}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <div className="flex -space-x-1">
                                            {outfit.color_palette?.slice(0, 3).map((c: string, i: number) => (
                                                <div key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-xs text-gray-400 font-light italic truncate pr-2 max-w-[80%]">"{outfit.nombre_look || 'Modern Ensemble'}"</span>
                                        <span className="text-xs font-medium text-black group-hover:translate-x-1 transition-transform">{t('history:view_details')} &rarr;</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedOutfit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setSelectedOutfit(null)}>
                    <div className="w-full max-w-lg bg-transparent max-h-[90vh] overflow-y-auto hide-scrollbar" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                            <button
                                onClick={() => setSelectedOutfit(null)}
                                className="absolute -top-12 right-0 z-10 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                            >
                                <span className="text-4xl font-light">&times;</span>
                            </button>
                            <OutfitCard
                                outfit={getOutfitForCard(selectedOutfit)}
                                allGarments={garments}
                                onSelect={() => setSelectedOutfit(null)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
