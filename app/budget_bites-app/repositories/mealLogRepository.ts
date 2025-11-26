import { dbConnection } from "../database/databaseConnection";
import { MealLog } from "../types/types";

export interface MealLogRepository {
    findByMonth: (month: string, mealType: 'breakfast' | 'lunch' | 'dinner') => Promise<MealLog[]>;
    findByDateRange: (startDate: string, endDate: string) => Promise<MealLog[]>;
    save: (log: Omit<MealLog, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    getTotalSpentByMonth: (month: string) => Promise<number>;
}

export class MealLogRepositoryImpl implements MealLogRepository {
    async findByMonth(month: string, mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<MealLog[]> {
        return dbConnection.query<MealLog>(
            'SELECT * FROM meal_logs WHERE date LIKE ? AND meal_type = ? ORDER BY date DESC',
            [`${month}%`, mealType]
        );
    }

    async findByDateRange(startDate: string, endDate: string): Promise<MealLog[]> {
        return dbConnection.query<MealLog>(
            'SELECT * FROM meal_logs WHERE date >= ? AND date <= ? ORDER BY date DESC',
            [startDate, endDate]
        );
    }

    async save(log: Omit<MealLog, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        const sql = `INSERT INTO meal_logs (date, meal_type, menu_name, actual_cost, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (date, meal_type) 
                DO UPDATE SET
                    date = EXCLUDED.date,
                    meal_type = EXCLUDED.meal_type,
                    menu_name = EXCLUDED.menu_name,
                    actual_cost = EXCLUDED.actual_cost,
                    notes = EXCLUDED.notes,
                    updated_at = datetime('now')`;
        await dbConnection.execute(
            sql,
            [log.date, log.meal_type, log.menu_name, log.actual_cost, log.notes || '']
        );
    }

    async getTotalSpentByMonth(month: string): Promise<number> {
        const rows = await dbConnection.query<{ total: number }>(
            'SELECT COALESCE(SUM(actual_cost), 0) as total FROM meal_logs WHERE date LIKE ?',
            [`${month}% `]
        );
        return rows[0]?.total || 0;
    }
}