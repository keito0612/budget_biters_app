import { dbConnection } from "../database/databaseConnection";
import { MealTime, MealTimeRow } from "../types/types";

export interface MealTimeRepository {
    getMealTimes: () => Promise<MealTime[]>;
    updateMealTime: (id: number, hour: number, minute: number) => Promise<void>;
    updateEnabled: (id: number, enabled: boolean) => Promise<void>;
}

export class MealTimeRepositoryImpl implements MealTimeRepository {
    private db = dbConnection;
    async getMealTimes(): Promise<MealTime[]> {
        const mealTimeRows = await this.db.query<MealTimeRow>('SELECT * FROM meal_times');
        const mealTimes: MealTime[] = mealTimeRows.map((mealTimeRow) => {
            return ({
                id: mealTimeRow.id,
                meal_type: mealTimeRow.meal_type,
                hour: mealTimeRow.hour,
                minute: mealTimeRow.minute,
                enabled: mealTimeRow.enabled === 1
            });
        });
        return mealTimes;
    }
    async updateMealTime(id: number, hour: number, minute: number): Promise<void> {
        await this.db.execute(
            'UPDATE meal_times SET hour = ?, minute = ? WHERE id = ?',
            [hour, minute, id]
        );
    }

    async updateEnabled(id: number, enabled: boolean): Promise<void> {
        await this.db.execute(
            'UPDATE meal_times SET enabled = ? WHERE id = ?',
            [enabled ? 1 : 0, id]
        );
    }
}