import React from 'react';
import { useTranslation } from 'react-i18next';

// Define types locally for now, should move to centralized types later
interface Garment {
    id: string;
    categoria: string;
    color: string;
    descripcion: string; // This might be used for 'name' if no explicit name
    estilo: string;
    foto_url?: string; // We need to handle retrieving this, maybe the edge function should return it?
    // The edge function currently returns 'prendas' with IDs.
    // We need to map IDs to garment objects in the parent or fetch them.
    // IMPORTANT: The Edge Function generate-outfit only returns IDs in the `prendas` object.
    // The frontend needs to have the full garment list to render the card, 
    // OR the edge function should return full objects.
    // Plan: The edge function has the garments, it should probably return the details 
    // or at least the frontend should match IDs with the `garments` state it already has.
}

interface OutfitRecommendation {
    nombre_look: string;
    explicacion: string;
    prendas: {
        [key: string]: string | null; // garment_ids
    };
    style_notes: string;
    color_palette: string[];
}

interface OutfitCardProps {
    outfit: OutfitRecommendation;
    allGarments: Garment[]; // Pass all garments to lookup details
    onSelect: () => void;
    loadingImage?: boolean; // For when we implement image generation
}

export const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, allGarments, onSelect }) => {
    const { t } = useTranslation('outfit');

    // Helper to get garment details
    const getGarment = (id: string | null) => allGarments.find(g => g.id === id);

    // Map the flexible 'prendas' object to a list we can render
    const outfitGarments = Object.entries(outfit.prendas)
        .filter(([_, id]) => id !== null)
        .map(([key, id]) => ({ role: key, ...getGarment(id!) }))
        .filter(g => g.id); // Filter out if not found (shouldn't happen if sync)

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                <h3 className="text-xl font-bold font-serif">{outfit.nombre_look}</h3>
                <div className="flex gap-2 mt-2">
                    {outfit.color_palette?.map((color, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col gap-4">

                {/* Explanation */}
                <div className="text-sm text-gray-600 italic">
                    "{outfit.explicacion}"
                </div>

                {/* Garments Grid */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                    {outfitGarments.map((g, idx) => (
                        <div key={idx} className="aspect-square bg-gray-50 rounded-lg overflow-hidden relative group border border-gray-100">
                            {g.foto_url ? (
                                <img src={g.foto_url} alt={g.descripcion} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-center p-1 text-gray-400">
                                    {g.categoria}
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                {g.descripcion}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Style Notes */}
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm">
                    <span className="font-semibold text-amber-800">{t('color_harmony')}</span>
                    <span className="text-amber-900 ml-1">{outfit.style_notes}</span>
                </div>

                {/* "Why it works" - using explicacion again or if separate field exists */}
                {/* <div className="text-sm">
             <span className="font-semibold text-gray-900">{t('why_it_works')}</span>
             <p className="text-gray-600 mt-1">{outfit.explicacion}</p>
        </div> */}

                <div className="mt-auto pt-4">
                    <button
                        onClick={onSelect}
                        className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {t('choose_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};
