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
        <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img
                    src={garment.foto_url}
                    alt={garment.descripcion}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {!garment.activa && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
                            {t('inactive', 'Retirada')}
                        </span>
                    </div>
                )}

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(garment); }}
                        className="p-1.5 bg-white rounded-full shadow-sm hover:bg-indigo-50 text-gray-600 hover:text-indigo-600"
                        title={t('actions.edit')}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(garment.id); }}
                        className="p-1.5 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-600 hover:text-red-600"
                        title={t('actions.delete')}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="absolute bottom-2 left-2">
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm border border-gray-100">
                        <div
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: garment.color.toLowerCase() === 'blanco' ? '#ffffff' : garment.color }}
                            title={garment.color}
                        />
                        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-tight">
                            {garment.codigo}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 truncate" title={garment.marca}>
                    {garment.marca === 'NO VISIBLE' || !garment.marca ? '—' : garment.marca}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                    {garment.descripcion}
                </p>
            </div>
        </div>
    )
}
