import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shirt, Calendar, Package, Clock, BarChart2, User, Lock } from 'lucide-react';
import clsx from 'clsx';

export default function MainLayout() {
    const { t } = useTranslation('nav');
    const location = useLocation();

    const tabs = [
        { id: 'outfit', path: '/app', icon: Shirt, label: t('outfit'), locked: false },
        { id: 'planning', path: '/app/planning', icon: Calendar, label: t('planning'), locked: true },
        { id: 'wardrobe', path: '/app/wardrobe', icon: Package, label: t('wardrobe'), locked: false },
        { id: 'history', path: '/app/history', icon: Clock, label: t('history'), locked: true },
        { id: 'analysis', path: '/app/analysis', icon: BarChart2, label: t('analysis'), locked: true },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-serif font-bold tracking-tight">
                        SARTORIA<span className="text-indigo-600">.IA</span>
                    </span>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                    <User size={24} />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 mt-16 mb-20 overflow-y-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 px-2 pb-safe z-50">
                <ul className="flex justify-around items-center h-full">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = location.pathname === tab.path;

                        return (
                            <li key={tab.id} className="flex-1">
                                <Link
                                    to={tab.path}
                                    className={clsx(
                                        "flex flex-col items-center justify-center py-2 w-full h-full transition-colors relative",
                                        isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <div className="relative">
                                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                        {tab.locked && (
                                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                                                <Lock size={10} className="text-gray-400" />
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
