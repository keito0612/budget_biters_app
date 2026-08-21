import { Platform } from 'react-native';
import Purchases, {
    PurchasesPackage,
    CustomerInfo,
    PurchasesOffering,
    LOG_LEVEL
} from 'react-native-purchases';
import { Config } from '../constants/config';

export class RevenueCatService {
    private static initialized = false;
    private static configurationFailed = false;

    // RevenueCatの初期化
    static async initialize(): Promise<boolean> {
        if (this.initialized) return true;
        if (this.configurationFailed) return false;

        const apiKey = Platform.OS === 'ios'
            ? Config.revenueCat.appleApiKey
            : Config.revenueCat.googleApiKey;

        if (!apiKey) {
            console.warn('RevenueCat API key not configured');
            this.configurationFailed = true;
            return false;
        }

        try {
            // 開発中のキャンセルログを抑制（WARNレベル以上のみ表示）
            Purchases.setLogLevel(LOG_LEVEL.WARN);
            await Purchases.configure({ apiKey });
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('RevenueCat configuration failed:', error);
            this.configurationFailed = true;
            return false;
        }
    }

    // 初期化されているかチェック
    static isConfigured(): boolean {
        return this.initialized && !this.configurationFailed;
    }

    // ユーザーIDを設定（ログイン時に呼び出す）
    static async login(userId: string): Promise<CustomerInfo | null> {
        if (!this.initialized) return null;
        const { customerInfo } = await Purchases.logIn(userId);
        return customerInfo;
    }

    // ログアウト
    static async logout(): Promise<void> {
        if (!this.initialized) return;
        await Purchases.logOut();
    }

    // 現在のユーザー情報を取得
    static async getCustomerInfo(): Promise<CustomerInfo | null> {
        if (!this.initialized) return null;
        return await Purchases.getCustomerInfo();
    }

    // プレミアム状態をチェック
    // 成功時: { success: true, isPremium: boolean }
    // 失敗時: { success: false } - ネットワークエラーなど
    static async checkPremiumStatus(): Promise<{ success: boolean; isPremium?: boolean }> {
        if (!this.initialized) {
            return { success: false };
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const isPremium = customerInfo.entitlements.active[Config.revenueCat.entitlementId] !== undefined;
            return { success: true, isPremium };
        } catch (error) {
            console.error('Failed to check premium status:', error);
            return { success: false };
        }
    }

    // 後方互換性のため残す（非推奨）
    static async isPremium(): Promise<boolean> {
        const result = await this.checkPremiumStatus();
        return result.success ? result.isPremium! : false;
    }

    // 利用可能なオファリングを取得
    static async getOfferings(): Promise<PurchasesOffering | null> {
        if (!this.initialized) {
            // 未初期化の場合はnullを返す
            return null;
        }

        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current;
        } catch (error) {
            console.error('Failed to get offerings:', error);
            return null;
        }
    }

    // パッケージを購入
    static async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
        if (!this.initialized) {
            return { success: false, error: 'RevenueCatが初期化されていません' };
        }

        try {
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
            const isPremium = customerInfo.entitlements.active[Config.revenueCat.entitlementId] !== undefined;

            console.log('Purchase completed. Entitlements:', Object.keys(customerInfo.entitlements.active));
            console.log('Expected entitlement ID:', Config.revenueCat.entitlementId);
            console.log('Is Premium:', isPremium);

            // 購入が完了した場合（customerInfoが返ってきた場合）は成功とみなす
            // Entitlementの反映に遅延がある場合があるため
            return {
                success: true,
                customerInfo
            };
        } catch (error: any) {
            if (error.userCancelled) {
                return { success: false, error: 'cancelled' };
            }
            // 既に購入済みの場合もエラーになるので、復元を試みる
            if (error.code === '6' || error.message?.includes('already')) {
                return { success: true, error: 'already_purchased' };
            }
            return { success: false, error: error.message };
        }
    }

    // 購入を復元
    static async restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
        if (!this.initialized) {
            return { success: false, error: 'RevenueCatが初期化されていません' };
        }

        try {
            const customerInfo = await Purchases.restorePurchases();
            const isPremium = customerInfo.entitlements.active[Config.revenueCat.entitlementId] !== undefined;

            return {
                success: isPremium,
                customerInfo
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    // サブスクリプション管理画面を開く
    static async openManageSubscriptions(): Promise<void> {
        // iOS: 設定アプリのサブスクリプション管理画面
        // Android: Google Playのサブスクリプション管理画面
        // RevenueCatはこの機能を直接提供しないため、URLで遷移
        if (Platform.OS === 'ios') {
            // iOSの場合はアプリ内でURLを開く
            const { Linking } = require('react-native');
            await Linking.openURL('https://apps.apple.com/account/subscriptions');
        } else {
            const { Linking } = require('react-native');
            await Linking.openURL('https://play.google.com/store/account/subscriptions');
        }
    }
}
