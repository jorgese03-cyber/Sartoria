import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
    const { t, i18n } = useTranslation('landing');

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <footer className="bg-[#0a0a0a] border-t border-gray-900 text-white">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-serif font-bold tracking-tight text-white">
                            SARTORIA<span className="text-[#d4af37]">.IA</span>
                        </span>
                        <p className="mt-4 text-gray-400 text-sm font-light">
                            {t('footer.tagline', 'Elevating your style through artificial intelligence.')}
                        </p>
                    </div>

                    <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Product</h3>
                            <ul className="space-y-3">
                                <li><a href="#how-it-works" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">How it Works</a></li>
                                <li><a href="#features" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">Features</a></li>
                                <li><a href="#pricing" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">Pricing</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Legal</h3>
                            <ul className="space-y-3">
                                <li><Link to="/privacy" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">{t('footer.links.privacy')}</Link></li>
                                <li><Link to="/terms" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">{t('footer.links.terms')}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Connect</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">Instagram</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">Twitter</a></li>
                                <li><Link to="#" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">{t('footer.links.contact')}</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-base text-gray-500 font-light">
                        &copy; {new Date().getFullYear()} SARTORIA.IA. {t('footer.rights_reserved', 'All rights reserved')}.
                    </p>
                    <div className="mt-4 md:mt-0 flex space-x-6">
                        <button
                            onClick={() => changeLanguage('es')}
                            className={`text-sm transition-colors ${i18n.language === 'es' ? 'text-[#d4af37] font-medium' : 'text-gray-500 hover:text-white'}`}
                        >
                            Español
                        </button>
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`text-sm transition-colors ${i18n.language === 'en' ? 'text-[#d4af37] font-medium' : 'text-gray-500 hover:text-white'}`}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
