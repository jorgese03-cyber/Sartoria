import { Trash2, Edit2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface Garment {
    id: string
    codigo: string
    categoria: string
    marca: string
    talla: string
    color: string
    descripcion: string
    estilo: string
    temporada: string
    foto_url: string
    activa: boolean
}

interface GarmentCardProps {
    garment: Garment
    onEdit: (garment: Garment) => void
    onDelete: (id: string) => void
}

export default function GarmentCard({ garment, onEdit, onDelete }: GarmentCardProps) {
    const { t } = useTranslation('wardrobe');

    return (
        <div className="group relative bg-white rounded-xl overflow-hidden shadow-none hover:shadow-premium transition-all duration-300">
            <div className="aspect-[4/5] bg-[#F9F9F9] relative overflow-hidden">
                <img
                    src={garment.foto_url}
                    alt={garment.descripcion}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {!garment.activa && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full tracking-wide">
                            {t('inactive', 'Retirada')}
                        </span>
                    </div>
                )}

                {/* Actions overlay */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 transform translate-x-2 group-hover:translate-x-0 duration-300">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(garment); }}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-black hover:text-white text-gray-700 transition-colors"
                        title={t('actions.edit')}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(garment.id); }}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-red-600 hover:text-white text-gray-700 transition-colors"
                        title={t('actions.delete')}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Color indicator */}
                <div className="absolute bottom-3 left-3">
                    <div className="w-5 h-5 rounded-full border border-white/50 shadow-sm"
                        style={{ backgroundColor: garment.color.toLowerCase() === 'blanco' ? '#ffffff' : garment.color }}
                        title={garment.color}
                    />
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate tracking-wide" title={garment.marca}>
                            {garment.marca === 'NO VISIBLE' || !garment.marca ? '—' : garment.marca.toUpperCase()}
                        </h3>
                        <p className="text-xs text-gray-600 truncate mt-1 font-light">
                            {garment.descripcion}
                        </p>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider border border-gray-100 px-1.5 py-0.5 rounded">
                        {garment.talla}
                    </span>
                </div>
            </div>
        </div>
    )
}
