import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PricingSection() {
    const { t } = useTranslation(['pricing', 'landing']);

    const features = [
        t('feature_unlimited_wardrobe', 'Armario ilimitado'),
        t('feature_daily_outfits', 'Atuendos diarios con IA'),
        t('feature_weekly_planning', 'Planificación semanal'),
        t('feature_ai_image', 'Prueba virtual con IA'),
        t('feature_wardrobe_analysis', 'Análisis de armario'),
        t('feature_purchase_recommendations', 'Recomendaciones de compra'),
        t('feature_travel_planner', 'Maleta de viaje'),
    ];

    return (
        <section id="pricing" className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2
                        className="text-[12px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-4"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                        {t('title', 'Precios')}
                    </h2>
                    <div className="w-8 h-px bg-[#8B7355] mx-auto mb-6" />
                    <p className="text-[#6B6B6B] font-light text-sm">
                        7 días de prueba gratuita. Cancela cuando quieras.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Monthly */}
                    <div className="border border-[#E5E0DB] p-10 flex flex-col">
                        <div className="mb-8">
                            <h3
                                className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-6"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                {t('monthly', 'Mensual')}
                            </h3>
                            <p className="flex items-baseline gap-2">
                                <span className="text-4xl font-serif font-normal text-[#1A1A1A]">{t('monthly_price', '€9.99')}</span>
                                <span className="text-[#6B6B6B] text-sm">/mes</span>
                            </p>
                        </div>
                        <ul className="space-y-3 mb-10 flex-1">
                            {features.map((feature) => (
                                <li key={feature} className="flex items-center gap-3">
                                    <span className="w-1 h-1 bg-[#8B7355] rounded-full flex-shrink-0" />
                                    <span className="text-sm text-[#1A1A1A] font-light">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            to="/register"
                            className="btn-secondary text-center w-full"
                        >
                            {t('start_trial', 'Comenzar prueba')}
                        </Link>
                    </div>

                    {/* Yearly — accent border */}
                    <div className="border border-[#8B7355] p-10 flex flex-col relative">
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] tracking-[0.15em] uppercase text-[#8B7355]">
                            Mejor valor
                        </span>
                        <div className="mb-8">
                            <h3
                                className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-6"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                {t('yearly', 'Anual')}
                            </h3>
                            <p className="flex items-baseline gap-2">
                                <span className="text-4xl font-serif font-normal text-[#1A1A1A]">{t('yearly_price', '€79.99')}</span>
                                <span className="text-[#6B6B6B] text-sm">/año</span>
                            </p>
                            <p className="mt-2 text-sm text-[#8B7355]">{t('yearly_equivalent', 'Solo €6.66/mes')}</p>
                        </div>
                        <ul className="space-y-3 mb-10 flex-1">
                            {features.map((feature) => (
                                <li key={feature} className="flex items-center gap-3">
                                    <span className="w-1 h-1 bg-[#8B7355] rounded-full flex-shrink-0" />
                                    <span className="text-sm text-[#1A1A1A] font-light">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            to="/register"
                            className="btn-primary text-center w-full"
                        >
                            {t('start_trial', 'Comenzar prueba')}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
