import { dbConnection } from "../database/databaseConnection";
import { ShoppingListCheck } from "../types/types";

export interface ShoppingListRepository {
    findChecksByWeek(weekStart: string): Promise<ShoppingListCheck[]>;
    saveCheck(weekStart: string, ingredientName: string, isChecked: boolean): Promise<void>;
    clearChecks(weekStart: string): Promise<void>;
}

export class ShoppingListRepositoryImpl implements ShoppingListRepository {
    async findChecksByWeek(weekStart: string): Promise<ShoppingListCheck[]> {
        const rows = await dbConnection.query<ShoppingListCheck>(
            'SELECT * FROM shopping_list_checks WHERE week_start = ?',
            [weekStart]
        );
        return rows;
    }

    async saveCheck(weekStart: string, ingredientName: string, isChecked: boolean): Promise<void> {
        const sql = `
            INSERT INTO shopping_list_checks
                (week_start, ingredient_name, is_checked, checked_at, created_at)
            VALUES
                (?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT (week_start, ingredient_name)
            DO UPDATE SET
                is_checked = EXCLUDED.is_checked,
                checked_at = CASE WHEN EXCLUDED.is_checked = 1 THEN datetime('now') ELSE NULL END
        `;
        await dbConnection.execute(sql, [weekStart, ingredientName, isChecked ? 1 : 0]);
    }

    async clearChecks(weekStart: string): Promise<void> {
        await dbConnection.execute(
            'DELETE FROM shopping_list_checks WHERE week_start = ?',
            [weekStart]
        );
    }
}
