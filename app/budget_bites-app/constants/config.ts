export const Config = {
    supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    stripe: {
        publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        priceId: 'price_xxx', // Stripe Price ID
        successUrl: process.env.EXPO_PUBLIC_STRIPE_SUCCESS_URL || '',
        cancelUrl: process.env.EXPO_PUBLIC_STRIPE_CANCEL_URL || '',
    },
    gemini: {
        apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
        model: 'gemini-2.5-flash',
    },
    premium: {
        monthlyPrice: 400,
        features: [
            'AI献立生成 無制限',
            '日別AI再提案 無制限',
            'AI月間リプランニング 無制限',
            'Supabaseバックアップ 無制限',
            'Supabase完全復元',
        ],
    },
};