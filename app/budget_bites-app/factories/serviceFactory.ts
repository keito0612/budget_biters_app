
import {
    PreferencesRepositoryImpl,
} from '../repositories/preferencesRepository';
import { BudgetRepositoryImpl } from '../repositories/budgetRepository';
import { MealPlanRepositoryImpl } from '../repositories/mealPlanRepository';
import { MealLogRepositoryImpl } from '../repositories/mealLogRepository';
import { ExpenseRepositoryImpl } from '../repositories/expenseRepository';
import { PremiumStatusRepositoryImpl } from '../repositories/premiumStatusRepository';
import { AuthRepositoryImpl } from '../repositories/authRepository';
import { BudgetService } from '../services/budgetService';
import { MealPlanService } from '../services/mealPlanService';
import { AuthService } from '../services/authService';
import { PremiumService } from '../services/premiumService';
import { SettingRepositoryImpl } from '../repositories/settingRepository';
import { SettingService } from '../services/settingService';

export class ServiceFactory {
    // シングルトンのリポジトリインスタンス
    private static preferencesRepo = new PreferencesRepositoryImpl();
    private static budgetRepo = new BudgetRepositoryImpl();
    private static mealPlanRepo = new MealPlanRepositoryImpl();
    private static mealLogRepo = new MealLogRepositoryImpl();
    private static expenseRepo = new ExpenseRepositoryImpl();
    private static premiumStatusRepo = new PremiumStatusRepositoryImpl();
    private static authRepo = new AuthRepositoryImpl();
    private static settingRepo = new SettingRepositoryImpl();

    static createBudgetService(): BudgetService {
        return new BudgetService(this.budgetRepo, this.mealLogRepo);
    }

    static createMealPlanService(): MealPlanService {
        return new MealPlanService(
            this.mealPlanRepo,
            this.budgetRepo,
            this.preferencesRepo
        );
    }

    static createAuthService(): AuthService {
        return new AuthService(this.authRepo);
    }

    static createPremiumService(): PremiumService {
        return new PremiumService(this.premiumStatusRepo);
    }

    static createSettingService(): SettingService {
        return new SettingService(this.settingRepo);
    }


    // リポジトリへの直接アクセス（必要な場合）
    static getPreferencesRepository() {
        return this.preferencesRepo;
    }

    static getBudgetRepository() {
        return this.budgetRepo;
    }

    static getMealPlanRepository() {
        return this.mealPlanRepo;
    }

    static getMealLogRepository() {
        return this.mealLogRepo;
    }

    static getExpenseRepository() {
        return this.expenseRepo;
    }

    static getPremiumStatusRepository() {
        return this.premiumStatusRepo;
    }

    static getAuthRepository() {
        return this.authRepo;
    }
}