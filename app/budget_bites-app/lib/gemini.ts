

import { Config } from '../constants/config';
import { Budget, MealPlan, Preferences } from '../types/types';
import { GoogleGenAI } from "@google/genai";

export interface GeminiMealPlanRequest {
  month: string;
  budget: Budget;
  preferences: Preferences;
  existingPlans?: MealPlan[];
}

export interface GeminiResponse {
  plans: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>[];
}

// const ai = new GoogleGenAI({});

export class GeminiService {
  private static apiKey = Config.gemini.apiKey;
  private static endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`;

  static async generateMonthlyMealPlan(
    request: GeminiMealPlanRequest
  ): Promise<GeminiResponse> {
    const prompt = this.buildMonthlyPrompt(request);
    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSONレスポンスの解析に失敗しました');
    }

    const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return result;
  }

  static async regenerateDailyMeal(
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    request: GeminiMealPlanRequest
  ): Promise<Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>> {
    const prompt = this.buildDailyPrompt(date, mealType, request);

    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSONレスポンスの解析に失敗しました');
    }

    const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return result;
  }

  private static buildMonthlyPrompt(request: GeminiMealPlanRequest): string {
    const { month, budget, preferences } = request;
    const daysInMonth = new Date(
      parseInt(month.split('-')[0]),
      parseInt(month.split('-')[1]),
      0
    ).getDate();

    return `あなたは栄養士兼料理人のAIアシスタントです。
以下の条件に基づいて、${month}の1ヶ月分の献立を生成してください。

【条件】
- 月間予算: ¥${budget.total_budget.toLocaleString()}
- 1日あたり予算: ¥${budget.daily_budget.toLocaleString()}
- 味付け: ${preferences.taste_preference === 'light' ? 'あっさり' : preferences.taste_preference === 'balanced' ? 'バランス' : '濃いめ'}
- アレルギー: ${preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'なし'}
- 避けたい食材: ${preferences.avoid_ingredients.length > 0 ? preferences.avoid_ingredients.join(', ') : 'なし'}
- 日数: ${daysInMonth}日分

【出力形式】
以下のJSON形式で、${daysInMonth}日分 × 3食（朝・昼・晩）の献立を返してください。

\`\`\`json
{
  "plans": [
    {
      "date": "${month}-01",
      "meal_type": "breakfast",
      "menu_name": "和風トースト",
      "ingredients": [
        { "name": "食パン", "amount": "1枚", "cost": 30 },
        { "name": "バター", "amount": "10g", "cost": 20 }
      ],
      "recipe": ["食パンをトーストする", "バターを塗る"],
      "nutrition": { "calories": 250, "protein": 5, "fat": 8, "carbs": 40 },
      "cooking_time": 5,
      "estimated_cost": 50
    }
  ]
}
\`\`\``;
  }

  private static buildDailyPrompt(
    date: string,
    mealType: string,
    request: GeminiMealPlanRequest
  ): string {
    const { budget, preferences } = request;
    const mealTypeJa =
      mealType === 'breakfast' ? '朝食' : mealType === 'lunch' ? '昼食' : '夕食';

    return `あなたは栄養士兼料理人のAIアシスタントです。
以下の条件に基づいて、${date}の${mealTypeJa}を1つ生成してください。

【条件】
- 1食あたり予算: ¥${Math.floor(budget.daily_budget / 3)}
- 味付け: ${preferences.taste_preference === 'light' ? 'あっさり' : preferences.taste_preference === 'balanced' ? 'バランス' : '濃いめ'}
- アレルギー: ${preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'なし'}
- 避けたい食材: ${preferences.avoid_ingredients.length > 0 ? preferences.avoid_ingredients.join(', ') : 'なし'}

【出力形式】
以下のJSON形式で返してください。

\`\`\`json
{
  "date": "${date}",
  "meal_type": "${mealType}",
  "menu_name": "メニュー名",
  "ingredients": [{ "name": "材料名", "amount": "分量", "cost": 価格 }],
  "recipe": ["手順1", "手順2"],
  "nutrition": { "calories": 0, "protein": 0, "fat": 0, "carbs": 0 },
  "cooking_time": 0,
  "estimated_cost": 0
}
\`\`\``;
  }
}