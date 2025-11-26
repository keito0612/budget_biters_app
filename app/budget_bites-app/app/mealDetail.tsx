import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { usePremium } from '../hooks/usePremium';
import { ServiceFactory } from '../factories/serviceFactory';
import { MealLog, MealPlan } from '../types/types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { LoadingOverlay } from '../components/LoadingOverlay';

export default function MealDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { isPremium } = usePremium();

    const [meal, setMeal] = useState<MealPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [actualCost, setActualCost] = useState('');
    const [notes, setNotes] = useState('');
    const [regenerating, setRegenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mealLog, setMealLog] = useState<MealLog | null>(null);
    const mealLogRepo = ServiceFactory.getMealLogRepository();

    useEffect(() => {
        loadMealDetail();
    }, []);

    const loadMealDetail = async () => {
        try {
            const mealPlanRepo = ServiceFactory.getMealPlanRepository();
            const mealData = await mealPlanRepo.findByDateAndMealType(
                params.date as string,
                params.mealType as 'breakfast' | 'lunch' | 'dinner'
            );
            const mealLogData = await mealLogRepo.findByMonth(params.date as string, params.mealType as 'breakfast' | 'lunch' | 'dinner');
            if (mealLogData[0] !== undefined) {
                setActualCost(mealLogData[0].actual_cost.toString());
                setNotes(mealLogData[0].notes!);
            }
            setMeal(mealData);
        } catch (error) {
            console.log(error);
            Alert.alert('エラー', '献立の取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleLogMeal = async () => {
        if (!meal) return;

        const cost = parseInt(actualCost);
        if (isNaN(cost) || cost < 0) {
            Alert.alert('エラー', '有効な金額を入力してください');
            return;
        }

        try {
            await mealLogRepo.save({
                date: meal.date,
                meal_type: meal.meal_type,
                menu_name: meal.menu_name,
                actual_cost: cost,
                notes,
            });
            Alert.alert('成功', '実行ログを記録しました', [
                { text: 'OK', onPress: () => { } },
            ]);
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        }
    };

    const handleRegenerate = async () => {
        // if (!isPremium) {
        //     Alert.alert('Premium限定', 'AI再提案はPremium会員限定機能です');
        //     return;
        // }

        if (!meal) return;

        Alert.alert(
            '確認',
            'この献立を再生成しますか？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '再生成',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const mealPlanService = ServiceFactory.createMealPlanService();
                            await mealPlanService.regenerateDailyMeal(meal.date, meal.meal_type);

                            Alert.alert('成功', '献立を再生成しました');
                            await loadMealDetail(); // 再読み込み
                        } catch (error: any) {
                            Alert.alert('エラー', error.message);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!meal) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backButton}>← 戻る</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.errorText}>献立が見つかりません</Text>
            </View>
        );
    }

    const mealTypeJa =
        meal.meal_type === 'breakfast' ? '🌅 朝食' : meal.meal_type === 'lunch' ? '☀️ 昼食' : '🌙 夕食';

    return (
        <>
            <KeyboardAwareScrollView style={styles.container}>
                {/* メイン情報 */}
                <View style={styles.mainInfo}>
                    <Text style={styles.mealType}>{mealTypeJa}</Text>
                    <Text style={styles.menuName}>{meal.menu_name}</Text>

                    <View style={styles.metaInfo}>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>推定費用</Text>
                            <Text style={styles.metaValue}>¥{meal.estimated_cost.toLocaleString()}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>調理時間</Text>
                            <Text style={styles.metaValue}>{meal.cooking_time}分</Text>
                        </View>
                    </View>
                </View>

                {/* 材料 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🛒 材料</Text>
                    <View style={styles.ingredientsContainer}>
                        {meal.ingredients.map((ingredient, index) => (
                            <View key={index} style={styles.ingredientItem}>
                                <View style={styles.ingredientMain}>
                                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                    <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
                                </View>
                                <Text style={styles.ingredientCost}>¥{ingredient.cost}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.totalCost}>
                        <Text style={styles.totalCostLabel}>材料費合計</Text>
                        <Text style={styles.totalCostValue}>
                            ¥
                            {meal.ingredients
                                .reduce((sum, ing) => sum + ing.cost, 0)
                                .toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* 作り方 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👨‍🍳 作り方</Text>
                    {meal.recipe.map((step, index) => (
                        <View key={index} style={styles.recipeStep}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                        </View>
                    ))}
                </View>

                {/* 栄養情報 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 栄養情報</Text>
                    <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{meal.nutrition.calories}</Text>
                            <Text style={styles.nutritionLabel}>カロリー</Text>
                            <Text style={styles.nutritionUnit}>kcal</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{meal.nutrition.protein}</Text>
                            <Text style={styles.nutritionLabel}>タンパク質</Text>
                            <Text style={styles.nutritionUnit}>g</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{meal.nutrition.fat}</Text>
                            <Text style={styles.nutritionLabel}>脂質</Text>
                            <Text style={styles.nutritionUnit}>g</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{meal.nutrition.carbs}</Text>
                            <Text style={styles.nutritionLabel}>炭水化物</Text>
                            <Text style={styles.nutritionUnit}>g</Text>
                        </View>
                    </View>
                </View>

                {/* 実行ログ記録 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✅ 実行ログを記録</Text>
                    <View style={styles.logForm}>
                        <Text style={styles.inputLabel}>実際にかかった費用</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="例: 450"
                            keyboardType="numeric"
                            value={actualCost}
                            onChangeText={setActualCost}
                        />

                        <Text style={styles.inputLabel}>メモ（任意）</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="例: 美味しかった、次回は調味料を減らす"
                            multiline
                            numberOfLines={3}
                            value={notes}
                            onChangeText={setNotes}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity style={styles.logButton} onPress={handleLogMeal}>
                            <Text style={styles.logButtonText}>記録する</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* AI再提案ボタン */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[
                            styles.regenerateButton,
                            regenerating && styles.buttonDisabled,
                        ]}
                        onPress={handleRegenerate}
                        disabled={regenerating}
                    >
                        <View style={styles.buttonContent}>
                            <Ionicons name="sparkles-outline" size={20} color="white" />
                            <Text style={styles.generateText}>献立を再生成</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* 作成日時 */}
                {meal.created_at && (
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>作成日時: {meal.created_at}</Text>
                    </View>
                )}
            </KeyboardAwareScrollView >
            <LoadingOverlay visible={isLoading} message='献立生成中' />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    headerDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    mainInfo: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    mealType: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    menuName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    metaInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        columnGap: 24
    },
    metaItem: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    section: {
        backgroundColor: 'white',
        marginTop: 16,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    ingredientsContainer: {
        marginBottom: 12,
    },
    ingredientItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    ingredientMain: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    ingredientAmount: {
        fontSize: 14,
        color: '#666',
    },
    ingredientCost: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    totalCost: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
        marginTop: 4,
    },
    totalCostLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalCostValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    recipeStep: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        paddingTop: 4,
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    nutritionItem: {
        width: '47%',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    nutritionValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    nutritionLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    nutritionUnit: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    logForm: {
        gap: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    logButton: {
        backgroundColor: '#34C759',
        padding: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    logButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    regenerateButton: {
        backgroundColor: '#FFD700',
        padding: 16,
        borderRadius: 8,
    },
    regenerateButtonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
    errorText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 40,
    },
    generateText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
});