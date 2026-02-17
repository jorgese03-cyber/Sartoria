import React from 'react';
import { useTranslation } from 'react-i18next';

interface WeatherBannerProps {
    weather: {
        temp: number;
        description: string;
        city: string;
        condition: string;
    } | null;
    loading?: boolean;
}

export const WeatherBanner: React.FC<WeatherBannerProps> = ({ weather, loading }) => {
    const { t } = useTranslation('outfit');

    if (loading) {
        return (
            <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-200 rounded-full"></div>
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-blue-200 rounded"></div>
                    <div className="h-4 w-24 bg-blue-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!weather) return null;

    // Simple icon mapping based on condition/description
    const getWeatherIcon = (condition: string) => {
        const main = condition.toLowerCase();
        if (main.includes('rain') || main.includes('drizzle')) return '🌧️';
        if (main.includes('clouds')) return '☁️';
        if (main.includes('clear')) return '☀️';
        if (main.includes('snow')) return '❄️';
        if (main.includes('thunder')) return '⚡';
        return '🌤️';
    };

    return (
        <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
            <div className="text-4xl">
                {getWeatherIcon(weather.condition)}
            </div>
            <div>
                <h3 className="font-medium text-gray-900">
                    {t('weather_banner', {
                        city: weather.city,
                        temp: weather.temp,
                        condition: weather.description
                    })}
                </h3>
                <p className="text-sm text-gray-500 capitalize">{weather.description}</p>
            </div>
        </div>
    );
};
