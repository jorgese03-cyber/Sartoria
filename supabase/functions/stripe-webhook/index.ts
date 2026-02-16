import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.20.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

console.log('Stripe Webhook function up and running')

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    if (!signature) {
        return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
        )
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object
            const userId = session.metadata?.user_id
            const subscriptionId = session.subscription
            const customerId = session.customer

            if (userId) {
                // Update profile with customer_id if not present
                await supabaseAdmin
                    .from('profiles')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', userId)

                // Create subscription record
                // We might need to fetch subscription details to get dates
                const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)

                const planType = subscription.items.data[0].price.id === Deno.env.get('STRIPE_PRICE_YEARLY')
                    ? 'yearly'
                    : 'monthly'

                await supabaseAdmin.from('subscriptions').upsert({
                    user_id: userId,
                    stripe_subscription_id: subscriptionId,
                    status: subscription.status, // 'trialing' usually
                    plan: planType,
                    trial_start: new Date(subscription.trial_start! * 1000).toISOString(),
                    trial_end: new Date(subscription.trial_end! * 1000).toISOString(),
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: subscription.cancel_at_period_end
                })
            }
            break
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const subscription = event.data.object
            // Find user by stripe_customer_id or stripe_subscription_id
            // Ideally we stored stripe_subscription_id in subscriptions table so we can query by it

            const planType = subscription.items.data[0].price.id === Deno.env.get('STRIPE_PRICE_YEARLY')
                ? 'yearly'
                : 'monthly'

            await supabaseAdmin
                .from('subscriptions')
                .update({
                    status: subscription.status,
                    plan: planType,
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
                    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                })
                .eq('stripe_subscription_id', subscription.id)
            break
        }
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object
            // Handle payment success (ensure status is active)
            // Usually customer.subscription.updated handles status changes, but good to have safeguard
            const subscriptionId = invoice.subscription
            if (subscriptionId) {
                await supabaseAdmin
                    .from('subscriptions')
                    .update({ status: 'active' })
                    .eq('stripe_subscription_id', subscriptionId)
            }
            break
        }
        case 'invoice.payment_failed': {
            const invoice = event.data.object
            const subscriptionId = invoice.subscription
            if (subscriptionId) {
                await supabaseAdmin
                    .from('subscriptions')
                    .update({ status: 'past_due' })
                    .eq('stripe_subscription_id', subscriptionId)
            }
            break
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
    })
})
