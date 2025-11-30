import React, { FC, useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { usePremium } from '../../hooks/usePremium';
import { Budget, MealPlan } from '../../types/types';
import { ServiceFactory } from '../../factories/serviceFactory';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function HomeScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();
    const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
    const [todayMeals, setTodayMeals] = useState<MealPlan[]>([]);
    const [budgetStatus, setBudgetStatus] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        const budgetService = ServiceFactory.createBudgetService();
        const mealPlanService = ServiceFactory.createMealPlanService();

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

            <View style={styles.card}>
                <Text style={styles.cardTitle}>今日の献立</Text>
                {todayMeals.length > 0 ? (
                    todayMeals.map((meal, index) =>
                        <TodayMealItems key={index} meal={meal} index={index} />
                    )
                ) : (
                    <View>
                        <Text style={styles.noText}>献立が設定されていません。</Text>
                        <TouchableOpacity
                            style={styles.generateButton}
                            onPress={() => router.push('/mealPlanGenerate')}
                        >
                            <Text style={styles.generateText}>献立を生成する</Text>
                        </TouchableOpacity>
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
        margin: 16,
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
});