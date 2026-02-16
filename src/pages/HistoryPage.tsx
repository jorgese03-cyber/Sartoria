import { useTranslation } from 'react-i18next';

export default function HistoryPage() {
    const { t } = useTranslation('history');
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
    );
}
