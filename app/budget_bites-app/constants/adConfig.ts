import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// Googleの公式テスト広告ID
const TEST_AD_IDS = {
    banner: TestIds.BANNER,
    interstitial: TestIds.INTERSTITIAL,
    rewarded: TestIds.REWARDED,
};

const PRODUCTION_AD_IDS = {
    banner: Platform.select({
        ios: 'ca-app-pub-8369847853540237/7232731565',
        android: 'ca-app-pub-1234567890123456/0987654321',
    }),
    interstitial: Platform.select({
        ios: 'ca-app-pub-1234567890123456/1111111111',
        android: 'ca-app-pub-1234567890123456/2222222222',
    }),
    rewarded: Platform.select({
        ios: 'ca-app-pub-8369847853540237/8977195093',
        android: 'ca-app-pub-1234567890123456/4444444444',
    }),
};

// 使用する広告IDを選択（開発環境ではテスト、本番環境では本番IDを使用）
export const AD_UNIT_IDS = {
    banner: __DEV__ ? TEST_AD_IDS.banner : PRODUCTION_AD_IDS.banner!,
    interstitial: __DEV__ ? TEST_AD_IDS.interstitial : PRODUCTION_AD_IDS.interstitial!,
    rewarded: __DEV__ ? TEST_AD_IDS.rewarded : PRODUCTION_AD_IDS.rewarded!,
};

// 広告設定
export const AD_CONFIG = {
    maxAdContentRating: 'PG', // 広告のコンテンツレーティング
    tagForChildDirectedTreatment: false, // 子供向けコンテンツかどうか
    tagForUnderAgeOfConsent: false, // 同意年齢未満かどうか
    testDeviceIdentifiers: ['EMULATOR'], // テストデバイスID
};