import { useState, useEffect } from 'react';
import { ServiceFactory } from '../factories/serviceFactory';


export function usePremium() {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPremiumStatus();
    }, []);

    const loadPremiumStatus = async () => {
        try {
            const premiumService = ServiceFactory.createPremiumService();
            const status = await premiumService.isPremium();
            setIsPremium(status);
        } catch (error) {
            console.error('Premium status取得エラー:', error);
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => {
        setLoading(true);
        loadPremiumStatus();
    };

    return { isPremium, loading, refresh };
}