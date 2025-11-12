import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ServiceFactory } from '../factories/serviceFactory';


export default function PreferenceSetupScreen() {
    const router = useRouter();
    const [budget, setBudget] = useState('');
    const [tastePreference, setTastePreference] = useState<'light' | 'balanced' | 'rich'>('balanced');

    const handleSubmit = async () => {
        const budgetNum = parseInt(budget);
        if (!budgetNum || budgetNum < 1000) {
            Alert.alert('エラー', '有効な予算を入力してください（最低 ¥1,000）');
            return;
        }

        const today = new Date();
        const month = today.toISOString().substring(0, 7);

        try {
            const budgetService = ServiceFactory.createBudgetService();
            const preferencesRepo = ServiceFactory.getPreferencesRepository();

            await budgetService.setBudget(budgetNum, month);
            await preferencesRepo.update({ taste_preference: tastePreference });

            Alert.alert('成功', '設定を保存しました', [
                { text: 'OK', onPress: () => router.push('/') },
            ]);
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>初期設定</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>月間食費予算</Text>
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

            <View style={styles.card}>
                <Text style={styles.label}>味付けの好み</Text>
                <View style={styles.tasteOptions}>
                    {(['light', 'balanced', 'rich'] as const).map((taste) => (
                        <TouchableOpacity
                            key={taste}
                            style={[styles.tasteButton, tastePreference === taste && styles.tasteButtonActive]}
                            onPress={() => setTastePreference(taste)}
                        >
                            <Text
                                style={[styles.tasteText, tastePreference === taste && styles.tasteTextActive]}
                            >
                                {taste === 'light' ? 'あっさり' : taste === 'balanced' ? 'バランス' : '濃いめ'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>設定を保存</Text>
            </TouchableOpacity>
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
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    hint: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
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
    },
    tasteButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    tasteText: {
        textAlign: 'center',
        color: '#333',
    },
    tasteTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    submitButton: {
        margin: 16,
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
    },
    submitText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
});