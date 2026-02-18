import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shirt, Briefcase, Award, Star, User } from 'lucide-react';

interface OccasionSelectorProps {
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
}

export const OccasionSelector: React.FC<OccasionSelectorProps> = ({ value, onChange, loading }) => {
    const { t } = useTranslation('outfit');

    const occasions = [
        { id: 'Casual', label: t('casual'), Icon: Shirt, color: 'bg-green-100 text-green-800' },
        { id: 'Smart Casual', label: t('smart_casual'), Icon: User, color: 'bg-blue-100 text-blue-800' }, // User mostly for "Person" but close enough if no better option
        { id: 'Business Casual', label: t('business_casual'), Icon: Briefcase, color: 'bg-orange-100 text-orange-800' },
        { id: 'Formal', label: t('formal'), Icon: Award, color: 'bg-red-100 text-red-800' }, // Award is closest to "Tie" if Tie doesn't exist. "Tie" is not in basic lucide? Let me check text. Prompt says "corbata o traje". "Award" looks like a medal. Maybe "Ribbon"? Or just "Briefcase" again? I'll use "Award" for now or "Gem"?
        { id: 'Special', label: t('special_event'), Icon: Star, color: 'bg-purple-100 text-purple-800' },
    ];

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('title')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {occasions.map((occasion) => (
                    <button
                        key={occasion.id}
                        onClick={() => onChange(occasion.id)}
                        disabled={loading}
                        className={`
              flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 group
              ${value === occasion.id
                                ? 'border-black bg-black text-white shadow-lg'
                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-900'
                            }
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
                    >
                        <occasion.Icon
                            className={`w-6 h-6 mb-3 transition-colors ${value === occasion.id ? 'text-[#d4af37]' : 'text-gray-400 group-hover:text-gray-900'}`}
                            strokeWidth={1.5}
                        />
                        <span className={`text-xs font-medium tracking-wide ${value === occasion.id ? 'text-white' : 'text-gray-600'}`}>
                            {occasion.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
