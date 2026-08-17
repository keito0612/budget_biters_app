import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ServiceFactory } from '../factories/serviceFactory';
import { GenerationProgress } from '../services/mealPlanService';

interface MealPlanGenerationContextType {
    progress: GenerationProgress;
    isGenerating: boolean;
    startGeneration: (month: string, onFirstWeekComplete: () => void) => Promise<void>;
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

    const startGeneration = useCallback(async (
        month: string,
        onFirstWeekComplete: () => void
    ): Promise<void> => {
        if (isGenerating) {
            return;
        }

        setIsGenerating(true);
        isCancelledRef.current = false;

        try {
            const mealPlanService = ServiceFactory.createMealPlanService();
            const budgetService = ServiceFactory.createBudgetService();

            const currentBudget = await budgetService.getCurrentBudget();
            if (currentBudget?.total_budget === 0) {
                throw new Error('初期設定をしてください。');
            }

            await mealPlanService.generateMonthlyPlanProgressively(
                month,
                (newProgress) => {
                    if (!isCancelledRef.current) {
                        setProgress(newProgress);
                    }
                },
                () => {
                    if (!isCancelledRef.current) {
                        onFirstWeekComplete();
                    }
                }
            );

        } catch (error: any) {
            setProgress(prev => ({
                ...prev,
                status: 'error',
                error: error.message,
            }));
            throw error;
        } finally {
            setIsGenerating(false);
        }
    }, [isGenerating]);

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
                startGeneration,
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
