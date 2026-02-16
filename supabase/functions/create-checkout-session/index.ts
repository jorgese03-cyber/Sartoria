import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.20.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

console.log('create-checkout-session function up and running')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        // 0. Authenticate user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Not authenticated')
        }

        const user_id = user.id
        const email = user.email

        const { plan, return_url } = await req.json()

        if (!email) {
            throw new Error('User email not found')
        }

        // 1. Get or create customer
        const customers = await stripe.customers.list({ email: email, limit: 1 })
        let customer_id = customers.data.length > 0 ? customers.data[0].id : null

        if (!customer_id) {
            const customer = await stripe.customers.create({ email: email, metadata: { user_id } })
            customer_id = customer.id
        }

        // 2. Identify price based on plan
        let price_id = Deno.env.get('STRIPE_PRICE_MONTHLY')
        if (plan === 'yearly') {
            price_id = Deno.env.get('STRIPE_PRICE_YEARLY')
        }

        if (!price_id) {
            throw new Error('Price ID not configured')
        }

        // 3. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customer_id,
            line_items: [
                {
                    price: price_id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 15,
            },
            success_url: `${return_url || req.headers.get('origin')}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${return_url || req.headers.get('origin')}/register`,
            metadata: {
                user_id: user_id,
            },
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
            },
        )
    }
})
