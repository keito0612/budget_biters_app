import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ServiceFactory } from '../factories/serviceFactory';
import { GenerationProgress } from '../services/mealPlanService';

interface MealPlanGenerationContextType {
    progress: GenerationProgress;
    isGenerating: boolean;
    startBackgroundGeneration: (month: string) => Promise<void>;
    cancelGeneration: () => void;
}

const initialProgress: GenerationProgress = {
    totalWeeks: 0,
    completedWeeks: 0,
    currentWeek: 0,
    status: 'idle',
};

const MealPlanGenerationContext = createContext<MealPlanGenerationContextType | undefined>(undefined);

export function MealPlanGenerationProvider({ children }: { children: React.ReactNode }) {
    const [progress, setProgress] = useState<GenerationProgress>(initialProgress);
    const [isGenerating, setIsGenerating] = useState(false);
    const isCancelledRef = useRef(false);

    // バックグラウンドで1ヶ月分を生成し、完了時に通知を送信
    const startBackgroundGeneration = useCallback(async (month: string): Promise<void> => {
        if (isGenerating) {
            return;
        }

        setIsGenerating(true);
        isCancelledRef.current = false;

        // 初期状態を設定
        setProgress({
            totalWeeks: 4, // 仮の値、実際の値は生成時に更新される
            completedWeeks: 0,
            currentWeek: 1,
            status: 'generating',
        });

        // 非同期で生成を開始（awaitしない）
        generateInBackground(month);
    }, [isGenerating]);

    const generateInBackground = async (month: string) => {
        try {
            const mealPlanService = ServiceFactory.createMealPlanService();
            const notificationService = ServiceFactory.createNotificationService();

            await mealPlanService.generateMonthlyPlanProgressively(
                month,
                (newProgress) => {
                    if (!isCancelledRef.current) {
                        setProgress(newProgress);
                    }
                },
                () => {
                    // 最初の週完了コールバック（今は使わない）
                }
            );

            // 生成完了 - 通知を送信
            if (!isCancelledRef.current) {
                setProgress(prev => ({
                    ...prev,
                    status: 'completed',
                }));

                await notificationService.sendImmediateNotification({
                    title: '献立の生成が完了しました 🎉',
                    body: `${month}の献立が完成しました。カレンダーで確認してください。`,
                    data: { type: 'meal_plan_complete', month },
                });
            }

        } catch (error: any) {
            if (!isCancelledRef.current) {
                setProgress(prev => ({
                    ...prev,
                    status: 'error',
                    error: error.message,
                }));

                // エラー通知
                const notificationService = ServiceFactory.createNotificationService();
                await notificationService.sendImmediateNotification({
                    title: '献立の生成に失敗しました',
                    body: error.message || 'エラーが発生しました。再度お試しください。',
                    data: { type: 'meal_plan_error' },
                });
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const cancelGeneration = useCallback(() => {
        isCancelledRef.current = true;
        setIsGenerating(false);
        setProgress(initialProgress);
    }, []);

    return (
        <MealPlanGenerationContext.Provider
            value={{
                progress,
                isGenerating,
                startBackgroundGeneration,
                cancelGeneration,
            }}
        >
            {children}
        </MealPlanGenerationContext.Provider>
    );
}

export function useMealPlanGeneration() {
    const context = useContext(MealPlanGenerationContext);
    if (context === undefined) {
        throw new Error('useMealPlanGeneration must be used within a MealPlanGenerationProvider');
    }
    return context;
}
