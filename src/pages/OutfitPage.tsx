import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { WeatherBanner } from '../components/common/WeatherBanner';
import { OutfitCard } from '../components/outfit/OutfitCard';
import { OccasionSelector } from '../components/outfit/OccasionSelector';
import { useAuth } from '../context/AuthContext';

// Types
interface WeatherData {
    temp: number;
    condition: string;
    description: string;
    city: string;
}

interface Garment {
    id: string;
    categoria: string;
    color: string;
    descripcion: string;
    estilo: string;
    foto_url: string;
    marca?: string;
}

export default function OutfitPage() {
    const { t } = useTranslation('outfit');
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [garments, setGarments] = useState<Garment[]>([]);
    const [occasion, setOccasion] = useState('Casual');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [outfits, setOutfits] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Load garments on mount
    useEffect(() => {
        if (!user) return;

        const fetchGarments = async () => {
            const { data, error } = await supabase
                .from('garments')
                .select('*')
                .eq('user_id', user.id)
                .eq('activa', true);

            if (error) console.error('Error fetching garments:', error);
            else setGarments(data || []);
        };

        fetchGarments();
    }, [user]);

    const handleGenerateValues = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        setOutfits([]);

        try {
            const { data, error } = await supabase.functions.invoke('generate-outfit', {
                body: {
                    user_id: user.id,
                    occasion,
                    style_preference: 'Adaptado a la ocasión'
                }
            });

            if (error) throw error;

            if (data.error) {
                throw new Error(data.error);
            }

            setWeather(data.weather);
            setOutfits(data.outfits);
        } catch (err: any) {
            console.error('Generation Validation Error:', err);
            setError(err.message || 'Failed to generate outfit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOutfit = async (outfit: any) => {
        // Save selection logic here
        if (!user) return;

        try {
            const { error } = await supabase.from('outfits').insert({
                user_id: user.id,
                fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                ocasion: occasion,
                prenda_superior_id: outfit.prendas.prenda_superior_id,
                prenda_inferior_id: outfit.prendas.prenda_inferior_id,
                prenda_calzado_id: outfit.prendas.prenda_calzado_id,
                prenda_cinturon_id: outfit.prendas.prenda_cinturon_id,
                prenda_capa_exterior_id: outfit.prendas.prenda_capa_exterior_id,
                prenda_calcetines_id: outfit.prendas.prenda_calcetines_id,
                temperatura: weather?.temp,
                condicion_clima: weather?.condition,
                elegido: true,
                origen: 'diario',
                style_notes: outfit.style_notes,
                color_palette: outfit.color_palette,
                imagen_prompt: outfit.imagen_prompt
            });

            if (error) throw error;
            alert(t('success'));
        } catch (err) {
            console.error("Error saving outfit:", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9] pb-24">
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 animate-fade-in">
                {/* Header */}
                <header className="flex flex-col gap-3 text-center sm:text-left">
                    <h1 className="text-4xl font-serif font-medium text-gray-900 tracking-tight">
                        {t('title').split(' ').map((word, i, arr) =>
                            i === arr.length - 1 ? <span key={i} className="italic text-[#d4af37]">{word}</span> : word + ' '
                        )}
                    </h1>
                    <p className="text-gray-700 font-light text-lg max-w-2xl">
                        {t('landing.hero_subtitle', "SARTORIA analiza tu armario, el clima y tu agenda para vestirte impecable cada día.")}
                    </p>
                </header>

                {/* Weather Section */}
                <WeatherBanner weather={weather} loading={loading && !weather} />

                {/* Controls */}
                <div className="bg-white p-8 rounded-3xl shadow-premium border border-gray-50 space-y-8">
                    <OccasionSelector value={occasion} onChange={setOccasion} loading={loading} />

                    <div className="pt-4">
                        <button
                            onClick={handleGenerateValues}
                            disabled={loading || garments.length < 3}
                            className={`
                                w-full py-5 rounded-full font-serif text-xl tracking-wide transition-all transform active:scale-[0.99]
                                flex items-center justify-center gap-3 relative overflow-hidden shadow-lg
                                ${loading || garments.length < 3
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-900 hover:shadow-2xl'
                                }
                            `}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{t('common.loading')}</span>
                                </span>
                            ) : (
                                <>
                                    <span>{t('generate_button')}</span>
                                    {/* <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" /> Removed dot for cleaner look or keep it? User wants visibility. */}
                                </>
                            )}
                        </button>
                        {garments.length < 3 && (
                            <p className="text-center text-red-600 text-base mt-4 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                                {t('add_garments_warning')}
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                            <span className="text-xl">⚠️</span> {error}
                        </div>
                    )}
                </div>

                {/* Results */}
                {outfits.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-serif text-gray-900">Your Recommendations</h2>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 animate-fade-in-up">
                            {outfits.map((outfit, index) => (
                                <div key={index} className="h-full">
                                    <OutfitCard
                                        outfit={outfit}
                                        allGarments={garments}
                                        onSelect={() => handleSelectOutfit(outfit)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
