import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Calendar, Shirt, Clock, BarChart2, User, Lock, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallPage from '../../pages/PaywallPage';

export default function MainLayout() {
    const { t } = useTranslation('nav');
    const location = useLocation();
    const { isActive, loading, canAccessFeature, status, daysRemaining } = useSubscription();

    // Premium Fashion - 6 Tabs Configuration
    const tabs = [
        { id: 'home', path: '/app', icon: Home, label: t('start', 'Inicio'), feature: 'outfit' },
        { id: 'planning', path: '/app/planning', icon: Calendar, label: t('planning', 'Planificar'), feature: 'planning' },
        { id: 'wardrobe', path: '/app/wardrobe', icon: Shirt, label: t('wardrobe', 'Armario'), feature: 'wardrobe' },
        { id: 'history', path: '/app/history', icon: Clock, label: t('history', 'Historial'), feature: 'history' },
        { id: 'analysis', path: '/app/analysis', icon: BarChart2, label: t('analysis', 'Análisis'), feature: 'analysis' },
        { id: 'profile', path: '/app/profile', icon: User, label: t('profile', 'Perfil'), feature: 'profile' }, // Profile is usually open but let's keep consistent
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
                <Loader2 className="animate-spin h-8 w-8 text-[#d4af37]" />
            </div>
        );
    }

    // Access Control Logic
    // If user is not active, we might show Paywall. 
    // EXCEPT for Profile (to manage sub) and maybe History/Analysis if we want to tease.
    // For now, let's keep simple: Show Paywall if inactive, unless on Profile.
    const isProfilePage = location.pathname === '/app/profile';
    // const showPaywall = !isActive && !isProfilePage; 
    // User requested "PAYWALL (trial expirado)". Implementing minimal check.
    const showPaywall = !isActive && !isProfilePage && status !== 'trialing';

    return (
        <div className="flex flex-col h-screen bg-[#ffffff] text-[#0a0a0a] font-sans">
            {/* Premium Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-serif font-bold tracking-tight text-[#0a0a0a]">
                        SARTORIA<span className="text-[#d4af37] italic">.IA</span>
                    </span>
                    {isActive && status === 'trialing' && (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#0a0a0a] text-[#d4af37] ml-3 border border-[#d4af37]/30">
                            Trial: {daysRemaining} días
                        </span>
                    )}
                </div>
                {/* Profile Link removed from Header as it is now a Tab */}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 mt-16 mb-24 overflow-y-auto bg-[#fafafa]">
                {/* Mobile Trial Banner */}
                {isActive && status === 'trialing' && (
                    <div className="bg-[#0a0a0a] px-4 py-1.5 text-center text-[10px] font-medium tracking-wide text-[#d4af37] sm:hidden uppercase">
                        Prueba Gratuita: {daysRemaining} días restantes
                    </div>
                )}

                {showPaywall ? <PaywallPage /> : <Outlet />}
            </main>

            {/* Premium Bottom Navigation - 6 Tabs */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-[88px] px-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <ul className="flex justify-between items-center h-full max-w-lg mx-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActiveTab = location.pathname === tab.path || (tab.id === 'home' && location.pathname === '/app/');
                        // Profile usually accessible
                        const isLocked = !canAccessFeature(tab.feature as any) && tab.id !== 'profile';

                        return (
                            <li key={tab.id} className="flex-1">
                                <Link
                                    to={tab.path}
                                    className={clsx(
                                        "flex flex-col items-center justify-center w-full h-full transition-all duration-300 group",
                                        isActiveTab
                                            ? "text-[#0a0a0a]"
                                            : "text-gray-400 hover:text-gray-600",
                                        isLocked && "opacity-50"
                                    )}
                                >
                                    <div className={clsx(
                                        "relative p-1.5 rounded-xl transition-all duration-300",
                                        isActiveTab && "bg-gray-50"
                                    )}>
                                        <Icon
                                            size={22}
                                            strokeWidth={isActiveTab ? 2 : 1.5}
                                            className={clsx(
                                                "transition-transform duration-300",
                                                isActiveTab && "scale-105" // Subtle scale
                                            )}
                                        />
                                        {isLocked && (
                                            <div className="absolute -top-0.5 -right-0.5 bg-gray-100 rounded-full p-0.5 border border-white">
                                                <Lock size={8} className="text-gray-400" />
                                            </div>
                                        )}
                                        {/* Status Dot for Active */}
                                        {isActiveTab && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#d4af37] rounded-full"></span>
                                        )}
                                    </div>
                                    <span className={clsx(
                                        "text-[9px] font-medium mt-1 tracking-wide uppercase transition-colors",
                                        isActiveTab ? "text-[#0a0a0a]" : "text-gray-400"
                                    )}>
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
