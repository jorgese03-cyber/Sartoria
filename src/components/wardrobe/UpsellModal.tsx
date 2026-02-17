import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Unlock, X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface UpsellModalProps {
    isOpen: boolean
    onClose: () => void
    featureName?: string
    title?: string
    description?: string
}

export default function UpsellModal({ isOpen, onClose, featureName, title, description }: UpsellModalProps) {
    const { t } = useTranslation(['wardrobe', 'common']);
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Default to monthly for upsell, or let user choose? 
            // PRD says: "Desbloquear todo — desde €3,75/mes" which implies Annual pricing breakdown.
            // But usually checkout starts with a concrete plan.
            // Let's send them to the monthly plan by default or user preference?
            // Actually, maybe better to just trigger thecheckout session for MONTHLY as a quick start, 
            // or redirect to a pricing page?
            // "Botón primario: Desbloquear todo — desde €3,75/mes" -> implies showing the best value. 
            // Let's trigger checkout for YEARLY since that's the "from €3.75/mo" price (€44.99/year / 12 = 3.749).
            const plan = 'yearly';

            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    plan,
                    user_id: user.id,
                    email: user.email,
                    return_url: window.location.href // Return to where they were
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
            alert('Error initiating checkout');
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
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">{t('common:close')}</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <Unlock className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            {title || t('upsell.title', 'Has alcanzado el límite de prueba')}
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {description || t('upsell.description', {
                                                    category: featureName || 'items',
                                                    defaultValue: 'En la prueba gratuita puedes tener hasta 5 prendas por categoría. Suscríbete para desbloquear armario ilimitado y todas las funciones.'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        disabled={loading}
                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                        onClick={handleCheckout}
                                    >
                                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('upsell.unlock_button', 'Desbloquear todo — desde €3,75/mes')}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={onClose}
                                    >
                                        {t('upsell.cancel_button', 'Quizás más tarde')}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
