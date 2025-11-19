import { dbConnection } from "../database/databaseConnection";

export interface SettingRepository {
    allDeleteData: () => Promise<void>;
}

export class SettingRepositoryImpl implements SettingRepository {
    async allDeleteData() {
        const deleteTables = ['preferences', 'budgets', 'meal_plans', 'meal_logs'];
        for (const table of deleteTables) {
            await dbConnection.execute(`DELETE FROM ${table}`);
        }
    }
}