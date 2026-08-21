import { dbConnection } from "../database/databaseConnection";
import { AIActionType, AIUsageLimit } from "../types/types";

export interface AIUsageLimitRepository {
    getUsageCount(actionType: AIActionType, yearMonth: string): Promise<number>;
    incrementUsage(actionType: AIActionType, yearMonth: string): Promise<void>;
    resetUsage(actionType: AIActionType, yearMonth: string): Promise<void>;
}

export class AIUsageLimitRepositoryImpl implements AIUsageLimitRepository {
    async getUsageCount(actionType: AIActionType, yearMonth: string): Promise<number> {
        const rows = await dbConnection.query<AIUsageLimit>(
            'SELECT * FROM ai_usage_limits WHERE action_type = ? AND year_month = ?',
            [actionType, yearMonth]
        );
        return rows[0]?.usage_count || 0;
    }

    async incrementUsage(actionType: AIActionType, yearMonth: string): Promise<void> {
        const sql = `
            INSERT INTO ai_usage_limits (action_type, year_month, usage_count, created_at, updated_at)
            VALUES (?, ?, 1, datetime('now'), datetime('now'))
            ON CONFLICT (action_type, year_month)
            DO UPDATE SET
                usage_count = usage_count + 1,
                updated_at = datetime('now')
        `;
        await dbConnection.execute(sql, [actionType, yearMonth]);
    }

    async resetUsage(actionType: AIActionType, yearMonth: string): Promise<void> {
        await dbConnection.execute(
            'DELETE FROM ai_usage_limits WHERE action_type = ? AND year_month = ?',
            [actionType, yearMonth]
        );
    }
}
