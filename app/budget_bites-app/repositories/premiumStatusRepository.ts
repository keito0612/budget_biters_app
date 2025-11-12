import { dbConnection } from "../database/databaseConnection";
import { PremiumStatus } from "../types/types";


export interface PremiumStatusRepository {
    get: () => Promise<PremiumStatus>;
    update: (isPremium: boolean, subscriptionId?: string) => Promise<void>;
}

export class PremiumStatusRepositoryImpl implements PremiumStatusRepository {
    async get(): Promise<PremiumStatus> {
        const rows = await dbConnection.query<any>(
            'SELECT * FROM premium_status WHERE id = 1'
        );
        return {
            ...rows[0],
            is_premium: Boolean(rows[0].is_premium),
        };
    }

    async update(isPremium: boolean, subscriptionId?: string): Promise<void> {
        await dbConnection.execute(
            `UPDATE premium_status 
       SET is_premium = ?, subscription_id = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1`,
            [isPremium ? 1 : 0, subscriptionId || null]
        );
    }
}