import { GeminiService } from "../lib/gemini";
import { BudgetRepository } from "../repositories/budgetRepository";
import { MealPlanRepository } from "../repositories/MealPlanRepository";
import { PreferencesRepository } from "../repositories/preferencesRepository";
import { MealPlan } from "../types/types";

export class MealPlanService {
    constructor(
        private mealPlanRepo: MealPlanRepository,
        private budgetRepo: BudgetRepository,
        private preferencesRepo: PreferencesRepository
    ) { }

    async generateMonthlyPlan(month: string): Promise<void> {
        const budget = await this.budgetRepo.findByMonth(month);
        if (!budget) throw new Error('予算が設定されていません');

        const preferences = await this.preferencesRepo.get();
        const response = await GeminiService.generateMonthlyMealPlan({
            month,
            budget,
            preferences,
        });

        await this.mealPlanRepo.deleteByMonth(month);
        await this.mealPlanRepo.bulkSave(response.plans);
    }

    async regenerateDailyMeal(
        date: string,
        mealType: 'breakfast' | 'lunch' | 'dinner'
    ): Promise<void> {
        const month = date.substring(0, 7);
        const budget = await this.budgetRepo.findByMonth(month);
        if (!budget) throw new Error('予算が設定されていません');

        const preferences = await this.preferencesRepo.get();
        const newPlan = await GeminiService.regenerateDailyMeal(date, mealType, {
            month,
            budget,
            preferences,
        });

        await this.mealPlanRepo.save(newPlan);
    }

    async getTodaysMeals(): Promise<MealPlan[]> {
        const today = new Date().toISOString().split('T')[0];
        return this.mealPlanRepo.findByDate(today);
    }

    async getMonthlyMeals(month: string): Promise<MealPlan[]> {
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;
        return this.mealPlanRepo.findByDateRange(startDate, endDate);
    }
}