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
        <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-serif font-bold text-gray-900">Outfit of the Day</h1>
                <p className="text-gray-500">Let AI style you for today.</p>
            </header>

            {/* Weather Section */}
            <WeatherBanner weather={weather} loading={loading && !weather} />

            {/* Controls */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <OccasionSelector value={occasion} onChange={setOccasion} loading={loading} />

                <button
                    onClick={handleGenerateValues}
                    disabled={loading || garments.length < 3}
                    className={`
            w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95
            ${loading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-200'
                        }
          `}
                >
                    {loading ? 'Thinking...' : t('generate_button')}
                </button>

                {garments.length < 3 && (
                    <p className="text-center text-red-500 text-sm">
                        Need at least 3 garments to generate an outfit.
                    </p>
                )}

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {outfits.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up">
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
            )}
        </div>
    );
}
