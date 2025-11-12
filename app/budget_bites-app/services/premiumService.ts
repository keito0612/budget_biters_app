import { PremiumStatusRepository } from "../repositories/premiumStatusRepository";

export class PremiumService {
    private premiumRepo: PremiumStatusRepository;
    constructor(premiumRepo: PremiumStatusRepository) {
        this.premiumRepo = premiumRepo;
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
}