import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shirt, Calendar, Package, Clock, BarChart2, User, Lock, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallPage from '../../pages/PaywallPage';

export default function MainLayout() {
    const { t } = useTranslation('nav');
    const location = useLocation();
    const { isActive, loading, canAccessFeature, status, daysRemaining } = useSubscription();

    // Features mapping to tabs
    const tabs = [
        { id: 'outfit', path: '/app', icon: Shirt, label: t('outfit', 'Outfit'), feature: 'outfit' },
        { id: 'planning', path: '/app/planning', icon: Calendar, label: t('planning', 'Planning'), feature: 'planning' },
        { id: 'wardrobe', path: '/app/wardrobe', icon: Package, label: t('wardrobe', 'Wardrobe'), feature: 'wardrobe' },
        { id: 'history', path: '/app/history', icon: Clock, label: t('history', 'History'), feature: 'history' },
        { id: 'analysis', path: '/app/analysis', icon: BarChart2, label: t('analysis', 'Analysis'), feature: 'analysis' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    // Level 1 Access Control: If not active and not on profile, show paywall
    // We allow access to Profile to let user reactivate subscription
    const isProfilePage = location.pathname === '/app/profile';
    const showPaywall = !isActive && !isProfilePage;

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-serif font-bold tracking-tight">
                        SARTORIA<span className="text-indigo-600">.IA</span>
                    </span>
                    {isActive && status === 'trialing' && (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 ml-2">
                            Trial: {daysRemaining} days left
                        </span>
                    )}
                </div>
                <Link to="/app/profile" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                    <User size={24} />
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 mt-16 mb-20 overflow-y-auto">
                {/* Trial Banner for Mobile */}
                {isActive && status === 'trialing' && (
                    <div className="bg-indigo-50 px-4 py-2 text-center text-xs text-indigo-700 sm:hidden">
                        Free trial: {daysRemaining} days remaining
                    </div>
                )}

                {showPaywall ? <PaywallPage /> : <Outlet />}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 px-2 pb-safe z-50">
                <ul className="flex justify-around items-center h-full">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActiveTab = location.pathname === tab.path;
                        const isLocked = !canAccessFeature(tab.feature);

                        return (
                            <li key={tab.id} className="flex-1">
                                <Link
                                    to={tab.path}
                                    onClick={(e) => {
                                        if (isLocked) {
                                            e.preventDefault();
                                            // TODO: Show Upsell Modal
                                            alert("Feature requires subscription. Please upgrade.");
                                            // Ideally open a modal or navigate to a specialized upsell page
                                        }
                                    }}
                                    className={clsx(
                                        "flex flex-col items-center justify-center py-2 w-full h-full transition-colors relative",
                                        isActiveTab ? "text-indigo-600" : "text-gray-400 hover:text-gray-600",
                                        isLocked && "opacity-75"
                                    )}
                                >
                                    <div className="relative">
                                        <Icon size={24} strokeWidth={isActiveTab ? 2.5 : 2} />
                                        {isLocked && (
                                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                                                <Lock size={10} className="text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium mt-1">{tab.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
