import React, { FC, useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { usePremium } from '../../hooks/usePremium';
import { Budget, MealPlan } from '../../types/types';
import { ServiceFactory } from '../../factories/serviceFactory';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { AdmobService } from '../../services/admobService';
import * as Notifications from 'expo-notifications';
import { NotificationData, ScheduleData } from '../../repositories/notificationRepository';
import { DateUtils } from '../../utils/DateUtils';
import BackgroundFetch, { HeadlessEvent } from 'react-native-background-fetch';
import { useMealPlanGeneration } from '../../contexts/MealPlanGenerationContext';



export default function HomeScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();
    const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
    const [todayMeals, setTodayMeals] = useState<MealPlan[]>([]);
    const [budgetStatus, setBudgetStatus] = useState<any>(null);
    const { progress, isGenerating } = useMealPlanGeneration();
    const [lastCompletedWeeks, setLastCompletedWeeks] = useState(0);
    const budgetService = ServiceFactory.createBudgetService();
    const mealPlanService = ServiceFactory.createMealPlanService();
    const admodService = ServiceFactory.createAdmobService();
    const notificationService = ServiceFactory.createNotificationService();
    const backgroundService = ServiceFactory.createBackgroundService();

    // 生成進捗が変わったらデータを再読み込み
    useEffect(() => {
        if (progress.completedWeeks > lastCompletedWeeks) {
            setLastCompletedWeeks(progress.completedWeeks);
            loadData();
        }
        // 生成完了時にもデータを再読み込み
        if (progress.status === 'completed') {
            loadData();
            setLastCompletedWeeks(0); // リセット
        }
    }, [progress.completedWeeks, progress.status]);

    useFocusEffect(
        useCallback(() => {
            loadData();
            initialize();
        }, [])
    );

    const loadData = async () => {
        const budget = await budgetService.getCurrentBudget();
        setCurrentBudget(budget);

        if (budget) {
            const today = new Date().toISOString().substring(0, 7);
            const status = await budgetService.getBudgetStatus(today);
            setBudgetStatus(status);
        }

        const meals = await mealPlanService.getTodaysMeals();
        //順番がおかしいのでソートする。
        const sortedMeals = meals.sort((a: MealPlan, b: MealPlan) => {
            const order = ["breakfast", "lunch", "dinner"];
            return order.indexOf(a.meal_type) - order.indexOf(b.meal_type);
        });
        setTodayMeals(sortedMeals);
    };

    const initialize = async () => {
        await admodService.initializeAds();
        await notificationService.initializeNotification();
        await backgroundService.initBackgroundFetch(async () => {
            await mealPlanService.updateMealPlanTodayNotifications();
        });
    }

    const MonthBudgetCard = ({ currentBudget }: { currentBudget: Budget | null }) => {
        return (
            <View style={styles.card}>
                <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>月間食費予算</Text>
                    <TouchableOpacity onPress={() => {
                        router.push('/budgetEdit');
                    }}>
                        <MaterialCommunityIcons name="pencil-circle-outline" size={24} color='#007AFF' />
                    </TouchableOpacity>
                </View>
                <Text style={styles.amount}>
                    ¥{currentBudget?.total_budget.toLocaleString()}
                </Text>
                <Text style={styles.daily}>
                    1日あたり: ¥{currentBudget?.daily_budget.toLocaleString()}
                </Text>
            </View >
        );
    };

    const TodayMealItems = ({ meal, index }: { meal: MealPlan, index: number }) => {
        return (
            <TouchableOpacity
                key={index}
                style={styles.mealItem}
                onPress={() => router.push({
                    pathname: '/mealDetail',
                    params: {
                        date: meal.date,
                        mealType: meal.meal_type,
                    },
                })}
            >
                <Text style={styles.mealType}>
                    {meal.meal_type === 'breakfast' ? '🌅 朝食' :
                        meal.meal_type === 'lunch' ? '☀️ 昼食' : '🌙 夕食'}
                </Text>
                <Text style={styles.mealName}>{meal.menu_name}</Text>
                <View style={styles.mealCostContainer}>
                    <Text style={styles.mealCostText}>金額：</Text>
                    <Text style={styles.mealCost}> ¥{meal.estimated_cost}</Text>
                </View>
                <Text style={styles.viewDetail}>詳細を見る →</Text>
            </TouchableOpacity>
        );
    }

    const GenerationProgressIndicator = () => {
        if (!isGenerating || progress.status !== 'generating') {
            return null;
        }

        return (
            <View style={styles.progressIndicator}>
                <View style={styles.progressHeader}>
                    <Ionicons name="sync" size={16} color="#007AFF" />
                    <Text style={styles.progressIndicatorText}>
                        献立を生成中... ({progress.completedWeeks}/{progress.totalWeeks}週)
                    </Text>
                </View>
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            { width: `${(progress.completedWeeks / progress.totalWeeks) * 100}%` }
                        ]}
                    />
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {currentBudget?.total_budget !== 0 ? (
                <>
                    <MonthBudgetCard currentBudget={currentBudget} />
                </>
            ) : (
                <TouchableOpacity
                    style={styles.setupButton}
                    onPress={() => router.push('/preferenceSetUp')}
                >
                    <Text style={styles.setupText}>初期設定を始める</Text>
                </TouchableOpacity>
            )}

            <View style={[styles.card, { paddingBottom: 8, marginBottom: 70 }]}>
                <Text style={styles.cardTitle}>今日の献立</Text>
                <GenerationProgressIndicator />
                {todayMeals.length > 0 ? (
                    todayMeals.map((meal, index) =>
                        <TodayMealItems key={index} meal={meal} index={index} />
                    )
                ) : (
                    <View>
                        {!isGenerating && (
                            <>
                                <Text style={styles.noText}>献立が設定されていません。</Text>
                                <TouchableOpacity
                                    style={styles.generateButton}
                                    onPress={() => router.push('/mealPlanGenerate')}
                                >
                                    <Text style={styles.generateText}>献立を生成する</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'white',
        margin: 12,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    amount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    daily: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    spent: {
        fontSize: 16,
        marginBottom: 4,
    },
    remaining: {
        fontSize: 16,
        color: '#34C759',
    },
    setupButton: {
        margin: 16,
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
    },
    setupText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    mealItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    mealType: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    mealCostContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 4
    },
    mealCostText: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    mealCost: {
        fontSize: 14,
        color: '#666',
        marginTop: 2
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    generateButton: {
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        marginTop: 12,
    },
    generateText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        margin: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    noText: {
        paddingVertical: 16,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginVertical: 8,
    },
    viewDetail: {
        fontSize: 14,
        color: '#007AFF',
        marginTop: 4,
    },
    progressIndicator: {
        backgroundColor: '#E8F4FD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    progressIndicatorText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: '#D0E4F5',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
});