import { dbConnection } from "../database/databaseConnection";
import { Budget } from "../types/types";

export interface BudgetRepository {
    get(): Promise<Budget | null>;
    save(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void>;
    update(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void>;
    delete(month: string): Promise<void>;
}


export class BudgetRepositoryImpl implements BudgetRepository {
    async get(): Promise<Budget | null> {
        const rows = await dbConnection.query<any>(
            'SELECT * FROM budgets WHERE id = 1'
        );
        return rows[0];
    }
    async save(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        await dbConnection.execute(
            `INSERT OR REPLACE INTO budgets (total_budget, daily_budget, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [budget.total_budget, budget.daily_budget]
        );
    }

    async update(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        await dbConnection.execute(
            `UPDATE budgets
         SET total_budget = ?, daily_budget = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`,
            [budget.total_budget, budget.daily_budget]
        );
    }

    async delete(month: string): Promise<void> {
        await dbConnection.execute('DELETE FROM budgets WHERE month = ?', [month]);
    }
}