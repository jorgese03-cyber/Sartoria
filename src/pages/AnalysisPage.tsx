import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../hooks/useSubscription';
import UpsellModal from '../components/wardrobe/UpsellModal';
import { supabase } from '../lib/supabase';
import { Loader2, RefreshCw, Lock } from 'lucide-react';

interface AnalysisData {
    categoryDistribution: { category: string; count: number; percentage: number }[];
    topColors: { color: string; count: number }[];
    mostUsed: any[];
    leastUsed: any[];
    recommendations: { item: string; reason: string; price_range: string; priority: 'High' | 'Medium' | 'Low'; }[];
}

export default function AnalysisPage() {
    const { t } = useTranslation(['analysis', 'common', 'wardrobe', 'subscription']);
    const { canAccessFeature } = useSubscription();

    const [stats, setStats] = useState<AnalysisData | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);

    useEffect(() => {
        if (!canAccessFeature('analysis')) { setShowUpsell(true); }
        else { calculateLocalStats(); }
    }, [canAccessFeature]);

    const calculateLocalStats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: garments } = await supabase.from('garments').select('*').eq('user_id', user.id);
        if (!garments || garments.length === 0) return;

        const catCounts: Record<string, number> = {};
        garments.forEach(g => { catCounts[g.categoria] = (catCounts[g.categoria] || 0) + 1; });
        const total = garments.length;
        const categoryDistribution = Object.entries(catCounts).map(([category, count]) => ({
            category, count, percentage: Math.round((count / total) * 100)
        })).sort((a, b) => b.count - a.count);

        const colorCounts: Record<string, number> = {};
        garments.forEach(g => { if (g.color) colorCounts[g.color] = (colorCounts[g.color] || 0) + 1; });
        const topColors = Object.entries(colorCounts).map(([color, count]) => ({ color, count })).sort((a, b) => b.count - a.count).slice(0, 5);

        setStats(prev => ({ ...prev, categoryDistribution, topColors, mostUsed: [], leastUsed: [], recommendations: prev?.recommendations || [] } as AnalysisData));
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const { data, error } = await supabase.functions.invoke('analyze-wardrobe');
            if (error) throw error;
            if (data) { setStats(prev => ({ ...prev!, recommendations: data.recommendations || [] })); }
        } catch (err) {
            console.error(err);
            setStats(prev => ({
                ...prev!,
                recommendations: [
                    { item: "Camisa de lino blanca", reason: "Versátil para verano", price_range: "€40-€80", priority: "High" },
                    { item: "Chinos beige", reason: "Esencial casual", price_range: "€50-€100", priority: "Medium" }
                ]
            }));
        } finally { setAnalyzing(false); }
    };

    if (showUpsell) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[70vh] animate-fade-in">
                <Lock className="w-8 h-8 text-[#AAAAAA] mb-4" strokeWidth={1} />
                <h2 className="font-serif font-normal text-xl text-[#1A1A1A] mb-2">{t('analysis:title')}</h2>
                <p className="text-sm text-[#6B6B6B] mb-6 text-center">{t('subscription:trial_limit_feature')}</p>
                <button onClick={() => setShowUpsell(true)} className="btn-primary w-auto px-10" style={{ width: 'auto' }}>
                    {t('subscription:reactivate')}
                </button>
                <UpsellModal isOpen={showUpsell} onClose={() => window.location.href = '/app'} featureName="analysis"
                    title={t('subscription:trial_limit_feature')}
                    description={t('subscription:trial_limit_wardrobe').replace('{{category}}', 'features')} />
            </div>
        );
    }

    return (
        <div className="pb-24 min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {t('analysis:title', 'Análisis')}
                        </h1>
                        <p className="text-sm text-[#AAAAAA] font-light">{t('analysis:subtitle', 'Entiende tu armario')}</p>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="btn-ghost gap-2"
                    >
                        {analyzing ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" strokeWidth={1} />}
                        <span>{analyzing ? t('analysis:analyzing', 'Analizando...') : t('analysis:analyze_button', 'Analizar')}</span>
                    </button>
                </header>

                {!stats ? (
                    <div className="text-center py-24 border border-dashed border-[#E5E0DB]">
                        <h3 className="font-serif font-normal text-lg text-[#1A1A1A] mb-2">{t('analysis:empty', 'Sin datos')}</h3>
                        <p className="text-sm text-[#6B6B6B] font-light mb-8">{t('analysis:run_analysis_hint', 'Añade prendas para analizar')}</p>
                        <button onClick={handleAnalyze} className="btn-primary w-auto px-10" style={{ width: 'auto' }}>
                            {t('analysis:analyze_button', 'Analizar')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Category Distribution */}
                            <div>
                                <h3 className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-6">{t('analysis:composition', 'Composición')}</h3>
                                <div className="space-y-5">
                                    {stats.categoryDistribution.slice(0, 6).map((item, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-[#1A1A1A] capitalize">{item.category}</span>
                                                <span className="text-[#6B6B6B]">{item.count} · {item.percentage}%</span>
                                            </div>
                                            <div className="w-full bg-[#F5F0EB] h-px overflow-hidden">
                                                <div className="bg-[#1A1A1A] h-full transition-all duration-1000" style={{ width: `${item.percentage}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Colors */}
                            <div>
                                <h3 className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-6">{t('analysis:palette', 'Paleta')}</h3>
                                <div className="flex flex-wrap gap-6">
                                    {stats.topColors.map((item, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-2">
                                            <div className="w-14 h-14 border border-[#E5E0DB]" style={{ backgroundColor: item.color }} />
                                            <span className="text-[10px] tracking-[0.1em] uppercase text-[#AAAAAA]">{item.color}</span>
                                            <span className="text-[11px] text-[#6B6B6B]">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                                {stats.topColors[0] && (
                                    <p className="text-sm text-[#6B6B6B] font-light italic mt-6 border-t border-[#E5E0DB] pt-4">
                                        {t('analysis:palette_insight', { color: stats.topColors[0]?.color ?? '...' })}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="border-t border-[#E5E0DB] pt-10">
                            <h3 className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-6">{t('analysis:recommendations', 'Recomendaciones')}</h3>

                            {stats.recommendations.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {stats.recommendations.map((rec, idx) => (
                                        <div key={idx} className="border border-[#E5E0DB] p-6 hover:border-[#1A1A1A] transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-serif font-normal text-lg text-[#1A1A1A]">{rec.item}</h4>
                                                <span className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 border
                                                    ${rec.priority === 'High' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' :
                                                        rec.priority === 'Medium' ? 'text-[#6B6B6B] border-[#E5E0DB]' :
                                                            'text-[#AAAAAA] border-[#E5E0DB]'}`}>
                                                    {rec.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#6B6B6B] font-light mb-4">{rec.reason}</p>
                                            <div className="flex justify-between items-center pt-4 border-t border-[#E5E0DB]">
                                                <span className="text-sm text-[#1A1A1A]">{rec.price_range}</span>
                                                <button className="text-[12px] tracking-[0.1em] uppercase text-[#1A1A1A] border-b border-[#1A1A1A] hover:opacity-70 transition-opacity">
                                                    {t('analysis:find_similar', 'Buscar')} →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[#6B6B6B] text-center py-8">{t('analysis:no_recommendations', 'Sin recomendaciones')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
