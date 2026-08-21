import { dbConnection } from './../database/databaseConnection';

export interface SettingRepository {
    allDeleteData: () => Promise<void>;
}

export class SettingRepositoryImpl implements SettingRepository {

    async allDeleteData() {
        await dbConnection.withTransaction(async () => {
            const deleteTables = ['preferences', 'budgets', 'meal_plans', 'meal_logs', 'shopping_list_checks', 'ai_usage_limits'];
            for (const table of deleteTables) {
                await dbConnection.execute(`DELETE FROM ${table}`);
            }
            await this.resetDefultData();
        });
    }

    private async resetDefultData() {
        await dbConnection.execute(`
      INSERT OR IGNORE INTO preferences (id, taste_preference, allergies, avoid_ingredients)
      VALUES (1, 'balanced', '[]', '[]')
    `);
        await dbConnection.execute('INSERT OR IGNORE INTO budgets (id, total_budget, daily_budget) VALUES(1, 0, 0)')
    }
}