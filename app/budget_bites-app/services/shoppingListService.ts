import { MealPlanRepository } from "../repositories/mealPlanRepository";
import { ShoppingListRepository } from "../repositories/shoppingListRepository";
import { ShoppingListItem } from "../types/types";

// 分数を数値に変換
const parseFraction = (str: string): number => {
    if (str.includes('/')) {
        const [numerator, denominator] = str.split('/').map(Number);
        return numerator / denominator;
    }
    return parseFloat(str);
};

// 量の文字列を数値と単位に分離
const parseAmount = (amount: string): { value: number; unit: string } | null => {
    const trimmed = amount.trim();

    // パターン1: 単位が先 (例: "大さじ1", "小さじ1/2", "大さじ2")
    const prefixMatch = trimmed.match(/^(大さじ|小さじ|カップ)([\d./]+)$/);
    if (prefixMatch) {
        const value = parseFraction(prefixMatch[2]);
        if (!isNaN(value)) {
            return { value, unit: prefixMatch[1] };
        }
    }

    // パターン2: 数値が先 (例: "200g", "1/2個", "3本", "1/4本")
    const suffixMatch = trimmed.match(/^([\d./]+)\s*(.*)$/);
    if (suffixMatch) {
        const value = parseFraction(suffixMatch[1]);
        if (!isNaN(value)) {
            return { value, unit: suffixMatch[2] || '' };
        }
    }

    return null;
};

// 単位が前に来るタイプかどうか
const isPrefixUnit = (unit: string): boolean => {
    return ['大さじ', '小さじ', 'カップ'].includes(unit);
};

// 同じ単位の量を合計
const aggregateAmounts = (amounts: string[]): string => {
    const unitMap = new Map<string, number>();
    const unparsedMap = new Map<string, number>();

    for (const amount of amounts) {
        const parsed = parseAmount(amount);
        if (parsed) {
            const current = unitMap.get(parsed.unit) || 0;
            unitMap.set(parsed.unit, current + parsed.value);
        } else {
            // パースできない量は回数をカウント
            const current = unparsedMap.get(amount) || 0;
            unparsedMap.set(amount, current + 1);
        }
    }

    const results: string[] = [];

    // 単位ごとの合計を文字列に変換
    for (const [unit, value] of unitMap) {
        // 小数点以下が0の場合は整数表示
        const displayValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
        // 単位が前に来るタイプは "大さじ3" 形式、そうでなければ "300g" 形式
        if (isPrefixUnit(unit)) {
            results.push(`${unit}${displayValue}`);
        } else {
            results.push(`${displayValue}${unit}`);
        }
    }

    // パースできなかったものを回数付きで追加
    for (const [amount, count] of unparsedMap) {
        if (count > 1) {
            results.push(`${amount} x ${count}`);
        } else {
            results.push(amount);
        }
    }

    return results.join(' + ');
};

export class ShoppingListService {
    constructor(
        private shoppingListRepo: ShoppingListRepository,
        private mealPlanRepo: MealPlanRepository
    ) { }

    async getShoppingList(weekStart: string, weekEnd: string): Promise<ShoppingListItem[]> {
        // 献立データを取得
        const mealPlans = await this.mealPlanRepo.findByDateRange(weekStart, weekEnd);

        // チェック状態を取得
        const checks = await this.shoppingListRepo.findChecksByWeek(weekStart);
        const checkMap = new Map(checks.map(c => [c.ingredient_name, c.is_checked === 1]));

        // 食材を集計
        const ingredientMap = new Map<string, {
            totalCost: number;
            amounts: string[];
            meals: ShoppingListItem['meals'];
        }>();

        for (const plan of mealPlans) {
            for (const ingredient of plan.ingredients) {
                const existing = ingredientMap.get(ingredient.name);
                const mealInfo = {
                    date: plan.date,
                    mealType: plan.meal_type,
                    menuName: plan.menu_name,
                    amount: ingredient.amount
                };

                if (existing) {
                    existing.amounts.push(ingredient.amount);
                    existing.totalCost += ingredient.cost;
                    existing.meals.push(mealInfo);
                } else {
                    ingredientMap.set(ingredient.name, {
                        amounts: [ingredient.amount],
                        totalCost: ingredient.cost,
                        meals: [mealInfo]
                    });
                }
            }
        }

        // ShoppingListItem配列に変換
        const items: ShoppingListItem[] = [];
        for (const [ingredientName, data] of ingredientMap) {
            items.push({
                ingredientName,
                totalAmount: aggregateAmounts(data.amounts),
                totalCost: data.totalCost,
                meals: data.meals.sort((a, b) => {
                    if (a.date !== b.date) return a.date.localeCompare(b.date);
                    const mealOrder = { breakfast: 0, lunch: 1, dinner: 2 };
                    return mealOrder[a.mealType] - mealOrder[b.mealType];
                }),
                isChecked: checkMap.get(ingredientName) || false
            });
        }

        // 名前順にソート（チェック済みは後ろに）
        items.sort((a, b) => {
            if (a.isChecked !== b.isChecked) {
                return a.isChecked ? 1 : -1;
            }
            return a.ingredientName.localeCompare(b.ingredientName);
        });

        return items;
    }

    async toggleCheck(weekStart: string, ingredientName: string, isChecked: boolean): Promise<void> {
        await this.shoppingListRepo.saveCheck(weekStart, ingredientName, isChecked);
    }

    async clearAllChecks(weekStart: string): Promise<void> {
        await this.shoppingListRepo.clearChecks(weekStart);
    }
}
