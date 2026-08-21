import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { usePremium } from '../hooks/usePremium';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { ServiceFactory } from '../factories/serviceFactory';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlanGeneration } from '../contexts/MealPlanGenerationContext';

export default function MealPlanGenerateScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();
    const [currentMonth, setCurrentMonth] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { isGenerating, startBackgroundGeneration } = useMealPlanGeneration();
    const [remainingUsage, setRemainingUsage] = useState<{ remaining: number; limit: number; isPremium: boolean } | null>(null);

    useFocusEffect(
        useCallback(() => {
            const today = new Date();
            setCurrentMonth(today.toISOString().substring(0, 7));
            loadRemainingUsage();
        }, [])
    );

    const loadRemainingUsage = async () => {
        const premiumService = ServiceFactory.createPremiumService();
        const usage = await premiumService.getRemainingUsage('monthly_generation');
        setRemainingUsage(usage);
    };

    const generateMonthlyPlan = async () => {
        try {
            // 使用制限チェック
            const premiumService = ServiceFactory.createPremiumService();
            await premiumService.checkAIUsageLimit('monthly_generation');

            const budgetService = ServiceFactory.createBudgetService();
            const currentBudget = await budgetService.getCurrentBudget();

            if (currentBudget?.total_budget === 0) {
                Alert.alert('初期設定をしてください。', '', [
                    { text: 'OK', onPress: () => { } }
                ]);
                return;
            }

            // 使用回数をインクリメント
            await premiumService.incrementAIUsage('monthly_generation');

            // バックグラウンドで生成を開始
            await startBackgroundGeneration(currentMonth);

            // 即座にホーム画面に戻る
            Alert.alert(
                '献立の生成を開始しました',
                '完成したら通知でお知らせします。\nアプリを閉じても生成は続きます。',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tabs)');
                            }
                        }
                    },
                ]
            );

        } catch (error: any) {
            if (error.message.includes('プレミアム会員')) {
                Alert.alert('無料回数を超えました', error.message, [
                    { text: 'プレミアムに登録', onPress: () => router.push('/subscription') },
                    { text: 'キャンセル', style: 'cancel' },
                ]);
            } else {
                Alert.alert('エラー', error.message, [
                    { text: 'OK', onPress: () => { } },
                ]);
            }
        }
    }

    const handleGenerate = async () => {
        await generateMonthlyPlan();
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>対象月</Text>
                <Text style={styles.value}>{currentMonth}</Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>バックグラウンド生成について</Text>
                <Text style={styles.infoText}>
                    生成ボタンを押すとホーム画面に戻ります。{'\n'}
                    1ヶ月分の献立はバックグラウンドで生成され、{'\n'}
                    完成したら通知でお知らせします。
                </Text>
            </View>

            {isGenerating && (
                <View style={styles.generatingCard}>
                    <Ionicons name="sync" size={24} color="#007AFF" />
                    <Text style={styles.generatingText}>
                        現在生成中です...
                    </Text>
                </View>
            )}

            {remainingUsage && !remainingUsage.isPremium && (
                <View style={styles.usageCard}>
                    <Text style={styles.usageTitle}>残り生成回数</Text>
                    <Text style={styles.usageCount}>
                        {remainingUsage.remaining} / {remainingUsage.limit} 回
                    </Text>
                    <TouchableOpacity
                        style={styles.premiumLink}
                        onPress={() => router.push('/subscription')}
                    >
                        <Text style={styles.premiumLinkText}>
                            プレミアム会員なら無制限
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity
                style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
                onPress={handleGenerate}
                disabled={isGenerating}
            >
                <View style={styles.buttonContent}>
                    <Ionicons name="sparkles-outline" size={20} color="white" />
                    <Text style={styles.generateText}>献立を生成する</Text>
                </View>
            </TouchableOpacity>
            <LoginRequiredModal visible={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </ScrollView>
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
    usageCard: {
        backgroundColor: '#FFF3E0',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
        alignItems: 'center',
    },
    usageTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#E65100',
        marginBottom: 4,
    },
    usageCount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    premiumLink: {
        marginTop: 8,
    },
    premiumLinkText: {
        fontSize: 13,
        color: '#007AFF',
        textDecorationLine: 'underline',
    },
    generatingCard: {
        backgroundColor: '#E3F2FD',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    generatingText: {
        fontSize: 14,
        color: '#1565C0',
        fontWeight: '600',
    },
});
