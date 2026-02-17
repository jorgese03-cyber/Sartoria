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
            <div className="p-4 flex flex-col items-center justify-center h-[50vh]">
                <Lock className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('history:title')}</h2>
                <p className="text-gray-500 mb-6 text-center">{t('subscription:trial_limit_feature')}</p>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium" onClick={() => setShowUpsell(true)}>
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
        <div className="pb-24 px-4 pt-4 max-w-4xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t('history:title')}</h1>
            </header>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                <select
                    value={filterOccasion}
                    onChange={(e) => setFilterOccasion(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                >
                    <option value="all">All Occasions</option>
                    <option value="Casual">Casual</option>
                    <option value="Smart Casual">Smart Casual</option>
                    <option value="Business Casual">Business Casual</option>
                    <option value="Formal">Formal</option>
                    <option value="Special">Special</option>
                </select>

                <select
                    value={filterOrigin}
                    onChange={(e) => setFilterOrigin(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                >
                    <option value="all">All Origins</option>
                    <option value="diario">Daily Outfit</option>
                    <option value="planificacion">Weekly Plan</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin h-8 w-8 text-gray-300" />
                </div>
            ) : filteredOutfits.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">{t('history:empty')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOutfits.map((outfit) => (
                        <div
                            key={outfit.id}
                            onClick={() => setSelectedOutfit(outfit)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-gray-200 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {/* Thumbnail: use generated image if available, else first garment */}
                                    {outfit.imagen_generada_url ? (
                                        <img src={outfit.imagen_generada_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-center p-1 text-gray-400">
                                            {outfit.fecha}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900">{new Date(outfit.fecha).toLocaleDateString()}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium 
                                            ${outfit.origen === 'diario' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                            {outfit.origen === 'diario' ? 'Daily' : 'Plan'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-1">{outfit.ocasion}</div>
                                    <div className="flex gap-1">
                                        {/* Mini palette */}
                                        {outfit.color_palette?.slice(0, 3).map((c: string, i: number) => (
                                            <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={(e) => toggleFavorite(e, outfit.id, outfit.favorito)}
                                className={`p-2 rounded-full hover:bg-gray-50 ${outfit.favorito ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                                <Star className="w-5 h-5 fill-current" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedOutfit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOutfit(null)}>
                    <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="bg-white relative">
                            <button
                                onClick={() => setSelectedOutfit(null)}
                                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full"
                            >
                                &times;
                            </button>
                            <OutfitCard
                                outfit={getOutfitForCard(selectedOutfit)}
                                allGarments={garments}
                                onSelect={() => setSelectedOutfit(null)} // Close on action
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
