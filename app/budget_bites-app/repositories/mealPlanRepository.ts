import { dbConnection } from "../database/databaseConnection";
import { MealPlan } from "../types/types";

export interface MealPlanRepository {
    findByDateRange: (startDate: string, endDate: string) => Promise<MealPlan[]>;
    findByDate: (date: string) => Promise<MealPlan[]>;
    findByDateAndMealType: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => Promise<MealPlan | null>;
    save: (plan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    bulkSave: (plans: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
    deleteByMonth: (month: string) => Promise<void>;
    deleteByDateAndMealType: (date: string, mealType: string) => Promise<void>;
}


export class MealPlanRepositoryImpl implements MealPlanRepository {
    async findByDateRange(startDate: string, endDate: string): Promise<MealPlan[]> {
        const rows = await dbConnection.query<any>(
            'SELECT * FROM meal_plans WHERE date >= ? AND date <= ? ORDER BY date, meal_type',
            [startDate, endDate]
        );

        return rows.map((row) => this.mapToEntity(row));
    }

    async findByDate(date: string): Promise<MealPlan[]> {
        return this.findByDateRange(date, date);
    }


    async findByDateAndMealType(
        date: string,
        mealType: 'breakfast' | 'lunch' | 'dinner'
    ): Promise<MealPlan | null> {
        const rows = await dbConnection.query<any>(
            'SELECT * FROM meal_plans WHERE date = ? AND meal_type = ?',
            [date, mealType]
        );

        return rows[0] ? this.mapToEntity(rows[0]) : null;
    }

    async save(plan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        const sql = `
                INSERT INTO meal_plans 
                    (date, meal_type, menu_name, ingredients, recipe, nutrition, cooking_time, estimated_cost, created_at, updated_at)
                VALUES 
                    (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                ON CONFLICT (date, meal_type) 
                DO UPDATE SET
                    menu_name = EXCLUDED.menu_name,
                    ingredients = EXCLUDED.ingredients,
                    recipe = EXCLUDED.recipe,
                    nutrition = EXCLUDED.nutrition,
                    cooking_time = EXCLUDED.cooking_time,
                    estimated_cost = EXCLUDED.estimated_cost,
                    updated_at = datetime('now')
            `;
        await dbConnection.execute(
            sql,
            [
                plan.date,
                plan.meal_type,
                plan.menu_name,
                JSON.stringify(plan.ingredients),
                JSON.stringify(plan.recipe),
                JSON.stringify(plan.nutrition),
                plan.cooking_time,
                plan.estimated_cost,
            ]
        );
    }

    async bulkSave(plans: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
        for (const plan of plans) {
            await this.save(plan);
        }
    }

    async deleteByMonth(month: string): Promise<void> {
        await dbConnection.execute(
            'DELETE FROM meal_plans WHERE date LIKE ?',
            [`${month}%`]
        );
    }

    async deleteByDateAndMealType(date: string, mealType: string): Promise<void> {
        await dbConnection.execute(
            'DELETE FROM meal_plans WHERE date = ? AND meal_type = ?',
            [date, mealType]
        );
    }

    private mapToEntity(row: any): MealPlan {
        return {
            ...row,
            ingredients: JSON.parse(row.ingredients),
            recipe: JSON.parse(row.recipe),
            nutrition: JSON.parse(row.nutrition),
        };
    }

}