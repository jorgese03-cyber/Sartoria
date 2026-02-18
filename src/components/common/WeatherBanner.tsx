import React from 'react';

interface WeatherBannerProps {
    weather: { temp: number; description: string; city: string; condition: string; } | null;
    loading?: boolean;
}

export const WeatherBanner: React.FC<WeatherBannerProps> = ({ weather, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 w-48 bg-[#F5F0EB] rounded" />
            </div>
        );
    }

    if (!weather) return null;

    return (
        <p className="text-sm text-[#6B6B6B] font-light tracking-wide">
            {weather.city} · {Math.round(weather.temp)}°C · <span className="capitalize">{weather.description}</span>
        </p>
    );
};
