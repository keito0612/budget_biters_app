import { dbConnection } from "../database/databaseConnection";
import { MealLog } from "../types/types";

export interface MealLogRepository {
    findByMonth: (month: string) => Promise<MealLog[]>;
    findByDateRange: (startDate: string, endDate: string) => Promise<MealLog[]>;
    save: (log: Omit<MealLog, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export class MealLogRepositoryImpl implements MealLogRepository {
    async findByMonth(month: string): Promise<MealLog[]> {
        return dbConnection.query<MealLog>(
            'SELECT * FROM meal_logs WHERE date LIKE ? ORDER BY date DESC, meal_type',
            [`${month}%`]
        );
    }

    async findByDateRange(startDate: string, endDate: string): Promise<MealLog[]> {
        return dbConnection.query<MealLog>(
            'SELECT * FROM meal_logs WHERE date >= ? AND date <= ? ORDER BY date DESC',
            [startDate, endDate]
        );
    }

    async save(log: Omit<MealLog, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        await dbConnection.execute(
            `INSERT INTO meal_logs (date, meal_type, menu_name, actual_cost, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [log.date, log.meal_type, log.menu_name, log.actual_cost, log.notes || '']
        );
    }

    async getTotalSpentByMonth(month: string): Promise<number> {
        const rows = await dbConnection.query<{ total: number }>(
            'SELECT COALESCE(SUM(actual_cost), 0) as total FROM meal_logs WHERE date LIKE ?',
            [`${month}%`]
        );
        return rows[0]?.total || 0;
    }
}