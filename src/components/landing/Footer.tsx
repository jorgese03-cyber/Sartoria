import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
    const { t, i18n } = useTranslation('landing');

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <footer className="bg-white border-t border-[#E5E0DB]">
            <div className="max-w-5xl mx-auto py-16 px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1">
                        <span className="font-serif font-normal tracking-[0.15em] text-[#1A1A1A]" style={{ fontSize: '16px' }}>
                            SARTORIA
                        </span>
                        <p className="mt-4 text-[#6B6B6B] text-sm font-light leading-relaxed">
                            {t('footer.tagline', 'Elevando tu estilo con inteligencia artificial.')}
                        </p>
                    </div>

                    <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-4">Producto</h3>
                            <ul className="space-y-3">
                                <li><a href="#how-it-works" className="text-[#1A1A1A] text-sm font-light hover:opacity-60 transition-opacity">Cómo funciona</a></li>
                                <li><a href="#features" className="text-[#1A1A1A] text-sm font-light hover:opacity-60 transition-opacity">Características</a></li>
                                <li><a href="#pricing" className="text-[#1A1A1A] text-sm font-light hover:opacity-60 transition-opacity">Precios</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-4">Legal</h3>
                            <ul className="space-y-3">
                                <li><Link to="/privacy" className="text-[#1A1A1A] text-sm font-light hover:opacity-60 transition-opacity">{t('footer.links.privacy', 'Privacidad')}</Link></li>
                                <li><Link to="/terms" className="text-[#1A1A1A] text-sm font-light hover:opacity-60 transition-opacity">{t('footer.links.terms', 'Términos')}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-4">Contacto</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-[#1A1A1A] text-sm font-light hover:opacity-60 transition-opacity">Instagram</a></li>
                                <li><a href="#" className="text-[#1A1A1A] text-sm font-light hover:opacity-60 transition-opacity">Twitter</a></li>
                                <li><Link to="#" className="text-[#1A1A1A] text-sm font-light hover:opacity-60 transition-opacity">{t('footer.links.contact', 'Contacto')}</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-[#E5E0DB] flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[12px] text-[#6B6B6B] font-light tracking-wide">
                        &copy; {new Date().getFullYear()} SARTORIA
                    </p>
                    <div className="flex gap-6">
                        <button
                            onClick={() => changeLanguage('es')}
                            className={`text-[12px] tracking-[0.08em] transition-opacity ${i18n.language === 'es' ? 'text-[#1A1A1A]' : 'text-[#AAAAAA] hover:text-[#1A1A1A]'}`}
                        >
                            Español
                        </button>
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`text-[12px] tracking-[0.08em] transition-opacity ${i18n.language === 'en' ? 'text-[#1A1A1A]' : 'text-[#AAAAAA] hover:text-[#1A1A1A]'}`}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
