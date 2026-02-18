import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './es.json';
import en from './en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: {
                common: es.common,
                landing: es.landing,
                auth: es.auth,
                nav: es.nav,
                outfit: es.outfit,
                planning: es.planning,
                wardrobe: es.wardrobe,
                history: es.history,
                analysis: es.analysis,
                pricing: es.pricing,
                subscription: es.subscription,
            },
            en: {
                common: en.common,
                landing: en.landing,
                auth: en.auth,
                nav: en.nav,
                outfit: en.outfit,
                planning: en.planning,
                wardrobe: en.wardrobe,
                history: en.history,
                analysis: en.analysis,
                pricing: en.pricing,
                subscription: en.subscription,
            },
        },
        fallbackLng: 'es',
        lng: 'es',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['navigator'],
        },
    });

export default i18n;
