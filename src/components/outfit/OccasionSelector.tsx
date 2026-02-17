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
        { id: 'Casual', label: t('casual'), icon: '🟢', color: 'bg-green-100 text-green-800' },
        { id: 'Smart Casual', label: t('smart_casual'), icon: '🔵', color: 'bg-blue-100 text-blue-800' },
        { id: 'Business Casual', label: t('business_casual'), icon: '🟠', color: 'bg-orange-100 text-orange-800' },
        { id: 'Formal', label: t('formal'), icon: '🔴', color: 'bg-red-100 text-red-800' },
        { id: 'Special', label: t('special_event'), icon: '🟣', color: 'bg-purple-100 text-purple-800' },
    ];

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('title')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {occasions.map((occasion) => (
                    <button
                        key={occasion.id}
                        onClick={() => onChange(occasion.id)}
                        disabled={loading}
                        className={`
              flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
              ${value === occasion.id
                                ? 'border-gray-900 bg-gray-50 shadow-sm'
                                : 'border-gray-100 bg-white hover:border-gray-300'
                            }
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
                    >
                        <span className="text-2xl mb-1">{occasion.icon}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${occasion.color}`}>
                            {occasion.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
