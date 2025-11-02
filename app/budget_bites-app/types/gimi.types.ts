import { Ingredient } from "./types";

export interface UserPreferences {
    taste_preferences: {
        salty: number;   // 1-10
        sweet: number;   // 1-10
        spicy: number;   // 1-10
        sour: number;    // 1-10
    };
    allergies: string[];
    dietary_restrictions: string[];
    cooking_skill_level: 'beginner' | 'intermediate' | 'advanced';
    preferred_cuisines: string[];
}

export interface MealExecutionLog {
    id: string;
    date: string;
    meal_type: MealType;
    executed: boolean;
    actual_menu_name?: string;
    actual_cost?: number;
    satisfaction_rating?: number;
    notes?: string;
}

export interface GenerateMealPlanParams {
    year: number;
    month: number;
    budget: number;
    preferences: UserPreferences;
    pastLogs?: MealExecutionLog[];
}

export interface RegenerateMealParams {
    date: string;
    mealType: MealType;
    currentMeal: {
        menu_name: string;
        estimated_cost: number;
        ingredients: Ingredient[];
    };
    preferences: UserPreferences;
    remainingBudget: number;
}

export interface MealData {
    menuName: string;
    ingredients: Ingredient[];
    recipeSteps: string[];
    estimatedCost: number;
    cookingTime: number;
    nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export interface DailyMealPlan {
    date: string;
    breakfast: MealData;
    lunch: MealData;
    dinner: MealData;
}


export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface GenerateMealPlanResponse {
    mealPlans: DailyMealPlan[];
    totalCost: number;
    tips: string[];
}


export const MEAL_TYPE_JA: Record<MealType, string> = {
    breakfast: '朝食',
    lunch: '昼食',
    dinner: '夕食',
} as const;

// 変換関数
export function getMealTypeJa(mealType: MealType): string {
    return MEAL_TYPE_JA[mealType];
}