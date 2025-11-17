

import { Config } from '../constants/config';
import { Budget, MealPlan, Preferences } from '../types/types';
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from '@google/generative-ai';
export interface GeminiMealPlanRequest {
  month: string;
  budget: Budget;
  preferences: Preferences;
  existingPlans?: MealPlan[];
}

export interface GeminiResponse {
  plans: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>[];
}


export class GeminiService {
  private static apiKey = Config.gemini.apiKey;
  private static url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=` + this.apiKey;

  static async generateMonthlyMealPlan(
    request: GeminiMealPlanRequest
  ): Promise<GeminiResponse> {
    const prompt = this.buildMonthlyPrompt(request);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 32768,
            responseMimeType: 'application/json', // JSON形式を強制
          },
        }),
      });
      // エラーチェック（最初の1回だけ）
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      const candidate = data.candidates[0];

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('content.parts が空:', JSON.stringify(candidate, null, 2));
        throw new Error('Gemini APIのレスポンス形式が不正です');
      }

      const text = candidate.content.parts[0].text;
      console.log('生成されたテキスト長:', text.length);
      console.log('テキストの最初の部分:', text.substring(0, 200));

      // responseMimeType: 'application/json' を指定しているので、
      // 通常は直接JSONが返される
      let result;
      try {
        // 直接JSONとしてパース
        result = JSON.parse(text);
      } catch (e) {
        // パース失敗時は ```json ``` で囲まれている可能性
        console.log('直接パース失敗。Markdown形式を試行');
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          console.error('JSON抽出失敗。テキスト全体:', text);
          throw new Error('JSONレスポンスの抽出に失敗しました');
        }

        const jsonText = jsonMatch[1] || jsonMatch[0];
        console.log('抽出されたJSON:', jsonText.substring(0, 200));
        result = JSON.parse(jsonText);
      }

      // 結果の検証
      if (!result.plans || !Array.isArray(result.plans)) {
        console.error('plans配列がありません:', result);
        throw new Error('レスポンスにplans配列がありません');
      }
      console.log(result);
      return result;

    } catch (error) {
      throw error;
    }
  }


  static async regenerateDailyMeal(
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    request: GeminiMealPlanRequest
  ): Promise<Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>> {
    console.log('=== Gemini 日別献立生成 ===');
    console.log(`日付: ${date}, 食事: ${mealType}`);

    if (!this.apiKey) {
      throw new Error('Gemini APIキーが設定されていません');
    }

    const prompt = this.buildDailyPrompt(date, mealType, request);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      // 直接JSONパースを試行
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        // Markdown形式の場合
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('JSONレスポンスの解析に失敗しました');
        }
        result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }

      console.log('日別献立生成成功');
      return result;

    } catch (error) {
      console.error('日別献立生成エラー:', error);
      throw error;
    }
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