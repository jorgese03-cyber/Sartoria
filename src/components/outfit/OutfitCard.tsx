import React from 'react';
import { useTranslation } from 'react-i18next';

interface Garment { id: string; categoria: string; color: string; descripcion: string; estilo: string; foto_url?: string; }
interface OutfitRecommendation { nombre_look: string; explicacion: string; prendas: { [key: string]: string | null; }; style_notes: string; color_palette: string[]; }
interface OutfitCardProps { outfit: OutfitRecommendation; allGarments: Garment[]; onSelect: () => void; loadingImage?: boolean; }

export const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, allGarments, onSelect }) => {
    const { t } = useTranslation('outfit');
    const getGarment = (id: string | null) => allGarments.find(g => g.id === id);

    const outfitGarments = Object.entries(outfit.prendas)
        .filter(([_, id]) => id !== null)
        .map(([key, id]) => ({ role: key, ...getGarment(id!) }))
        .filter(g => g.id);

    return (
        <div className="flex flex-col h-full">
            {/* Look name */}
            <h3 className="font-serif font-normal text-xl text-[#1A1A1A] mb-2">{outfit.nombre_look}</h3>
            <p className="text-sm text-[#6B6B6B] font-light italic mb-6">"{outfit.explicacion}"</p>

            {/* Color palette */}
            {outfit.color_palette?.length > 0 && (
                <div className="flex gap-2 mb-6">
                    {outfit.color_palette.map((color, i) => (
                        <div key={i} className="w-4 h-4" style={{ backgroundColor: color }} />
                    ))}
                </div>
            )}

            {/* Garments grid */}
            <div className="grid grid-cols-2 gap-2 mb-6">
                {outfitGarments.map((g, idx) => (
                    <div
                        key={idx}
                        className={`aspect-square bg-[#F5F0EB] overflow-hidden relative group ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}
                    >
                        {g.foto_url ? (
                            <img src={g.foto_url} alt={g.descripcion} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-[10px] tracking-[0.1em] uppercase text-[#AAAAAA]">{g.categoria}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Style notes */}
            <div className="mb-6">
                <h4 className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
                    {t('color_harmony', 'Notas de estilo')}
                </h4>
                <p className="text-sm text-[#1A1A1A] font-light leading-relaxed">{outfit.style_notes}</p>
            </div>

            {/* Select button */}
            <div className="mt-auto">
                <button onClick={onSelect} className="btn-primary">
                    {t('choose_button', 'Elegir atuendo')}
                </button>
            </div>
        </div>
    );
};
