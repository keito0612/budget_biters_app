import { dbConnection } from "../database/databaseConnection";
import { Budget } from "../types/types";

export interface BudgetRepository {
    findByMonth(month: string): Promise<Budget | null>;
    findAll(): Promise<Budget[]>;
    save(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void>;
    update(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void>;
    delete(month: string): Promise<void>;
}


export class BudgetRepositoryImpl implements BudgetRepository {
    async findByMonth(month: string): Promise<Budget | null> {
        const rows = await dbConnection.query<Budget>(
            'SELECT * FROM budgets WHERE month = ?',
            [month]
        );
        return rows[0] || null;
    }

    async findAll(): Promise<Budget[]> {
        return dbConnection.query<Budget>(
            'SELECT * FROM budgets ORDER BY month DESC'
        );
    }

    async save(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        await dbConnection.execute(
            `INSERT OR REPLACE INTO budgets (month, total_budget, daily_budget, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [budget.month, budget.total_budget, budget.daily_budget]
        );
    }

    async update(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        await dbConnection.execute(
            `UPDATE budgets
         SET total_budget = ?, daily_budget = ?, updated_at = CURRENT_TIMESTAMP
         WHERE month = ?`,
            [budget.total_budget, budget.daily_budget, budget.month]
        );
    }

    async delete(month: string): Promise<void> {
        await dbConnection.execute('DELETE FROM budgets WHERE month = ?', [month]);
    }
}