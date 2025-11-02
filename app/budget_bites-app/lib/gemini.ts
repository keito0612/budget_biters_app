import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateMealPlanParams, getMealTypeJa, MealExecutionLog, RegenerateMealParams, UserPreferences } from '../types/gimi.types';
import { DateUtils } from '../utils/DateUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateMealPlan(params: GenerateMealPlanParams) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = generateMonthlyMealPlanPrompt(params);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Invalid AI response format');
    }

    const data = JSON.parse(jsonMatch[0]);

    return data;
}


export async function regenerateMeal(params: RegenerateMealParams) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = regenerateDailyMealPrompt(params);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Invalid AI response format');
    }

    const data = JSON.parse(jsonMatch[0]);

    return data;
}

const generateMonthlyMealPlanPrompt = (params: GenerateMealPlanParams) => `
あなたは栄養士かつ料理研究家です。以下の条件で1ヶ月分の献立を作成してください。

【条件】
- 対象: ${params.year}年${params.month}月 (${DateUtils.getDaysInMonth(params.year, params.month)}日間)
- 月間予算: ¥${params.budget}
- 1日3食 (朝・昼・晩)
- 味付け設定: ${JSON.stringify(params.preferences.taste_preferences)}
- アレルギー: ${params.preferences.allergies.join(', ') || 'なし'}
- 食事制限: ${params.preferences.dietary_restrictions.join(', ') || 'なし'}
- 調理レベル: ${params.preferences.cooking_skill_level}

【過去の実行ログ】
${params.pastLogs ? formatPastLogs(params.pastLogs) : '初回生成'}

【出力形式】
以下のJSON形式で返してください:

{
  "mealPlans": [
    {
      "date": "YYYY-MM-DD",
      "breakfast": {
        "menuName": "献立名",
        "ingredients": [
          { "name": "材料名", "amount": "分量", "cost": 金額(整数) }
        ],
        "recipeSteps": ["手順1", "手順2", ...],
        "estimatedCost": 合計金額,
        "cookingTime": 調理時間(分),
        "nutrition": {
          "calories": カロリー,
          "protein": たんぱく質(g),
          "carbs": 炭水化物(g),
          "fat": 脂質(g)
        }
      },
      "lunch": { ... },
      "dinner": { ... }
    },
    ...
  ],
  "totalCost": 月間合計金額,
  "tips": ["節約のコツ1", "栄養バランスのポイント2", ...]
}

【重要な制約】
- 予算内に収める
- アレルギー食材は絶対に使用しない
- 調理レベルに合った難易度
- 栄養バランスを考慮
- 季節の食材を活用
- 同じメニューは週に1回まで
`;

function regenerateDailyMealPrompt(params: RegenerateMealParams): string {
    const mealType = getMealTypeJa(params.mealType);
    return regenerateDailyMealPromptText(params, mealType);
}

const regenerateDailyMealPromptText = (params: RegenerateMealParams, mealTypeText: string) => {
    return (`以下の献立を別の献立に変更してください。

【現在の献立】
日付: ${params.date}
食事: ${mealTypeText}
メニュー: ${params.currentMeal.menu_name}
費用: ¥${params.currentMeal.estimated_cost}
材料: ${params.currentMeal.ingredients.map(i => i.name).join(', ')}

【条件】
- 残り予算: ¥${params.remainingBudget}
- 同じ食材は可能な限り避ける
- 味付け・アレルギー設定は以下を維持:
  - 塩味: ${params.preferences.taste_preferences.salty}/10
  - 甘味: ${params.preferences.taste_preferences.sweet}/10
  - 辛味: ${params.preferences.taste_preferences.spicy}/10
  - アレルギー: ${params.preferences.allergies.join(', ') || 'なし'}
- 費用は現在と同程度か安く
- 調理レベル: ${params.preferences.cooking_skill_level}

【出力形式】
以下のJSON形式で返してください（コードブロックなし、純粋なJSONのみ）:

{
  "menuName": "新しい献立名",
  "ingredients": [
    { "name": "材料名", "amount": "分量", "cost": 金額 }
  ],
  "recipeSteps": ["手順1", "手順2"],
  "estimatedCost": 金額,
  "cookingTime": 時間(分),
  "nutrition": {
    "calories": カロリー,
    "protein": たんぱく質(g),
    "carbs": 炭水化物(g),
    "fat": 脂質(g)
  }
}`);
}



/**
 * 過去ログをフォーマット
 */
function formatPastLogs(logs: MealExecutionLog[]): string {
    if (!logs || logs.length === 0) {
        return '過去のログなし（初回生成）';
    }
    //実行済みログのみ
    const executedLogs = logs.filter(log => log.executed);

    if (executedLogs.length === 0) {
        return '実行済みのログなし';
    }

    // 満足度別に分類
    const highSatisfaction = executedLogs.filter(log => (log.satisfaction_rating || 0) >= 4);
    const lowSatisfaction = executedLogs.filter(log => (log.satisfaction_rating || 0) <= 2);

    let formatted = '【過去30日間の実績】\n\n';

    if (highSatisfaction.length > 0) {
        formatted += '好評だったメニュー（満足度4以上）:\n';
        highSatisfaction.slice(0, 10).forEach(log => {
            const mealType = getMealTypeJa(log.meal_type);
            formatted += `- ${log.date} ${mealType}: ${log.actual_menu_name || '不明'} (満足度: ${log.satisfaction_rating}/5)\n`;
        });
        formatted += '\n';
    }
    if (lowSatisfaction.length > 0) {
        formatted += '不評だったメニュー（満足度2以下）- これらは避けてください:\n';
        lowSatisfaction.slice(0, 10).forEach(log => {
            const mealType = getMealTypeJa(log.meal_type);
            formatted += `- ${log.date} ${mealType}: ${log.actual_menu_name || '不明'} (満足度: ${log.satisfaction_rating}/5)`;
            if (log.notes) {
                formatted += ` - メモ: ${log.notes}`;
            }
            formatted += '\n';
        });
    }

    return formatted;
}