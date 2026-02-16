import { useTranslation } from 'react-i18next';

export default function PlanningPage() {
    const { t } = useTranslation('planning');
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
    );
}
