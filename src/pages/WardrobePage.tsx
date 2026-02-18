import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import GarmentCard, { type Garment } from '../components/wardrobe/GarmentCard';
import AddGarmentModal from '../components/wardrobe/AddGarmentModal';
import UpsellModal from '../components/wardrobe/UpsellModal';

const CATEGORIES = ['Todos', 'Camisa', 'Polo', 'Camiseta', 'Pantalón', 'Jersey', 'Sudadera', 'Abrigo/Chaqueta', 'Cinturón', 'Calcetines', 'Zapatos', 'Zapatillas', 'Accesorio'];

export default function WardrobePage() {
    const { t } = useTranslation(['wardrobe', 'common']);
    const { user } = useAuth();
    const { isTrial, getMaxItemsPerCategory } = useSubscription();

    const [garments, setGarments] = useState<Garment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
    const [upsellCategory, setUpsellCategory] = useState('');

    useEffect(() => { if (user) fetchGarments(); }, [user]);

    const fetchGarments = async () => {
        try {
            const { data, error } = await supabase.from('garments').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setGarments(data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleAddClick = () => {
        if (selectedCategory !== 'Todos') {
            const count = garments.filter(g => g.categoria === selectedCategory && g.activa).length;
            const limit = getMaxItemsPerCategory();
            if (count >= limit) {
                setUpsellCategory(selectedCategory);
                setIsUpsellModalOpen(true);
                return;
            }
        }
        setIsAddModalOpen(true);
    };

    const filteredGarments = selectedCategory === 'Todos'
        ? garments
        : garments.filter(g => g.categoria === selectedCategory);

    const getCountByCategory = (cat: string) => garments.filter(g => g.categoria === cat && g.activa).length;

    return (
        <div className="pb-24 bg-white min-h-screen">
            {/* Header */}
            <div className="sticky top-0 md:top-16 z-30 bg-white border-b border-[#E5E0DB]">
                <div className="px-6 py-6 max-w-7xl mx-auto">
                    <h1
                        className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-1"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                        {t('title', 'Armario')}
                    </h1>
                    <p className="text-sm text-[#AAAAAA] font-light">{garments.length} prendas</p>
                </div>

                {/* Category Tabs */}
                <div className="px-6 pb-4 max-w-7xl mx-auto">
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {CATEGORIES.map(cat => {
                            const count = getCountByCategory(cat);
                            const limit = getMaxItemsPerCategory();
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`text-[11px] tracking-[0.1em] uppercase pb-1 transition-all border-b
                                        ${isSelected
                                            ? 'text-[#1A1A1A] border-[#1A1A1A]'
                                            : 'text-[#AAAAAA] border-transparent hover:text-[#6B6B6B]'
                                        }`}
                                >
                                    {cat}
                                    {isSelected && cat !== 'Todos' && isTrial && (
                                        <span className="ml-1 text-[#8B7355]">{count}/{limit}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border border-[#E5E0DB] border-t-[#1A1A1A] rounded-full animate-spin" />
                    </div>
                ) : filteredGarments.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-[#E5E0DB]">
                        <p className="text-[#6B6B6B] font-light text-sm">{t('no_items', 'No hay prendas en esta categoría.')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {filteredGarments.map(garment => (
                            <GarmentCard
                                key={garment.id}
                                garment={garment}
                                onEdit={() => { }}
                                onDelete={async (id) => {
                                    if (confirm(t('confirm_delete', '¿Estás seguro de que quieres eliminar esta prenda?'))) {
                                        await supabase.from('garments').delete().eq('id', id);
                                        fetchGarments();
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* FAB */}
            <button
                onClick={handleAddClick}
                className="fixed bottom-[80px] right-[24px] bg-[#1A1A1A] text-white w-[48px] h-[48px] rounded-full flex items-center justify-center hover:bg-black transition-colors z-40 shadow-lg"
                aria-label="Añadir prenda"
            >
                <Plus size={20} strokeWidth={1} />
            </button>

            <AddGarmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchGarments} />
            <UpsellModal isOpen={isUpsellModalOpen} onClose={() => setIsUpsellModalOpen(false)} featureName={upsellCategory} />


        </div>
    );
}
