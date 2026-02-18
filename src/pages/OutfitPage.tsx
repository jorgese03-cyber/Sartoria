import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { WeatherBanner } from '../components/common/WeatherBanner';
import { OutfitCard } from '../components/outfit/OutfitCard';
import { OccasionSelector } from '../components/outfit/OccasionSelector';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface WeatherData { temp: number; condition: string; description: string; city: string; }
interface Garment { id: string; categoria: string; color: string; descripcion: string; estilo: string; foto_url: string; marca?: string; }

export default function OutfitPage() {
    const { t } = useTranslation('outfit');
    const { user } = useAuth();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(false);
    const [garments, setGarments] = useState<Garment[]>([]);
    const [occasion, setOccasion] = useState('Casual');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [outfits, setOutfits] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchGarments = async () => {
            const { data, error } = await supabase.from('garments').select('*').eq('user_id', user.id).eq('activa', true);
            if (error) console.error(error);
            else setGarments(data || []);
        };

        const fetchUserName = async () => {
            const name = user.user_metadata?.full_name || '';
            if (name) { setUserName(name.split(' ')[0]); }
            else {
                const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
            }
        };

        fetchGarments();
        fetchUserName();
    }, [user]);

    const handleGenerate = async () => {
        if (!user) return;
        setLoading(true); setError(null); setOutfits([]);
        try {
            const { data, error } = await supabase.functions.invoke('generate-outfit', {
                body: { user_id: user.id, occasion, style_preference: 'Adaptado a la ocasión' }
            });
            if (error) throw error;
            if (data.error) throw new Error(data.error);
            setWeather(data.weather);
            setOutfits(data.outfits);
        } catch (err: any) {
            setError(err.message || 'Error al generar atuendo.');
        } finally { setLoading(false); }
    };

    const handleSelectOutfit = async (outfit: any) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('outfits').insert({
                user_id: user.id,
                fecha: new Date().toISOString().split('T')[0],
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
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
                {/* Header */}
                <header className="space-y-1">
                    <h1
                        className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-2"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                        {t('title', 'Atuendo del día')}
                    </h1>
                    <p className="font-serif font-normal text-2xl text-[#1A1A1A] italic">
                        {userName ? `Hola, ${userName}` : 'Deja que la IA elija por ti'}
                    </p>
                </header>

                {/* Weather — inline text */}
                <WeatherBanner weather={weather} loading={loading && !weather} />

                {/* Occasion Selector */}
                <OccasionSelector value={occasion} onChange={setOccasion} loading={loading} />

                {/* Generate Button */}
                <div>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || garments.length < 3}
                        className="btn-primary"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                            t('generate_button', 'Generar atuendo')
                        )}
                    </button>

                    {garments.length < 3 && (
                        <p className="text-center text-sm text-[#6B6B6B] mt-4">
                            {t('add_garments_warning', 'Añade al menos 3 prendas para empezar')}
                        </p>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <p className="text-[#C41E3A] text-sm text-center">{error}</p>
                )}

                {/* Results */}
                {outfits.length > 0 && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <h2
                                className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B]"
                                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                            >
                                Tus recomendaciones
                            </h2>
                            <div className="h-px bg-[#E5E0DB] flex-1" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
                            {outfits.map((outfit, index) => (
                                <div key={index}>
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
