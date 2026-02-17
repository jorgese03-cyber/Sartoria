import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
    className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors ${className}`}
            type="button"
        >
            {i18n.language === 'en' ? 'ES' : 'EN'}
        </button>
    );
}
