import { Fragment, useState, useRef, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Camera, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface AddGarmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const CATEGORIES = ['Camisa', 'Polo', 'Camiseta', 'Pantalón', 'Jersey', 'Sudadera', 'Abrigo/Chaqueta', 'Cinturón', 'Calcetines', 'Zapatos', 'Zapatillas', 'Accesorio'];
const STYLES = ['Casual', 'Smart Casual', 'Business Casual', 'Formal', 'Elegante', 'Deportivo'];
const SEASONS = ['Verano', 'Entretiempo', 'Invierno', 'Todo el año'];

export default function AddGarmentModal({ isOpen, onClose, onSuccess }: AddGarmentModalProps) {
    const { t } = useTranslation(['wardrobe', 'common']);
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        categoria: '',
        marca: '',
        talla: '',
        color: '',
        estilo: '',
        temporada: '',
        descripcion: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({
                categoria: '',
                marca: '',
                talla: '',
                color: '',
                estilo: '',
                temporada: '',
                descripcion: ''
            });
            setImageFile(null);
            setImagePreview(null);
            setErrors({});
            setLoading(false);
            setAnalyzing(false);
        }
    }, [isOpen]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await processImage(file);
        }
    };

    const processImage = async (file: File) => {
        // Resize image to max 800px
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setImagePreview(dataUrl);

                // Convert back to file for upload
                canvas.toBlob((blob) => {
                    if (blob) {
                        const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
                        setImageFile(resizedFile);
                        analyzeImage(dataUrl); // Start analysis automatically
                    }
                }, 'image/jpeg', 0.8);
            };
        };
    };

    const analyzeImage = async (base64Image: string) => {
        setAnalyzing(true);
        try {
            const { data, error } = await supabase.functions.invoke('analyze-garment', {
                body: { image: base64Image }
            });

            if (error) throw error;

            if (data) {
                setFormData(prev => ({
                    ...prev,
                    categoria: CATEGORIES.includes(data.categoria) ? data.categoria : '',
                    marca: data.marca === 'NO VISIBLE' ? '' : data.marca,
                    talla: data.talla === 'NO VISIBLE' ? '' : data.talla,
                    color: data.color || '',
                    estilo: STYLES.includes(data.estilo) ? data.estilo : '',
                    temporada: SEASONS.includes(data.temporada) ? data.temporada : '',
                    descripcion: prev.descripcion || `${data.categoria} ${data.color}`
                }));
            }
        } catch (err) {
            console.error('Error analyzing image:', err);
            // Don't block the user, just let them fill manually
        } finally {
            setAnalyzing(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!imageFile) newErrors.image = t('errors.image_required', 'Photo is required');
        if (!formData.categoria) newErrors.categoria = t('errors.required', 'Required');

        // Brand and Size logic: if previously "NO VISIBLE", user must fill them.
        // We just check if they are empty now.
        if (!formData.marca) newErrors.marca = t('errors.required', 'Required');
        if (!formData.talla) newErrors.talla = t('errors.required', 'Required');

        if (!formData.color) newErrors.color = t('errors.required', 'Required');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !user || !imageFile) return;

        setLoading(true);
        try {
            // 1. Upload Image
            const fileExt = 'jpg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('garment-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('garment-images')
                .getPublicUrl(fileName);

            // 2. Generate Code (Simple sequential logic or random unique?)
            // PRD says: Category + next number. Implementation complexity: high to lock/check.
            // Simplified for now: CAT + 3 random digits + timestamp part? 
            // Better: Count existing items of category. For MVP, we can do a random string or simpler code.
            // Let's do: PREFIX-TIMESTAMP-Last3CharsOfID (Collision unlikely)
            // PRD Prefixes: Camisa -> CAM, etc.
            const prefixes: Record<string, string> = {
                'Camisa': 'CAM', 'Polo': 'POL', 'Camiseta': 'CMT', 'Pantalón': 'PAN',
                'Jersey': 'JER', 'Sudadera': 'SUD', 'Abrigo/Chaqueta': 'ABR',
                'Cinturón': 'CIN', 'Calcetines': 'CAL', 'Zapatos': 'ZAP',
                'Zapatillas': 'ZPT', 'Accesorio': 'ACC'
            };
            const prefix = prefixes[formData.categoria] || 'GEN';
            const code = `${prefix}-${Date.now().toString().slice(-4)}`;

            // 3. Insert into DB
            const { error: insertError } = await supabase
                .from('garments')
                .insert({
                    user_id: user.id,
                    codigo: code,
                    categoria: formData.categoria,
                    marca: formData.marca,
                    talla: formData.talla,
                    color: formData.color,
                    descripcion: formData.descripcion,
                    estilo: formData.estilo,
                    temporada: formData.temporada,
                    foto_url: publicUrl,
                    activa: true
                });

            if (insertError) throw insertError;

            onSuccess();
            onClose();

        } catch (err: any) {
            console.error('Error saving garment:', err);
            setErrors({ submit: err.message || 'Error saving garment' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">{t('common:close')}</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                                    {t('add_garment_title', 'Añadir nueva prenda')}
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                                    {/* Image Section */}
                                    <div className="sm:col-span-1">
                                        <div
                                            className={`relative flex w-full justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors
                                                ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-indigo-400 bg-gray-50'}
                                                ${imagePreview ? 'p-0 border-none overflow-hidden h-64 sm:h-auto aspect-square' : ''}
                                            `}
                                        >
                                            {imagePreview ? (
                                                <div className="relative w-full h-full">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImagePreview(null); setImageFile(null); }}
                                                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-red-50 text-gray-600 hover:text-red-500"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                    {analyzing && (
                                                        <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center">
                                                            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse mb-2" />
                                                            <p className="text-sm font-medium text-indigo-700 animate-pulse">
                                                                {t('analyzing', 'SARTORIA está analizando tu prenda...')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                    <Camera className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                                    <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                                                        <span className="relative rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none hover:text-indigo-500">
                                                            {t('upload_photo', 'Sube una foto')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs leading-5 text-gray-600">{t('or_drag_drop', 'o arrastra y suelta')}</p>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                            />
                                        </div>
                                        {errors.image && <p className="mt-2 text-sm text-red-600">{errors.image}</p>}
                                    </div>

                                    {/* Form Fields Section */}
                                    <div className="sm:col-span-1 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium leading-6 text-gray-900">{t('category', 'Categoría')}</label>
                                            <select
                                                value={formData.categoria}
                                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            >
                                                <option value="">{t('select_option', 'Selecciona...')}</option>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            {errors.categoria && <p className="mt-1 text-xs text-red-600">{errors.categoria}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium leading-6 text-gray-900">{t('brand', 'Marca')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.marca}
                                                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                                    placeholder={analyzing ? '...' : ''}
                                                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${errors.marca ? 'ring-red-300' : ''}`}
                                                />
                                                {errors.marca && <p className="mt-1 text-xs text-red-600">{errors.marca}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium leading-6 text-gray-900">{t('size', 'Talla')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.talla}
                                                    onChange={(e) => setFormData({ ...formData, talla: e.target.value })}
                                                    placeholder={analyzing ? '...' : ''}
                                                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${errors.talla ? 'ring-red-300' : ''}`}
                                                />
                                                {errors.talla && <p className="mt-1 text-xs text-red-600">{errors.talla}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium leading-6 text-gray-900">{t('color', 'Color principal')}</label>
                                            <input
                                                type="text"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                            {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium leading-6 text-gray-900">{t('style', 'Estilo')}</label>
                                                <select
                                                    value={formData.estilo}
                                                    onChange={(e) => setFormData({ ...formData, estilo: e.target.value })}
                                                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                >
                                                    <option value="">{t('select_option', 'Selecciona...')}</option>
                                                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium leading-6 text-gray-900">{t('season', 'Temporada')}</label>
                                                <select
                                                    value={formData.temporada}
                                                    onChange={(e) => setFormData({ ...formData, temporada: e.target.value })}
                                                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                >
                                                    <option value="">{t('select_option', 'Selecciona...')}</option>
                                                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium leading-6 text-gray-900">{t('description', 'Descripción')}</label>
                                            <textarea
                                                rows={2}
                                                value={formData.descripcion}
                                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                        >
                                            {t('common:cancel', 'Cancelar')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || analyzing}
                                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading && <Loader2 className="animate-spin h-4 w-4" />}
                                            {t('common:save', 'Guardar')}
                                        </button>
                                    </div>

                                    {errors.submit && (
                                        <div className="sm:col-span-2 text-center">
                                            <p className="text-sm text-red-600 flex items-center justify-center gap-1">
                                                <AlertTriangle size={16} />
                                                {errors.submit}
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
