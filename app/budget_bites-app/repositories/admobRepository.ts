import { AD_CONFIG } from "../constants/adConfig";
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

interface AdmodRepository {
    initializeAds: () => Promise<void>;
}


export class AdmodRepositoryImpl implements AdmodRepository {
    async initializeAds() {
        try {
            // SDKの初期化
            await mobileAds().setRequestConfiguration({
                maxAdContentRating: MaxAdContentRating.PG,
                tagForChildDirectedTreatment: AD_CONFIG.tagForChildDirectedTreatment,
                tagForUnderAgeOfConsent: AD_CONFIG.tagForUnderAgeOfConsent,
                testDeviceIdentifiers: AD_CONFIG.testDeviceIdentifiers,
            });
            await mobileAds().initialize();
        } catch (error) {
            console.error('AdMob initialization error:', error);
        }
    }
}