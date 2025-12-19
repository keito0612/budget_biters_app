import { ServiceFactory } from "../factories/serviceFactory";
import { GeminiService } from "../lib/gemini";
import { BudgetRepository } from "../repositories/budgetRepository";
import { MealPlanRepository } from "../repositories/mealPlanRepository";
import { NotificationData, ScheduleData } from "../repositories/notificationRepository";
import { PreferencesRepository } from "../repositories/preferencesRepository";
import { MealPlan } from "../types/types";
import { DateUtils } from "../utils/DateUtils";
import { MealUtils } from "../utils/MealUtils";

export class MealPlanService {
    constructor(
        private mealPlanRepo: MealPlanRepository,
        private budgetRepo: BudgetRepository,
        private preferencesRepo: PreferencesRepository,
    ) { }

    async generateMonthlyPlan(month: string): Promise<void> {
        const budget = await this.budgetRepo.get();
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

    async regenerateTodayMeal(
        date: string,
    ): Promise<void> {
        const month = date.substring(0, 7);
        const budget = await this.budgetRepo.get();
        if (!budget) throw new Error('予算が設定されていません');
        const preferences = await this.preferencesRepo.get();
        const response = await GeminiService.regenerateTodayMeal(date, {
            month,
            budget,
            preferences,
        });
        await this.mealPlanRepo.bulkSave(response.plans);
    }

    async regenerateDailyMeal(
        date: string,
        mealType: 'breakfast' | 'lunch' | 'dinner'
    ): Promise<void> {
        const month = date.substring(0, 7);
        const budget = await this.budgetRepo.get();
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
    async getMealPlan(date: string, mealType: "breakfast" | "lunch" | "dinner"): Promise<MealPlan | null> {
        return await this.mealPlanRepo.findByDateAndMealType(date, mealType);
    }


    async updateMealPlanTodayNotifications() {
        try {
            const mealTimeService = ServiceFactory.createMealTimeService();
            const mealPlanService = ServiceFactory.createMealPlanService();
            const notifaicationService = ServiceFactory.createNotificationService();
            // 今日の日付
            const today = DateUtils.formatDate(new Date());

            // 有効な食事時間を取得
            const mealTimes = await mealTimeService.getMealTimes();
            const enabledMealTimes = mealTimes.filter(mt => mt.enabled);

            // 既存の今日の通知をキャンセル
            const scheduledNotifications = await notifaicationService.getScheduledNotifications();
            for (const notification of scheduledNotifications) {
                const notificationDate = notification.trigger as any;
                if (notificationDate && DateUtils.isToday(notificationDate)) {
                    await notifaicationService.cancelNotification(
                        notification.identifier
                    );
                }
            }

            // 今日の各食事の通知をスケジュール
            for (const mealTime of enabledMealTimes) {
                const mealPlan = await mealPlanService.getMealPlan(today, mealTime.meal_type);
                const menuName = mealPlan?.menu_name || '献立が未設定です';
                const mealLabel = MealUtils.getMealLabel(mealTime.meal_type);

                // 今日の特定時刻に通知をスケジュール（1回のみ）
                const notifaicationData: NotificationData = {
                    title: `${mealLabel}の時間です 🍽️`,
                    body: `今日の${mealLabel}: ${menuName}`,
                    data: {
                        mealType: mealTime.meal_type,
                        menuName,
                        date: today,
                    },
                }
                const scheduleData: ScheduleData = {
                    hour: mealTime.hour,
                    minute: mealTime.minute,
                    repeats: true
                }
                await notifaicationService.scheduleNotification(notifaicationData, scheduleData);
            }
        } catch (error) {
            console.error('Failed to update today notifications:', error);
        }
    }
}