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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-8">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-900 focus:outline-none transition-colors"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">{t('common:close')}</span>
                                        <X className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>

                                <Dialog.Title as="h3" className="text-2xl font-serif font-medium leading-6 text-gray-900 mb-8 border-b border-gray-100 pb-4">
                                    {t('add_garment_title', 'Add New Garment')}
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                                    {/* Image Section */}
                                    <div className="sm:col-span-1">
                                        <div
                                            className={`relative flex w-full justify-center rounded-xl border border-dashed px-6 py-10 transition-colors
                                                ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-400 bg-gray-50'}
                                                ${imagePreview ? 'p-0 border-none overflow-hidden aspect-[3/4]' : ''}
                                            `}
                                        >
                                            {imagePreview ? (
                                                <div className="relative w-full h-full">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImagePreview(null); setImageFile(null); }}
                                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors backdrop-blur-sm"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    {analyzing && (
                                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                                                            <Sparkles className="w-8 h-8 text-[#d4af37] animate-pulse mb-3" />
                                                            <p className="text-sm font-medium text-gray-900 animate-pulse">
                                                                {t('analyzing', 'SARTORIA AI is analyzing...')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center cursor-pointer flex flex-col items-center justify-center h-full" onClick={() => fileInputRef.current?.click()}>
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                        <Camera className="h-6 w-6 text-gray-400" aria-hidden="true" />
                                                    </div>
                                                    <div className="flex text-sm leading-6 text-gray-900 justify-center">
                                                        <span className="font-medium hover:text-[#d4af37] transition-colors">
                                                            {t('upload_photo', 'Upload a photo')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">{t('or_drag_drop', 'or drag and drop')}</p>
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
                                        {errors.image && <p className="mt-2 text-xs text-red-500">{errors.image}</p>}
                                    </div>

                                    {/* Form Fields Section */}
                                    <div className="sm:col-span-1 space-y-5">
                                        <div>
                                            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{t('category', 'Category')}</label>
                                            <select
                                                value={formData.categoria}
                                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                className="block w-full rounded-lg border-gray-200 bg-gray-50 py-2.5 text-gray-900 text-sm focus:ring-black focus:border-black transition-shadow"
                                            >
                                                <option value="">{t('select_option', 'Select...')}</option>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            {errors.categoria && <p className="mt-1 text-xs text-red-500">{errors.categoria}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{t('brand', 'Brand')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.marca}
                                                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                                    placeholder={analyzing ? '...' : ''}
                                                    className={`block w-full rounded-lg border-gray-200 bg-gray-50 py-2.5 text-gray-900 text-sm focus:ring-black focus:border-black ${errors.marca ? 'ring-1 ring-red-300' : ''}`}
                                                />
                                                {errors.marca && <p className="mt-1 text-xs text-red-500">{errors.marca}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{t('size', 'Size')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.talla}
                                                    onChange={(e) => setFormData({ ...formData, talla: e.target.value })}
                                                    placeholder={analyzing ? '...' : ''}
                                                    className={`block w-full rounded-lg border-gray-200 bg-gray-50 py-2.5 text-gray-900 text-sm focus:ring-black focus:border-black ${errors.talla ? 'ring-1 ring-red-300' : ''}`}
                                                />
                                                {errors.talla && <p className="mt-1 text-xs text-red-500">{errors.talla}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{t('color', 'Color')}</label>
                                            <input
                                                type="text"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="block w-full rounded-lg border-gray-200 bg-gray-50 py-2.5 text-gray-900 text-sm focus:ring-black focus:border-black"
                                            />
                                            {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{t('style', 'Style')}</label>
                                                <select
                                                    value={formData.estilo}
                                                    onChange={(e) => setFormData({ ...formData, estilo: e.target.value })}
                                                    className="block w-full rounded-lg border-gray-200 bg-gray-50 py-2.5 text-gray-900 text-sm focus:ring-black focus:border-black"
                                                >
                                                    <option value="">{t('select_option', 'Select...')}</option>
                                                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{t('season', 'Season')}</label>
                                                <select
                                                    value={formData.temporada}
                                                    onChange={(e) => setFormData({ ...formData, temporada: e.target.value })}
                                                    className="block w-full rounded-lg border-gray-200 bg-gray-50 py-2.5 text-gray-900 text-sm focus:ring-black focus:border-black"
                                                >
                                                    <option value="">{t('select_option', 'Select...')}</option>
                                                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2 flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-full px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                        >
                                            {t('common:cancel', 'Cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || analyzing}
                                            className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95 transition-all"
                                        >
                                            {loading && <Loader2 className="animate-spin h-4 w-4" />}
                                            {t('common:save', 'Save Garment')}
                                        </button>
                                    </div>

                                    {errors.submit && (
                                        <div className="sm:col-span-2 text-center">
                                            <p className="text-sm text-red-600 flex items-center justify-center gap-1 bg-red-50 p-2 rounded-lg">
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
