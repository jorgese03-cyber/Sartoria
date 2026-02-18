import React from 'react';
import { useTranslation } from 'react-i18next';

interface OccasionSelectorProps {
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
}

export const OccasionSelector: React.FC<OccasionSelectorProps> = ({ value, onChange, loading }) => {
    const { t } = useTranslation('outfit');

    const occasions = [
        { id: 'Casual', label: t('casual', 'Casual') },
        { id: 'Smart Casual', label: t('smart_casual', 'Elegante') },
        { id: 'Business Casual', label: t('business_casual', 'Negocios') },
        { id: 'Formal', label: t('formal', 'Formal') },
        { id: 'Special', label: t('special_event', 'Evento') },
    ];

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
                {occasions.map((occ) => (
                    <button
                        key={occ.id}
                        onClick={() => onChange(occ.id)}
                        disabled={loading}
                        className={`text-[12px] tracking-[0.1em] uppercase pb-1 transition-all border-b
                            ${value === occ.id
                                ? 'text-[#1A1A1A] border-[#1A1A1A]'
                                : 'text-[#AAAAAA] border-transparent hover:text-[#6B6B6B]'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {occ.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
