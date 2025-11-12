import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BudgetService, MealPlanService } from '../../lib/services';
import { usePremium } from '../../hooks/usePremium';
import { PremiumBadge } from '../../components/PremiumBadge';
import type { Budget, MealPlan } from '../../lib/types';

export default function HomeScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();
    const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
    const [todayMeals, setTodayMeals] = useState<MealPlan[]>([]);
    const [budgetStatus, setBudgetStatus] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const budgetService = new BudgetService();
        const mealPlanService = new MealPlanService();

        const budget = await budgetService.getCurrentMonthBudget();
        setCurrentBudget(budget);

        if (budget) {
            const today = new Date().toISOString().substring(0, 7);
            const status = await budgetService.getBudgetStatus(today);
            setBudgetStatus(status);
        }

        const meals = await mealPlanService.getTodaysMeals();
        setTodayMeals(meals);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>BudgetMenu</Text>
                {isPremium && <PremiumBadge />}
            </View>

            {currentBudget ? (
                <>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>今月の予算</Text>
                        <Text style={styles.amount}>¥{currentBudget.total_budget.toLocaleString()}</Text>
                        <Text style={styles.daily}>
                            1日あたり: ¥{currentBudget.daily_budget.toLocaleString()}
                        </Text>
                    </View>

                    {budgetStatus && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>使用状況</Text>
                            <Text style={styles.spent}>使用済み: ¥{budgetStatus.spent.toLocaleString()}</Text>
                            <Text style={styles.remaining}>
                                残り: ¥{budgetStatus.remaining.toLocaleString()}
                            </Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[styles.progress, { width: `${Math.min(budgetStatus.percentage, 100)}%` }]}
                                />
                            </View>
                        </View>
                    )}
                </>
            ) : (
                <TouchableOpacity
                    style={styles.setupButton}
                    onPress={() => router.push('/preference-setup')}
                >
                    <Text style={styles.setupText}>初期設定を始める</Text>
                </TouchableOpacity>
            )}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>今日の献立</Text>
                {todayMeals.length > 0 ? (
                    todayMeals.map((meal, index) => (
                        <View key={index} style={styles.mealItem}>
                            <Text style={styles.mealType}>
                                {meal.meal_type === 'breakfast'
                                    ? '🌅 朝食'
                                    : meal.meal_type === 'lunch'
                                        ? '☀️ 昼食'
                                        : '🌙 夕食'}
                            </Text>
                            <Text style={styles.mealName}>{meal.menu_name}</Text>
                            <Text style={styles.mealCost}>¥{meal.estimated_cost}</Text>
                        </View>
                    ))
                ) : (
                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={() => router.push('/meal-plan-generate')}
                    >
                        <Text style={styles.generateText}>献立を生成する</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/calendar')}>
                    <Text style={styles.actionIcon}>📅</Text>
                    <Text style={styles.actionText}>カレンダー</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/meal-plan-generate')}
                >
                    <Text style={styles.actionIcon}>🤖</Text>
                    <Text style={styles.actionText}>AI献立生成</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/expense')}>
                    <Text style={styles.actionIcon}>💰</Text>
                    <Text style={styles.actionText}>支出記録</Text>
                </TouchableOpacity>
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
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
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
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#eee',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: '#007AFF',
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
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    mealCost: {
        fontSize: 14,
        color: '#007AFF',
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
});