import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { usePremium } from '../hooks/usePremium';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { ServiceFactory } from '../factories/serviceFactory';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlanGeneration } from '../contexts/MealPlanGenerationContext';

export default function MealPlanGenerateScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('献立を生成中');
    const { progress, isGenerating, startGeneration } = useMealPlanGeneration();

    useFocusEffect(() => {
        const today = new Date();
        setCurrentMonth(today.toISOString().substring(0, 7));
    });

    // 進捗に応じてメッセージを更新
    useEffect(() => {
        if (isGenerating && progress.status === 'generating') {
            if (progress.currentWeek === 1) {
                setLoadingMessage('今週の献立を生成中...');
            } else {
                setLoadingMessage(`献立を生成中... (第${progress.currentWeek}週/${progress.totalWeeks}週)`);
            }
        }
    }, [isGenerating, progress]);

    const generateMonthlyPlan = async () => {
        setLoading(true);
        setLoadingMessage('今週の献立を生成中...');

        try {
            const budgetService = ServiceFactory.createBudgetService();
            const currentBudget = await budgetService.getCurrentBudget();

            if (currentBudget?.total_budget === 0) {
                setLoading(false);
                Alert.alert('初期設定をしてください。', '', [
                    { text: 'OK', onPress: () => { } }
                ]);
                return;
            }

            await startGeneration(currentMonth, () => {
                // 最初の週が完了したらアラートを表示して画面遷移
                setLoading(false);
                Alert.alert(
                    '今週の献立が完成しました',
                    '残りの週はバックグラウンドで生成中です。',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        },
                    ]
                );
            });

        } catch (error: any) {
            setLoading(false);
            Alert.alert('エラー', error.message, [
                { text: 'OK', onPress: () => { } },
            ]);
        }
    }

    const handleGenerate = async () => {
        await generateMonthlyPlan();
    };

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>対象月</Text>
                    <Text style={styles.value}>{currentMonth}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>段階的生成について</Text>
                    <Text style={styles.infoText}>
                        献立は週単位で生成されます。{'\n'}
                        今週分が完成次第すぐに表示され、{'\n'}
                        残りはバックグラウンドで生成されます。
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.generateButton, (loading || isGenerating) && styles.buttonDisabled]}
                    onPress={handleGenerate}
                    disabled={loading || isGenerating}
                >
                    <View style={styles.buttonContent}>
                        <Ionicons name="sparkles-outline" size={20} color="white" />
                        <Text style={styles.generateText}>献立を生成する</Text>
                    </View>
                </TouchableOpacity>
                <LoginRequiredModal visible={showLoginModal} onClose={() => setShowLoginModal(false)} />
            </ScrollView>

            <LoadingOverlay
                title={loadingMessage}
                visible={loading}
                message={"今週の献立が完成次第、すぐに表示されます。"}
            />
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
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    value: {
        fontSize: 18,
        color: '#333',
    },
    infoCard: {
        backgroundColor: '#E8F4FD',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#333',
        lineHeight: 20,
    },
    generateButton: {
        margin: 16,
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        alignItems: 'center',
    },
    generateText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
