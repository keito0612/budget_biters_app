export interface Preferences {
    id?: number;
    taste_preference: 'light' | 'balanced' | 'rich';
    allergies: string[];
    avoid_ingredients: string[];
    created_at?: string;
    updated_at?: string;
}

export interface Budget {
    id?: number;
    total_budget: number;
    daily_budget: number;
    created_at?: string;
    updated_at?: string;
}

export interface Ingredient {
    name: string;
    amount: string;
    cost: number;
}

export interface NutritionInfo {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export interface MealPlan {
    id?: number;
    date: string; // YYYY-MM-DD
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    menu_name: string;
    ingredients: Ingredient[];
    recipe: string[];
    nutrition: NutritionInfo;
    cooking_time: number;
    estimated_cost: number;
    created_at?: string;
    updated_at?: string;
}

export interface MealTime {
    id?: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    hour: number;
    minute: number;
    enabled: boolean;
}

export interface MealTimeRow {
    id?: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    hour: number;
    minute: number;
    enabled: number;
}

export interface MealLog {
    id?: number;
    date: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    menu_name: string;
    actual_cost: number;
    notes?: string;
    executed_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Expense {
    id?: number;
    date: string;
    amount: number;
    category?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PremiumStatus {
    id: 1;
    is_premium: boolean;
    subscription_id?: string;
    expires_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AuthState {
    id: 1;
    is_logged_in: boolean;
    user_id?: string;
    email?: string;
    access_token?: string;
    refresh_token?: string;
    created_at?: string;
    updated_at?: string;
}

export interface BackupData {
    preferences: Preferences;
    budgets: Budget[];
    meal_plans: MealPlan[];
    meal_logs: MealLog[];
    premium_status: PremiumStatus;
    auth: AuthState;
}

export type AlertType = 'success' | 'warning' | 'error';

export interface ShoppingListItem {
    ingredientName: string;
    totalAmount: string;        // "200g + 100g"
    totalCost: number;
    meals: {
        date: string;
        mealType: 'breakfast' | 'lunch' | 'dinner';
        menuName: string;
        amount: string;
    }[];
    isChecked: boolean;
}

export interface ShoppingListCheck {
    id?: number;
    week_start: string;
    ingredient_name: string;
    is_checked: number;
    checked_at?: string;
    created_at?: string;
}

export type AIActionType = 'monthly_generation' | 'daily_regeneration' | 'meal_regeneration';

export interface AIUsageLimit {
    id?: number;
    action_type: AIActionType;
    year_month: string; // YYYY-MM
    usage_count: number;
    created_at?: string;
    updated_at?: string;
}

export const FREE_USAGE_LIMITS: Record<AIActionType, number> = {
    monthly_generation: 1,      // 月間献立生成: 月1回
    daily_regeneration: 3,      // 1日の献立変更: 月3回
    meal_regeneration: 5,       // 個別メニュー変更: 月5回
};