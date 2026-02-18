import React from 'react';


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
        <div className="w-full bg-white/80 backdrop-blur-md border border-gray-100 p-6 rounded-2xl flex items-center justify-between shadow-premium hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-6">
                <div className="text-5xl filter drop-shadow-sm">
                    {getWeatherIcon(weather.condition)}
                </div>
                <div>
                    <h3 className="text-2xl font-serif font-medium text-gray-900">
                        {weather.city}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize font-light mt-1">
                        {weather.description}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-4xl font-light text-gray-900 tracking-tighter">
                    {Math.round(weather.temp)}°
                </span>
                <span className="text-lg text-gray-400 font-light align-top ml-1">C</span>
            </div>
        </div>
    );
};
