import { dbConnection } from "../database/databaseConnection";
import { Expense } from "../types/types";

export interface ExpenseRepository {
    findByMonth: (month: string) => Promise<Expense[]>;
    save: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    delete: (id: number) => Promise<void>
}

export class ExpenseRepositoryImpl implements ExpenseRepository {
    async findByMonth(month: string): Promise<Expense[]> {
        return dbConnection.query<Expense>(
            'SELECT * FROM expenses WHERE date LIKE ? ORDER BY date DESC',
            [`${month}%`]
        );
    }

    async save(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        await dbConnection.execute(
            `INSERT INTO expenses (date, amount, category, description, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [expense.date, expense.amount, expense.category || '', expense.description || '']
        );
    }

    async delete(id: number): Promise<void> {
        await dbConnection.execute('DELETE FROM expenses WHERE id = ?', [id]);
    }
}
