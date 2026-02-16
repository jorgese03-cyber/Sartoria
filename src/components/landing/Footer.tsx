import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
    const { t, i18n } = useTranslation('landing');

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
                <div className="flex justify-center space-x-6 md:order-2">
                    <Link to="#" className="text-gray-400 hover:text-gray-500">
                        {t('footer.links.terms')}
                    </Link>
                    <Link to="#" className="text-gray-400 hover:text-gray-500">
                        {t('footer.links.privacy')}
                    </Link>
                    <Link to="#" className="text-gray-400 hover:text-gray-500">
                        {t('footer.links.contact')}
                    </Link>
                </div>

                <div className="mt-8 md:mt-0 md:order-1">
                    <p className="text-center text-base text-gray-400">
                        &copy; {new Date().getFullYear()} SARTORIA.IA. {t('footer.made_with')}.
                    </p>
                    <div className="mt-4 flex justify-center md:justify-start space-x-4">
                        <button
                            onClick={() => changeLanguage('es')}
                            className={`text-sm ${i18n.language === 'es' ? 'font-bold text-indigo-600' : 'text-gray-500'}`}
                        >
                            Español
                        </button>
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`text-sm ${i18n.language === 'en' ? 'font-bold text-indigo-600' : 'text-gray-500'}`}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
