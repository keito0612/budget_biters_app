import { MealTimeRepository } from "../repositories/mealTimeRepository";
import { MealTime } from "../types/types";

export class MealTimeService {
    constructor(private mealTimeRepo: MealTimeRepository) { }

    async getMealTimes(): Promise<MealTime[]> {
        const mealTimes = await this.mealTimeRepo.getMealTimes();
        return mealTimes;
    }

    async updateMealTime(id: number, mealTime: MealTime): Promise<void> {
        await this.mealTimeRepo.updateMealTime(id, mealTime);
    }
    async updateEnabled(id: number, enabled: boolean) {
        await this.mealTimeRepo.updateEnabled(id, enabled);
    }
}