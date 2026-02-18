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
        <div className="bg-white rounded-2xl shadow-premium overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
            {/* Header - Minimalist */}
            <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-serif font-medium text-gray-900 leading-tight">{outfit.nombre_look}</h3>
                    <div className="flex -space-x-2">
                        {outfit.color_palette?.map((color, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                        ))}
                    </div>
                </div>
                <p className="text-sm text-gray-500 font-light italic border-l-2 border-[#d4af37] pl-3 py-1">
                    "{outfit.explicacion}"
                </p>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 flex-1 flex flex-col gap-6">

                {/* Garments Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {outfitGarments.map((g, idx) => (
                        <div key={idx} className={`aspect-square bg-[#F9F9F9] rounded-xl overflow-hidden relative group border border-gray-50 ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}>
                            {g.foto_url ? (
                                <img src={g.foto_url} alt={g.descripcion} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-gray-400 gap-2">
                                    <span className="text-xs uppercase tracking-widest opacity-50">{g.categoria}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-white text-xs font-medium truncate w-full">{g.descripcion}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Style Notes */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                        {t('color_harmony', 'Style Notes')}
                    </h4>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                        {outfit.style_notes}
                    </p>
                </div>

                <div className="mt-auto pt-2">
                    <button
                        onClick={onSelect}
                        className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-full font-medium text-sm tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        {t('choose_button', 'Select Outfit')}
                    </button>
                </div>
            </div>
        </div>
    );
};
