import { useState, useEffect } from 'react';
import { ServiceFactory } from '../factories/serviceFactory';
import { RevenueCatService } from '../services/revenueCatService';


export function usePremium() {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeAndLoad();
    }, []);

    const initializeAndLoad = async () => {
        try {
            // RevenueCatを初期化
            await RevenueCatService.initialize();
        } catch (error) {
            console.error('RevenueCat初期化エラー:', error);
        }
        await loadPremiumStatus();
    };

    const loadPremiumStatus = async () => {
        try {
            const premiumService = ServiceFactory.createPremiumService();

            // RevenueCatの状態をチェック
            const result = await RevenueCatService.checkPremiumStatus();

            if (result.success) {
                // RevenueCatのチェックが成功した場合、その結果を信頼
                console.log('Premium status - RevenueCat:', result.isPremium);
                await premiumService.setPremiumStatus(result.isPremium!);
                setIsPremium(result.isPremium!);
            } else {
                // RevenueCatが失敗した場合（ネットワークエラーなど）
                // ローカルDBをフォールバックとして使用
                console.log('RevenueCat check failed, using local DB');
                const localPremium = await premiumService.isPremium();
                setIsPremium(localPremium);
            }
        } catch (error) {
            console.error('Premium status取得エラー:', error);
            setIsPremium(false);
        } finally {
            setLoading(false);
        }
    };

    const refresh = async () => {
        setLoading(true);
        await loadPremiumStatus();
    };

    return { isPremium, loading, refresh };
}