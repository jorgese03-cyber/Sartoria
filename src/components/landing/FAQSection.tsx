import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus } from 'lucide-react';

export default function FAQSection() {
    const { t } = useTranslation('landing');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        { q: t('faq.q1', '¿Cómo funciona el estilista con IA?'), a: t('faq.a1', 'Nuestra IA analiza tu armario, el clima local y la ocasión para generar combinaciones perfectas.') },
        { q: t('faq.q2', '¿Necesito subir fotos de mi ropa?'), a: t('faq.a2', 'Sí, para obtener los mejores resultados. También puedes usar prendas genéricas para empezar rápido.') },
        { q: t('faq.q3', '¿Hay prueba gratuita?'), a: t('faq.a3', 'Sí. Tienes 7 días de acceso completo a todas las funciones premium.') },
        { q: t('faq.q4', '¿Puedo cancelar en cualquier momento?'), a: t('faq.a4', 'Sí, puedes cancelar tu suscripción en cualquier momento desde tu perfil.') },
        { q: t('faq.q5', '¿Sirve para hacer la maleta de viaje?'), a: t('faq.a5', 'Sí. Solo introduce tu destino y fechas, y generaremos una lista de equipaje completa.') },
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-24 bg-[#F5F0EB]">
            <div className="max-w-3xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2
                        className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-4"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                        {t('faq.title', 'Preguntas frecuentes')}
                    </h2>
                    <div className="w-8 h-px bg-[#8B7355] mx-auto" />
                </div>

                <dl>
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`border-t border-[#E5E0DB] ${index === faqs.length - 1 ? 'border-b' : ''}`}
                        >
                            <dt>
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full flex justify-between items-center py-6 text-left hover:opacity-70 transition-opacity"
                                >
                                    <span className="text-[#1A1A1A] text-[15px]">{faq.q}</span>
                                    <span className="ml-6 flex-shrink-0">
                                        {openIndex === index ? (
                                            <Minus className="h-4 w-4 text-[#6B6B6B]" strokeWidth={1} />
                                        ) : (
                                            <Plus className="h-4 w-4 text-[#6B6B6B]" strokeWidth={1} />
                                        )}
                                    </span>
                                </button>
                            </dt>
                            <dd
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                                    }`}
                            >
                                <p className="text-[#6B6B6B] font-light text-sm leading-relaxed pr-12">
                                    {faq.a}
                                </p>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
