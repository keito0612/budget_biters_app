import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ServiceFactory } from '../factories/serviceFactory';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Budget } from '../types/types';


export default function BudgetEditScreen() {
    const router = useRouter();
    const [budget, setBudget] = useState('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentMonth, setCurrentMonth] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const budgetService = ServiceFactory.createBudgetService();
            const budgetData = await budgetService.getCurrentBudget();
            if (budgetData != null) {
                setBudget(budgetData.total_budget.toString());
            }
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        const today = new Date();
        setCurrentMonth(today.toISOString().substring(0, 7));
    }, []);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const mealPlanService = ServiceFactory.createMealPlanService();
            await mealPlanService.generateMonthlyPlan(currentMonth);

            Alert.alert('成功', '献立を再生成しました！', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        } finally {
            setIsLoading(false);
        }
    };



    const handleSubmit = async () => {
        const budgetNum = parseInt(budget);
        if (!budgetNum || budgetNum < 10000) {
            Alert.alert('エラー', '有効な予算を入力してください（最低 ¥10,000）');
            return;
        }

        try {
            const budgetService = ServiceFactory.createBudgetService();
            await budgetService.updateBudget(budgetNum);
            Alert.alert('成功', '予算を変更しましたので、献立を再生成します。', [
                {
                    text: 'OK', onPress: async () => {
                        await handleGenerate();
                    }
                },
            ]);
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        }
    };

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.label}>💰 月間食費予算</Text>
                    <Text style={styles.description}>
                        1ヶ月の食費予算を入力してください
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="例: 30000"
                        keyboardType="numeric"
                        value={budget}
                        onChangeText={setBudget}
                    />
                    {budget && parseInt(budget) > 0 && (
                        <Text style={styles.hint}>
                            1日あたり: ¥{Math.floor(parseInt(budget) / 30).toLocaleString()}
                        </Text>
                    )}
                </View>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>設定を保存</Text>
                </TouchableOpacity>
            </ScrollView>
            <LoadingOverlay visible={isLoading} message="献立を生成中" />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
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
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    hint: {
        marginTop: 8,
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    tasteOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    tasteButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'white',
    },
    tasteButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    tasteText: {
        textAlign: 'center',
        color: '#333',
        fontWeight: '600',
    },
    tasteTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    selectedContainer: {
        marginBottom: 16,
    },
    selectedLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    chipText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    chipRemove: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    optionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'white',
    },
    optionButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    optionText: {
        fontSize: 14,
        color: '#333',
    },
    optionTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    customInput: {
        flexDirection: 'row',
        gap: 8,
    },
    customInputField: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    addButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    submitButton: {
        margin: 16,
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    submitText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
});