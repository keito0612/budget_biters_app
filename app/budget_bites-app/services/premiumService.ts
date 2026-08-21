import { PremiumStatusRepository } from "../repositories/premiumStatusRepository";
import { AIUsageLimitRepository } from "../repositories/aiUsageLimitRepository";
import { AIActionType, FREE_USAGE_LIMITS } from "../types/types";

export class PremiumService {
    private premiumRepo: PremiumStatusRepository;
    private aiUsageRepo: AIUsageLimitRepository;

    constructor(premiumRepo: PremiumStatusRepository, aiUsageRepo: AIUsageLimitRepository) {
        this.premiumRepo = premiumRepo;
        this.aiUsageRepo = aiUsageRepo;
    }

    async isPremium(): Promise<boolean> {
        const status = await this.premiumRepo.get();
        return status.is_premium;
    }

    async setPremiumStatus(isPremium: boolean, subscriptionId?: string): Promise<void> {
        await this.premiumRepo.update(isPremium, subscriptionId);
    }

    async checkPremiumFeature(featureName: string): Promise<void> {
        const isPremium = await this.isPremium();
        if (!isPremium) {
            throw new Error(`${featureName} はPremium会員限定機能です`);
        }
    }

    // AI使用回数をチェック（制限を超えていたらエラー）
    async checkAIUsageLimit(actionType: AIActionType): Promise<void> {
        const isPremium = await this.isPremium();
        if (isPremium) return; // プレミアムは無制限

        const yearMonth = new Date().toISOString().substring(0, 7);
        const currentUsage = await this.aiUsageRepo.getUsageCount(actionType, yearMonth);
        const limit = FREE_USAGE_LIMITS[actionType];

        if (currentUsage >= limit) {
            const actionNames: Record<AIActionType, string> = {
                monthly_generation: '月間献立生成',
                daily_regeneration: '1日の献立変更',
                meal_regeneration: '個別メニュー変更'
            };
            throw new Error(
                `${actionNames[actionType]}の無料回数（月${limit}回）を超えました。\nプレミアム会員になると無制限でご利用いただけます。`
            );
        }
    }

    // AI使用回数をインクリメント
    async incrementAIUsage(actionType: AIActionType): Promise<void> {
        const yearMonth = new Date().toISOString().substring(0, 7);
        await this.aiUsageRepo.incrementUsage(actionType, yearMonth);
    }

    // 残り使用回数を取得
    async getRemainingUsage(actionType: AIActionType): Promise<{ remaining: number; limit: number; isPremium: boolean }> {
        const isPremium = await this.isPremium();
        if (isPremium) {
            return { remaining: -1, limit: -1, isPremium: true }; // -1は無制限を示す
        }

        const yearMonth = new Date().toISOString().substring(0, 7);
        const currentUsage = await this.aiUsageRepo.getUsageCount(actionType, yearMonth);
        const limit = FREE_USAGE_LIMITS[actionType];

        return {
            remaining: Math.max(0, limit - currentUsage),
            limit,
            isPremium: false
        };
    }
}