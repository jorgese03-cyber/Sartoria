import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import GarmentCard, { type Garment } from '../components/wardrobe/GarmentCard';
import AddGarmentModal from '../components/wardrobe/AddGarmentModal';
import UpsellModal from '../components/wardrobe/UpsellModal';
import clsx from 'clsx';

const CATEGORIES = ['Todos', 'Camisa', 'Polo', 'Camiseta', 'Pantalón', 'Jersey', 'Sudadera', 'Abrigo/Chaqueta', 'Cinturón', 'Calcetines', 'Zapatos', 'Zapatillas', 'Accesorio'];

export default function WardrobePage() {
    const { t } = useTranslation(['wardrobe', 'common']);
    const { user } = useAuth();
    const { isTrial, getMaxItemsPerCategory } = useSubscription();

    const [garments, setGarments] = useState<Garment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
    const [upsellCategory, setUpsellCategory] = useState('');

    useEffect(() => {
        if (user) {
            fetchGarments();
        }
    }, [user]);

    const fetchGarments = async () => {
        try {
            const { data, error } = await supabase
                .from('garments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGarments(data || []);
        } catch (error) {
            console.error('Error fetching wardrobe:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        // If "Todos" is selected, user must choose category in modal, 
        // so we can't check limit strictly yet unless we force category selection first.
        // However, the PRD says "Trial: contador X/5 por categoría, modal de upsell al intentar añadir la 6ª prenda".
        // If we are in "Todos", let them open modal. Inside modal, if they pick a category that is full? 
        // Or better: The PRD says "Botón flotante '+' para añadir prenda".
        // The modal has a category selector.

        // Strategy: Allow opening modal. WHEN saving, check limit? 
        // OR: If they are in a specific category tab (e.g. Camisas) and it's full -> Block opening.
        // If in "Todos", open modal. But checking limit on save is better UX or check on category select?
        // Checking on save implies backend trigger or logic in Modal.
        // Let's implement logic: 
        // If specific category selected != 'Todos': check count. If full -> Upsell.
        // If 'Todos': Open modal. Inside modal we might need to handle it or just let it slide for MVP?
        // PRD: "Cuando el usuario ... intenta añadir la 6ª prenda de una categoría ... se muestra un modal de upsell".
        // The "intenta añadir" could be interpreted as "Clicks Add when in category view" or "Clicks Save".
        // Given 3 sec rule, blocking upfront is better if context is known.

        if (selectedCategory !== 'Todos') {
            const count = garments.filter(g => g.categoria === selectedCategory && g.activa).length;
            const limit = getMaxItemsPerCategory();

            if (count >= limit) {
                setUpsellCategory(selectedCategory);
                setIsUpsellModalOpen(true);
                return;
            }
        }

        // Pass the category to the modal if specific one selected?
        // For now just open modal
        setIsAddModalOpen(true);
    };

    const filteredGarments = selectedCategory === 'Todos'
        ? garments
        : garments.filter(g => g.categoria === selectedCategory);

    // Group counts for trial
    const getCountByCategory = (cat: string) => garments.filter(g => g.categoria === cat && g.activa).length;

    return (
        <div className="pb-24 bg-[#F9F9F9] min-h-screen">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 md:top-16 z-30 border-b border-gray-100">
                <div className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-3xl font-serif font-medium text-gray-900">{t('title')}</h1>
                        <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest font-medium">
                            {garments.length} {t('items', 'prendas')}
                        </p>
                    </div>
                </div>

                {/* Categories Tabs - Scrollable Row */}
                <div className="px-6 pb-4 max-w-7xl mx-auto">
                    <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-2">
                        {CATEGORIES.map(cat => {
                            const count = getCountByCategory(cat);
                            const limit = getMaxItemsPerCategory();
                            const isSelected = selectedCategory === cat;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={clsx(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
                                        isSelected
                                            ? "bg-black text-white shadow-md"
                                            : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400 hover:text-gray-900"
                                    )}
                                >
                                    <span>{cat}</span>
                                    {isSelected && (
                                        <span className="text-[10px] bg-white/20 px-1.5 rounded-full">
                                            {count}{isTrial && cat !== 'Todos' ? `/${limit}` : ''}
                                        </span>
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
                        <div className="w-10 h-10 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                    </div>
                ) : filteredGarments.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                        <p className="text-gray-600 font-light text-lg">{t('no_items', 'No hay prendas en esta categoría.')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {filteredGarments.map(garment => (
                            <GarmentCard
                                key={garment.id}
                                garment={garment}
                                onEdit={() => { }} // TODO: Implement edit
                                onDelete={async (id) => {
                                    if (confirm(t('confirm_delete', 'Are you sure you want to delete this item?'))) {
                                        await supabase.from('garments').delete().eq('id', id);
                                        fetchGarments();
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleAddClick}
                className="fixed bottom-24 right-6 bg-black text-white p-5 rounded-full shadow-2xl hover:scale-105 hover:bg-gray-900 transition-all z-40 group"
                aria-label="Add garment"
            >
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Modals */}
            <AddGarmentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchGarments}
            />

            <UpsellModal
                isOpen={isUpsellModalOpen}
                onClose={() => setIsUpsellModalOpen(false)}
                featureName={upsellCategory}
            />

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
