import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface SubscriptionState {
    isActive: boolean;
    isTrial: boolean;
    isPaid: boolean;
    status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'expired' | 'none';
    daysRemaining: number;
    plan: 'monthly' | 'yearly' | 'none';
    loading: boolean;
}

export const useSubscription = () => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionState>({
        isActive: false,
        isTrial: false,
        isPaid: false,
        status: 'none',
        daysRemaining: 0,
        plan: 'none',
        loading: true,
    });

    const fetchSubscription = useCallback(async () => {
        if (!user) {
            setSubscription(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching subscription:', error);
                setSubscription(prev => ({ ...prev, loading: false }));
                return;
            }

            if (!data) {
                // Check for trial based on user.created_at
                // user.created_at is a string ISO date
                const createdAt = new Date(user.created_at);
                const trialDurationDays = 15;
                const trialEnd = new Date(createdAt.getTime() + trialDurationDays * 24 * 60 * 60 * 1000);
                const now = new Date();

                const isTrial = now < trialEnd;
                const daysRemaining = isTrial ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                setSubscription({
                    isActive: isTrial,
                    isTrial: isTrial,
                    isPaid: false,
                    status: isTrial ? 'trialing' : 'expired',
                    daysRemaining: daysRemaining,
                    plan: 'none',
                    loading: false,
                });
                return;
            }

            const status = data.status;
            const plan = data.plan;
            const trialEnd = data.trial_end ? new Date(data.trial_end) : null;
            const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
            const now = new Date();

            let isActive = status === 'active' || status === 'trialing';
            const isTrial = status === 'trialing';
            const isPaid = status === 'active';

            // Verify expiration just in case status is outdated but date passed
            // (Though webhook should handle this, client side check is good too)
            if (isTrial && trialEnd && now > trialEnd) {
                isActive = false;
                // status = 'expired'; // Don't override DB status locally unless necessary for logic
            }

            let daysRemaining = 0;
            if (isTrial && trialEnd) {
                daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            } else if (isPaid && periodEnd) {
                // daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }

            if (daysRemaining < 0) daysRemaining = 0;

            setSubscription({
                isActive,
                isTrial,
                isPaid,
                status,
                daysRemaining,
                plan,
                loading: false,
            });

        } catch (err) {
            console.error('Exception fetching subscription:', err);
            setSubscription(prev => ({ ...prev, loading: false }));
        }
    }, [user]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const canAccessFeature = (feature: string): boolean => {
        if (subscription.loading) return false;
        if (subscription.isActive) {
            // Full access for active paid, Limited for Trial
            if (subscription.isPaid) return true;
            if (subscription.isTrial) {
                // Trial limitations
                const trialFeatures = ['outfit', 'wardrobe', 'image_generation'];
                if (trialFeatures.includes(feature)) return true;
                // Blocked features in trial
                return false;
            }
        }
        return false;
    };

    const getMaxItemsPerCategory = (): number => {
        if (subscription.loading) return 0;
        if (subscription.isPaid) return Infinity;
        if (subscription.isTrial) return 5;
        return 0; // No access if expired/none
    };

    return {
        ...subscription,
        canAccessFeature,
        getMaxItemsPerCategory,
        checkSubscription: fetchSubscription,
    };
};
