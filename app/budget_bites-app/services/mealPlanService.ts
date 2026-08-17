import { ServiceFactory } from "../factories/serviceFactory";
import { GeminiService } from "../lib/gemini";
import { BudgetRepository } from "../repositories/budgetRepository";
import { MealPlanRepository } from "../repositories/mealPlanRepository";
import { NotificationData, ScheduleData } from "../repositories/notificationRepository";
import { PreferencesRepository } from "../repositories/preferencesRepository";
import { MealPlan } from "../types/types";
import { DateUtils } from "../utils/DateUtils";
import { MealUtils } from "../utils/MealUtils";

export interface GenerationProgress {
    totalWeeks: number;
    completedWeeks: number;
    currentWeek: number;
    status: 'idle' | 'generating' | 'completed' | 'error';
    error?: string;
}

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

    /**
     * 段階的に月間献立を生成する
     * 週単位で生成し、最初の週が完了したらコールバックを呼び出す
     */
    async generateMonthlyPlanProgressively(
        month: string,
        onProgress: (progress: GenerationProgress) => void,
        onFirstWeekComplete: () => void
    ): Promise<void> {
        const budget = await this.budgetRepo.get();
        if (!budget) throw new Error('予算が設定されていません');

        const preferences = await this.preferencesRepo.get();
        const weekRanges = DateUtils.getWeekRanges(month);
        const totalWeeks = weekRanges.length;

        // 最初に既存の献立を削除
        await this.mealPlanRepo.deleteByMonth(month);

        // 既存のメニュー名を追跡（重複回避用）
        let existingMenuNames: string[] = [];

        for (let i = 0; i < weekRanges.length; i++) {
            const week = weekRanges[i];

            // 進捗を通知
            onProgress({
                totalWeeks,
                completedWeeks: i,
                currentWeek: i + 1,
                status: 'generating',
            });

            try {
                const response = await GeminiService.generateWeeklyMealPlan({
                    startDate: week.startDate,
                    endDate: week.endDate,
                    budget,
                    preferences,
                    existingMenuNames: existingMenuNames.slice(-30), // 直近30件のメニュー名
                });

                // 生成された献立を保存
                await this.mealPlanRepo.bulkSave(response.plans);

                // メニュー名を追加
                const newMenuNames = response.plans.map(plan => plan.menu_name);
                existingMenuNames = [...existingMenuNames, ...newMenuNames];

                // 最初の週が完了したらコールバックを呼び出す
                if (i === 0) {
                    onFirstWeekComplete();
                }

                // 進捗を更新
                onProgress({
                    totalWeeks,
                    completedWeeks: i + 1,
                    currentWeek: i + 1,
                    status: i === weekRanges.length - 1 ? 'completed' : 'generating',
                });

            } catch (error: any) {
                onProgress({
                    totalWeeks,
                    completedWeeks: i,
                    currentWeek: i + 1,
                    status: 'error',
                    error: error.message,
                });
                throw error;
            }
        }
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