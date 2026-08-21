export const Config = {
    supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    revenueCat: {
        appleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || '',
        googleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || '',
        entitlementId: 'premium', // RevenueCatで設定するEntitlement ID
        productId: 'budget_bites_premium_monthly', // App Store/Google Playの商品ID
    },
    gemini: {
        apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
        model: 'gemini-2.5-flash',
    },
    premium: {
        monthlyPrice: 500,
        features: [
            '広告非表示',
            '月間献立生成 無制限（無料版: 月1回）',
            '1日の献立変更 無制限（無料版: 月3回）',
            '個別メニュー変更 無制限（無料版: 月5回）',
            '予算変更後の献立再生成',
            'クラウドバックアップ（近日公開）',
        ],
    },
};