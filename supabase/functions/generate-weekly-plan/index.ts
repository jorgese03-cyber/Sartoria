import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const reqJson = await req.json()
        const { user_id, start_date, preferences } = reqJson

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Get User Profile
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('ciudad, idioma, genero')
            .eq('id', user_id)
            .single()

        if (profileError || !profile) {
            throw new Error('User profile not found')
        }

        // Use provided city for Travel mode, otherwise fall back to profile city
        const city = reqJson.city || profile.ciudad || 'Alicante,ES';
        const lang = profile.idioma || 'es';

        // 2. Get Weather Forecast (5 days / 3 hour steps)
        const weatherApiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
        if (!weatherApiKey) throw new Error('Weather API Key not configured');

        // Note: verify if we need to encode the city
        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherApiKey}&units=metric&lang=${lang}`
        );

        if (!forecastRes.ok) {
            console.error("Forecast API Error", await forecastRes.text());
            throw new Error('Failed to fetch weather forecast');
        }

        const forecastData = await forecastRes.json();
        const list = forecastData.list;

        // Process forecast to get 1 entry per day (approx mid-day or max temp)
        // We need to map `start_date` (Monday) and following 4 days to the forecast data
        // OpenWeatherMap returns UTC. Simple approach: find entries matching the date string.

        const dailyWeather = {};

        // Helper to format date as YYYY-MM-DD
        const formatDate = (date) => date.toISOString().split('T')[0];

        const startDateObj = new Date(start_date);
        const targetDates = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(startDateObj);
            d.setDate(d.getDate() + i);
            targetDates.push(formatDate(d));
        }

        // Group by day and find max temp / dominant condition
        // Simplification: take the entry closest to 12:00 PM for each target date
        targetDates.forEach(dateStr => {
            // Find entries for this date
            const entries = list.filter(item => item.dt_txt.startsWith(dateStr));

            if (entries.length > 0) {
                // Pick noon-ish entry or the first one if noon not found
                let noonEntry = entries.find(item => item.dt_txt.includes("12:00:00")) || entries[0];

                // Ideally calculate max temp of the day
                const maxTemp = Math.max(...entries.map(e => e.main.temp_max));

                dailyWeather[dateStr] = {
                    temp: Math.round(maxTemp), // Use max temp for outfit planning
                    condition: noonEntry.weather[0].main,
                    description: noonEntry.weather[0].description
                };
            } else {
                // Fallback if forecast doesn't cover this date (e.g. today is Friday, asking for next Mon)
                // In a real app we might need a different API or just fallback generic data
                dailyWeather[dateStr] = { temp: 20, condition: 'Clear', description: 'No data' };
            }
        });

        // 3. Get User's Garments
        const { data: garments, error: garmentsError } = await supabaseClient
            .from('garments') // NOTE: Check if table is 'prendas' or 'garments'. The PRD says 'prendas' in section 3.3.
            // But previous code in generate-outfit used 'garments'. 
            // WAIT - let me check the previous file content again.
            // Step 36 output showed: .from('garments') in line 59. 
            // So the table name is likely 'garments' in the actual DB even if PRD says 'prendas'.
            // I will stick to 'garments' to match existing code. 
            .select('id, categoria, color, descripcion, estilo, temporada, codigo')
            .eq('user_id', user_id)
            .eq('activa', true)

        if (garmentsError) throw new Error('Failed to fetch garments');

        if (!garments || garments.length < 5) {
            return new Response(
                JSON.stringify({ error: 'Not enough garments', details: 'Need at least 5 garments for a weekly plan' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const garmentsList = garments.map(g =>
            `- [${g.id}] ${g.categoria} (${g.codigo}): ${g.color}, ${g.estilo}, ${g.temporada}. ${g.descripcion}`
        ).join('\n');

        // 4. Call Gemini
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiApiKey) throw new Error('Gemini API Key not configured');

        // Construct request for 5 days
        const daysPrompt = targetDates.map((date, index) => {
            const w = dailyWeather[date];
            const pref = preferences.find(p => p.date === date) || {};
            const occasion = pref.occasion || 'Casual';
            return `
            DÍA ${index + 1} (${date}):
            - Clima: ${w.temp}°C, ${w.description}.
            - Ocasión: ${occasion}
            - Preferencia: ${pref.style || 'Adaptado a la ocasión'}
            `;
        }).join('\n');

        const prompt = `
        Actúa como un estilista personal experto. Crea una planificación semanal de outfits.
        
        CONTEXTO:
        - Usuario: ${profile.genero || 'Hombre'}
        - Ciudad: ${city}
        
        DÍAS A PLANIFICAR:
        ${daysPrompt}
        
        ARMARIO DISPONIBLE (Lista de prendas con ID):
        ${garmentsList}
        
        REGLAS:
        1. Genera un outfit completo y DIFERENTE para cada día.
        2. NO repitas la misma combinación exacta de (Superior + Inferior) en la semana.
        3. Intenta rotar las prendas principales (no uses los mismos pantalones 5 días seguidos si hay alternativas).
        4. Adapta cada outfit al clima y ocasión específica de ese día.
        
        FORMATO DE RESPUESTA (JSON):
        {
          "plan": [
             // Array de 5 objetos, uno por día en orden
            {
              "date": "YYYY-MM-DD",
              "outfit": {
                "nombre_look": "string",
                "explicacion": "string",
                "prendas": {
                   "prenda_superior_id": "uuid",
                   "prenda_inferior_id": "uuid",
                   "prenda_calzado_id": "uuid",
                   "prenda_cinturon_id": "uuid o null",
                   "prenda_capa_exterior_id": "uuid o null",
                   "prenda_calcetines_id": "uuid o null"
                },
                "style_notes": "string",
                "color_palette": ["#hex", "#hex", "#hex"],
                "imagen_prompt": "string"
              }
            }
          ]
        }
        `;

        const modelParams = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modelParams),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) throw new Error('No content from Gemini');

        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const resultJson = JSON.parse(resultText);

        // Merge weather data back into response
        const finalPlan = resultJson.plan.map(day => ({
            ...day,
            weather: dailyWeather[day.date]
        }));

        return new Response(
            JSON.stringify({ plan: finalPlan }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
