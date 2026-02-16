import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { image } = await req.json()

        if (!image) {
            throw new Error('No image provided')
        }

        // Authenticate user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        // Prepare the payload for Gemini
        // We expect 'image' to be a base64 string (without data:image/jpeg;base64, prefix if possible, or we strip it)
        const base64Image = image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

        const modelParams = {
            contents: [
                {
                    parts: [
                        { text: "Analiza esta imagen de una prenda de ropa. Devuelve SOLAMENTE un objeto JSON (sin markdown) con los siguientes campos: 'categoria' (valores posibles: Camisa, Polo, Camiseta, Pantalón, Jersey, Sudadera, Abrigo/Chaqueta, Cinturón, Calcetines, Zapatos, Zapatillas, Accesorio), 'color' (color principal en español), 'estilo' (valores posibles: Casual, Smart Casual, Business Casual, Formal, Elegante, Deportivo), 'temporada' (valores posibles: Verano, Entretiempo, Invierno, Todo el año), 'marca' (si es visible en la foto, si no devuelve 'NO VISIBLE'), 'talla' (si es visible en la etiqueta, si no devuelve 'NO VISIBLE')." },
                        {
                            inline_data: {
                                mime_type: "image/jpeg", // Assuming jpeg or handle accordingly
                                data: base64Image
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                response_mime_type: "application/json",
            }
        };

        // Use Gemini 2.5 Flash as requested (assuming it exists in 2026, otherwise fallback might be needed but we try explicit request)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(modelParams),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Parse result
        let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            throw new Error('No content returned from Gemini');
        }

        // Clean up markdown if present (Gemini sometimes adds ```json ... ``` even with response_mime_type)
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        let analysisResult;
        try {
            analysisResult = JSON.parse(resultText);
        } catch (e) {
            console.error('JSON Parse Error', resultText);
            throw new Error('Failed to parse Gemini response');
        }

        return new Response(
            JSON.stringify(analysisResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
