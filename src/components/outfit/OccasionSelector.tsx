import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shirt, Glasses, Briefcase, Award, Star } from 'lucide-react';

interface OccasionSelectorProps {
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
}

export const OccasionSelector: React.FC<OccasionSelectorProps> = ({ value, onChange, loading }) => {
    const { t } = useTranslation('outfit');

    const occasions = [
        { id: 'Casual', label: t('casual'), Icon: Shirt, color: 'bg-green-100 text-green-800' },
        { id: 'Smart Casual', label: t('smart_casual'), Icon: Glasses, color: 'bg-blue-100 text-blue-800' },
        { id: 'Business Casual', label: t('business_casual'), Icon: Briefcase, color: 'bg-orange-100 text-orange-800' },
        { id: 'Formal', label: t('formal'), Icon: Award, color: 'bg-red-100 text-red-800' },
        { id: 'Special', label: t('special_event'), Icon: Star, color: 'bg-purple-100 text-purple-800' },
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
                        <div className={`p-2 rounded-full mb-2 ${occasion.color.split(' ')[0]}`}>
                            <occasion.Icon className={`w-6 h-6 ${occasion.color.split(' ')[1]}`} />
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${occasion.color}`}>
                            {occasion.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
