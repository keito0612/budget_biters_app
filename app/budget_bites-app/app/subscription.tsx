import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePremium } from '../hooks/usePremium';
import { Config } from '../constants/config';
import { RevenueCatService } from '../services/revenueCatService';
import { ServiceFactory } from '../factories/serviceFactory';
import { PurchasesPackage } from 'react-native-purchases';

export default function SubscriptionScreen() {
    const router = useRouter();
    const { isPremium, refresh } = usePremium();
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [currentPackage, setCurrentPackage] = useState<PurchasesPackage | null>(null);
    const [priceString, setPriceString] = useState(`¥${Config.premium.monthlyPrice}`);
    const [isRevenueCatConfigured, setIsRevenueCatConfigured] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastOpacity = useRef(new Animated.Value(0)).current;

    const showToast = (message: string) => {
        setToastMessage(message);
        Animated.sequence([
            Animated.timing(toastOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(toastOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setToastMessage(''));
    };

    useFocusEffect(
        useCallback(() => {
            loadOfferings();
        }, [])
    );

    const loadOfferings = async () => {
        try {
            const configured = await RevenueCatService.initialize();
            setIsRevenueCatConfigured(configured);

            if (configured) {
                const offering = await RevenueCatService.getOfferings();
                if (offering?.monthly) {
                    setCurrentPackage(offering.monthly);
                    setPriceString(offering.monthly.product.priceString);
                }
            }
        } catch (error) {
            console.error('Failed to load offerings:', error);
        }
    };

    const handlePurchase = async () => {
        if (!currentPackage) {
            Alert.alert('エラー', '商品情報を取得できませんでした。');
            return;
        }

        setLoading(true);
        try {
            const result = await RevenueCatService.purchasePackage(currentPackage);

            if (result.success) {
                // ローカルのプレミアム状態も更新
                const premiumService = ServiceFactory.createPremiumService();
                await premiumService.setPremiumStatus(true);

                // 購入成功後は画面を閉じる（refreshはしない - RevenueCatの同期遅延があるため）
                Alert.alert('購入完了', 'Premium会員になりました！', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                ]);
            } else if (result.error === 'cancelled') {
                showToast('購入がキャンセルされました');
            } else {
                Alert.alert('エラー', result.error || '購入に失敗しました');
            }
        } catch (error: any) {
            Alert.alert('エラー', error.message || '購入に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setRestoring(true);
        try {
            const result = await RevenueCatService.restorePurchases();

            if (result.success) {
                const premiumService = ServiceFactory.createPremiumService();
                await premiumService.setPremiumStatus(true);
                await refresh();

                Alert.alert('復元完了', 'Premium会員を復元しました！', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('復元結果', '有効なサブスクリプションが見つかりませんでした');
            }
        } catch (error: any) {
            Alert.alert('エラー', error.message || '復元に失敗しました');
        } finally {
            setRestoring(false);
        }
    };

    const handleManageSubscription = async () => {
        await RevenueCatService.openManageSubscriptions();
    };

    if (isPremium) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Premium会員</Text>
                </View>
                <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>👑 Premium会員登録済み</Text>
                </View>
                <Text style={styles.message}>すべての機能をお楽しみいただけます！</Text>

                <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
                    <Text style={styles.manageButtonText}>サブスクリプションを管理</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.modalContainer}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Premiumプラン</Text>
                </View>

                <View style={styles.priceCard}>
                    <Text style={styles.price}>{priceString}</Text>
                    <Text style={styles.period}>/ 月</Text>
                </View>

                <View style={styles.features}>
                    <Text style={styles.featuresTitle}>Premium特典</Text>
                    {Config.premium.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Text style={styles.featureIcon}>✓</Text>
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                {isRevenueCatConfigured ? (
                    <>
                        <TouchableOpacity
                            style={[styles.purchaseButton, loading && styles.buttonDisabled]}
                            onPress={handlePurchase}
                            disabled={loading || !currentPackage}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.purchaseText}>Premiumに登録する</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.restoreButton}
                            onPress={handleRestore}
                            disabled={restoring}
                        >
                            {restoring ? (
                                <ActivityIndicator color="#007AFF" />
                            ) : (
                                <Text style={styles.restoreText}>購入を復元する</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.notConfiguredContainer}>
                        <Text style={styles.notConfiguredText}>
                            課金機能は現在準備中です
                        </Text>
                    </View>
                )}

                <Text style={styles.disclaimer}>
                    • サブスクリプションは自動更新されます{'\n'}
                    • いつでもキャンセル可能です{'\n'}
                    • 購入後はApple ID / Google Playアカウントに請求されます
                </Text>
            </ScrollView>

            {toastMessage !== '' && (
                <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
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
    priceCard: {
        backgroundColor: '#FFD700',
        margin: 16,
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
    },
    price: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#000',
    },
    period: {
        fontSize: 18,
        color: '#333',
    },
    features: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 12,
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureIcon: {
        fontSize: 20,
        color: '#007AFF',
        marginRight: 12,
    },
    featureText: {
        fontSize: 16,
        flex: 1,
    },
    purchaseButton: {
        margin: 16,
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
    },
    purchaseText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    premiumBadge: {
        backgroundColor: '#FFD700',
        margin: 16,
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    premiumText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    message: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    manageButton: {
        margin: 16,
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        alignItems: 'center',
    },
    manageButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    restoreButton: {
        margin: 16,
        marginTop: 0,
        padding: 16,
        alignItems: 'center',
    },
    restoreText: {
        color: '#007AFF',
        fontSize: 16,
    },
    disclaimer: {
        marginHorizontal: 16,
        marginBottom: 32,
        fontSize: 12,
        color: '#999',
        lineHeight: 20,
    },
    notConfiguredContainer: {
        margin: 16,
        padding: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        alignItems: 'center',
    },
    notConfiguredText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    toast: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    toastText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
});

