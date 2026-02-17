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
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white shadow-sm pt-4 pb-2 sticky top-16 z-30">
                <div className="px-4 flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{t('title', 'Mi Armario')}</h1>
                    <div className="text-sm text-gray-500">
                        {garments.length} {t('items', 'prendas')}
                    </div>
                </div>

                {/* Categories Tabs - Grid Layout */}
                <div className="px-4 pb-2">
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => {
                            const count = getCountByCategory(cat);
                            const limit = getMaxItemsPerCategory();

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={clsx(
                                        "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-2 border w-[calc(33.333%-0.5rem)] sm:w-[calc(20%-0.6rem)] lg:w-[calc(16.666%-0.6rem)]",
                                        selectedCategory === cat
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                                    )}
                                >
                                    <span className="truncate">{cat}</span>
                                    <span className={clsx("text-xs px-1.5 py-0.5 rounded-full ml-auto",
                                        selectedCategory === cat ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"
                                    )}>
                                        {count}{isTrial && cat !== 'Todos' ? `/${limit}` : ''}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredGarments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">{t('no_items', 'No hay prendas en esta categoría.')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {filteredGarments.map(garment => (
                            <GarmentCard
                                key={garment.id}
                                garment={garment}
                                onEdit={() => { }} // TODO: Implement edit
                                onDelete={async (id) => {
                                    if (confirm(t('confirm_delete', '¿Seguro que quieres eliminar esta prenda?'))) {
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
                className="fixed bottom-24 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 z-40"
                aria-label="Add garment"
            >
                <Plus size={24} />
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
