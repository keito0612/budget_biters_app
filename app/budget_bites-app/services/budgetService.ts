import { BudgetRepository } from "../repositories/budgetRepository";
import { MealLogRepository } from "../repositories/mealLogRepository";
import { Budget } from "../types/types";


export class BudgetService {
    constructor(
        private budgetRepo: BudgetRepository,
        private mealLogRepo: MealLogRepository
    ) { }

    async getCurrentMonthBudget(): Promise<Budget | null> {
        const today = new Date();
        const month = today.toISOString().substring(0, 7);
        return this.budgetRepo.findByMonth(month);
    }

    async setBudget(monthlyBudget: number, month: string): Promise<void> {
        const dailyBudget = Math.floor(monthlyBudget / 30);
        await this.budgetRepo.save({
            month,
            total_budget: monthlyBudget,
            daily_budget: dailyBudget,
        });
    }

    async getRemainingBudget(month: string): Promise<number> {
        const budget = await this.budgetRepo.findByMonth(month);
        if (!budget) return 0;

        const spent = await this.mealLogRepo.getTotalSpentByMonth(month);
        return budget.total_budget - spent;
    }

    async getBudgetStatus(month: string): Promise<{
        total: number;
        spent: number;
        remaining: number;
        percentage: number;
    }> {
        const budget = await this.budgetRepo.findByMonth(month);
        if (!budget) {
            return { total: 0, spent: 0, remaining: 0, percentage: 0 };
        }

        const spent = await this.mealLogRepo.getTotalSpentByMonth(month);
        const remaining = budget.total_budget - spent;
        const percentage = (spent / budget.total_budget) * 100;

        return { total: budget.total_budget, spent, remaining, percentage };
    }
}