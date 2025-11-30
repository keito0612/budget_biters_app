import { dbConnection } from './../database/databaseConnection';

export interface SettingRepository {
    allDeleteData: () => Promise<void>;
}

export class SettingRepositoryImpl implements SettingRepository {

    async allDeleteData() {
        const deleteTables = ['preferences', 'budgets', 'meal_plans', 'meal_logs'];
        for (const table of deleteTables) {
            await dbConnection.execute(`DELETE FROM ${table}`);
        }
        await this.resetDefultData();
    }

    private async resetDefultData() {
        await dbConnection.execute(`
      INSERT OR IGNORE INTO preferences (id, taste_preference, allergies, avoid_ingredients)
      VALUES (1, 'balanced', '[]', '[]')
    `);
        await dbConnection.execute('INSERT INTO budgets (id, total_budget, daily_budget) VALUES(1, 0, 0)')
    }
}