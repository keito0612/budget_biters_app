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
    month: string; // YYYY-MM
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