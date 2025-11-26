import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { usePremium } from '../hooks/usePremium';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { ServiceFactory } from '../factories/serviceFactory';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Ionicons } from '@expo/vector-icons';
export default function MealPlanGenerateScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);

    useFocusEffect(() => {
        const today = new Date();
        setCurrentMonth(today.toISOString().substring(0, 7));
    });


    const handleGenerate = async () => {
        setLoading(true);
        try {
            const mealPlanService = ServiceFactory.createMealPlanService();
            await mealPlanService.generateMonthlyPlan(currentMonth);

            Alert.alert('成功', '献立を生成しました！', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📅 対象月</Text>
                    <Text style={styles.value}>{currentMonth}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.generateButton, loading && styles.buttonDisabled]}
                    onPress={handleGenerate}
                    disabled={loading}
                >
                    <View style={styles.buttonContent}>
                        <Ionicons name="sparkles-outline" size={20} color="white" />
                        <Text style={styles.generateText}>献立を生成する</Text>
                    </View>
                </TouchableOpacity>
                <LoginRequiredModal visible={showLoginModal} onClose={() => setShowLoginModal(false)} />
            </ScrollView>
            <LoadingOverlay visible={loading} message="献立を生成中" />
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