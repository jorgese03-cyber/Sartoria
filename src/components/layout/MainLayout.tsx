import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Calendar, Shirt, Clock, BarChart2, User, Lock, Loader2 } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallPage from '../../pages/PaywallPage';

export default function MainLayout() {
    const { t } = useTranslation('nav');
    const location = useLocation();
    const { isActive, loading, canAccessFeature, status, daysRemaining } = useSubscription();

    const tabs = [
        { id: 'home', path: '/app', icon: Home, label: t('start', 'Inicio'), feature: 'outfit' },
        { id: 'planning', path: '/app/planning', icon: Calendar, label: t('planning', 'Planificar'), feature: 'planning' },
        { id: 'wardrobe', path: '/app/wardrobe', icon: Shirt, label: t('wardrobe', 'Armario'), feature: 'wardrobe' },
        { id: 'history', path: '/app/history', icon: Clock, label: t('history', 'Historial'), feature: 'history' },
        { id: 'analysis', path: '/app/analysis', icon: BarChart2, label: t('analysis', 'Análisis'), feature: 'analysis' },
        { id: 'profile', path: '/app/profile', icon: User, label: t('profile', 'Perfil'), feature: 'profile' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin h-6 w-6 text-[#6B6B6B]" />
            </div>
        );
    }

    const isProfilePage = location.pathname === '/app/profile';
    const showPaywall = !isActive && !isProfilePage && status !== 'trialing';

    return (
        <div className="flex flex-col h-screen bg-white text-[#1A1A1A]">
            {/* Header — Ultra minimal Massimo Dutti style */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-white z-50 flex items-center justify-between px-6 border-b border-[#E5E0DB]">
                <span
                    className="font-serif font-normal tracking-[0.15em] text-[#1A1A1A]"
                    style={{ fontSize: '18px' }}
                >
                    SARTORIA
                </span>

                {isActive && status === 'trialing' && (
                    <span className="text-[11px] font-normal tracking-[0.08em] text-[#6B6B6B] uppercase">
                        Trial · {daysRemaining} días
                    </span>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 mt-14 mb-20 overflow-y-auto bg-white">
                {/* Mobile Trial Banner */}
                {isActive && status === 'trialing' && (
                    <div className="px-4 py-2 text-center text-[10px] tracking-[0.1em] text-[#6B6B6B] uppercase border-b border-[#E5E0DB] sm:hidden">
                        Prueba gratuita · {daysRemaining} días restantes
                    </div>
                )}

                {showPaywall ? <PaywallPage /> : <Outlet />}
            </main>

            {/* Bottom Navigation — 6 tabs, ultra-thin icons */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E0DB] h-[72px] px-2 pb-safe z-50">
                <ul className="flex justify-between items-center h-full max-w-lg mx-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActiveTab = location.pathname === tab.path || (tab.id === 'home' && location.pathname === '/app/');
                        const isLocked = !canAccessFeature(tab.feature as any) && tab.id !== 'profile';

                        return (
                            <li key={tab.id} className="flex-1">
                                <Link
                                    to={tab.path}
                                    className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200
                                        ${isActiveTab ? 'text-[#1A1A1A]' : 'text-[#AAAAAA]'}
                                        ${isLocked ? 'opacity-40' : ''}`}
                                >
                                    <div className="relative">
                                        <Icon
                                            size={20}
                                            strokeWidth={1}
                                        />
                                        {isLocked && (
                                            <div className="absolute -top-1 -right-1">
                                                <Lock size={8} className="text-[#AAAAAA]" />
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className={`mt-1 uppercase tracking-[0.08em] ${isActiveTab ? 'text-[#1A1A1A]' : 'text-[#AAAAAA]'}`}
                                        style={{ fontSize: '10px', fontWeight: 400 }}
                                    >
                                        {tab.label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
