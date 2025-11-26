import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ServiceFactory } from '../factories/serviceFactory';


// 一般的なアレルギー項目
const COMMON_ALLERGIES = [
    { id: 'egg', label: '卵' },
    { id: 'milk', label: '乳製品' },
    { id: 'wheat', label: '小麦' },
    { id: 'buckwheat', label: 'そば' },
    { id: 'peanut', label: '落花生' },
    { id: 'shrimp', label: 'えび' },
    { id: 'crab', label: 'かに' },
    { id: 'walnut', label: 'くるみ' },
    { id: 'almond', label: 'アーモンド' },
    { id: 'abalone', label: 'あわび' },
    { id: 'squid', label: 'いか' },
    { id: 'salmon', label: 'さけ' },
    { id: 'mackerel', label: 'さば' },
    { id: 'soybean', label: '大豆' },
    { id: 'chicken', label: '鶏肉' },
    { id: 'pork', label: '豚肉' },
    { id: 'beef', label: '牛肉' },
    { id: 'gelatin', label: 'ゼラチン' },
    { id: 'banana', label: 'バナナ' },
    { id: 'kiwi', label: 'キウイ' },
    { id: 'apple', label: 'りんご' },
    { id: 'peach', label: 'もも' },
    { id: 'orange', label: 'オレンジ' },
    { id: 'sesame', label: 'ごま' },
    { id: 'cashew', label: 'カシューナッツ' },
];

// 避けたい食材の候補
const COMMON_AVOID_INGREDIENTS = [
    { id: 'shellfish', label: '貝類' },
    { id: 'mushroom', label: 'きのこ類' },
    { id: 'seaweed', label: '海藻類' },
    { id: 'spicy', label: '辛い食べ物' },
    { id: 'raw_fish', label: '生魚' },
    { id: 'cheese', label: 'チーズ' },
    { id: 'fermented', label: '発酵食品' },
    { id: 'organ_meat', label: '内臓肉' },
    { id: 'strong_smell', label: '匂いの強い食材' },
];

export default function PreferenceSetupScreen() {
    const router = useRouter();
    const [budget, setBudget] = useState('');
    const [tastePreference, setTastePreference] = useState<'light' | 'balanced' | 'rich'>(
        'balanced'
    );
    const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
    const [selectedAvoidIngredients, setSelectedAvoidIngredients] = useState<string[]>([]);
    const [customAllergy, setCustomAllergy] = useState('');
    const [customAvoidIngredient, setCustomAvoidIngredient] = useState('');

    const toggleAllergy = (allergyId: string) => {
        setSelectedAllergies((prev) =>
            prev.includes(allergyId)
                ? prev.filter((id) => id !== allergyId)
                : [...prev, allergyId]
        );
    };

    const toggleAvoidIngredient = (ingredientId: string) => {
        setSelectedAvoidIngredients((prev) =>
            prev.includes(ingredientId)
                ? prev.filter((id) => id !== ingredientId)
                : [...prev, ingredientId]
        );
    };

    const addCustomAllergy = () => {
        if (customAllergy.trim()) {
            setSelectedAllergies((prev) => [...prev, customAllergy.trim()]);
            setCustomAllergy('');
        }
    };

    const addCustomAvoidIngredient = () => {
        if (customAvoidIngredient.trim()) {
            setSelectedAvoidIngredients((prev) => [...prev, customAvoidIngredient.trim()]);
            setCustomAvoidIngredient('');
        }
    };

    const removeAllergy = (allergy: string) => {
        setSelectedAllergies((prev) => prev.filter((item) => item !== allergy));
    };

    const removeAvoidIngredient = (ingredient: string) => {
        setSelectedAvoidIngredients((prev) => prev.filter((item) => item !== ingredient));
    };

    const handleSubmit = async () => {
        const budgetNum = parseInt(budget);
        if (!budgetNum || budgetNum < 10000) {
            Alert.alert('エラー', '有効な予算を入力してください（最低 ¥10,000）');
            return;
        }

        const today = new Date();
        const month = today.toISOString().substring(0, 7);

        try {
            const budgetService = ServiceFactory.createBudgetService();
            const preferencesRepo = ServiceFactory.getPreferencesRepository();

            await budgetService.setBudget(budgetNum, month);

            // アレルギーと避けたい食材のラベルを取得
            const allergyLabels = selectedAllergies.map((id) => {
                const found = COMMON_ALLERGIES.find((a) => a.id === id);
                return found ? found.label : id;
            });

            const avoidIngredientLabels = selectedAvoidIngredients.map((id) => {
                const found = COMMON_AVOID_INGREDIENTS.find((a) => a.id === id);
                return found ? found.label : id;
            });
            await preferencesRepo.update({
                taste_preference: tastePreference,
                allergies: allergyLabels,
                avoid_ingredients: avoidIngredientLabels,
            });

            Alert.alert('成功', '設定を保存しました', [
                { text: 'OK', onPress: () => router.push('/') },
            ]);
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        }
    };

    return (
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

            {/* 味付けの好み */}
            <View style={styles.card}>
                <Text style={styles.label}>🍽️ 味付けの好み</Text>
                <Text style={styles.description}>
                    お好みの味付けを選択してください
                </Text>
                <View style={styles.tasteOptions}>
                    {(['light', 'balanced', 'rich'] as const).map((taste) => (
                        <TouchableOpacity
                            key={taste}
                            style={[
                                styles.tasteButton,
                                tastePreference === taste && styles.tasteButtonActive,
                            ]}
                            onPress={() => setTastePreference(taste)}
                        >
                            <Text
                                style={[
                                    styles.tasteText,
                                    tastePreference === taste && styles.tasteTextActive,
                                ]}
                            >
                                {taste === 'light'
                                    ? 'あっさり'
                                    : taste === 'balanced'
                                        ? 'バランス'
                                        : '濃いめ'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* アレルギー設定 */}
            <View style={styles.card}>
                <Text style={styles.label}>⚠️ アレルギー</Text>
                <Text style={styles.description}>
                    アレルギーのある食材を選択してください（複数選択可）
                </Text>

                {/* 選択済みアレルギー */}
                {selectedAllergies.length > 0 && (
                    <View style={styles.selectedContainer}>
                        <Text style={styles.selectedLabel}>選択中:</Text>
                        <View style={styles.chipContainer}>
                            {selectedAllergies.map((allergyId) => {
                                const found = COMMON_ALLERGIES.find((a) => a.id === allergyId);
                                const label = found ? found.label : allergyId;
                                return (
                                    <TouchableOpacity
                                        key={allergyId}
                                        style={styles.chip}
                                        onPress={() => removeAllergy(allergyId)}
                                    >
                                        <Text style={styles.chipText}>{label}</Text>
                                        <Text style={styles.chipRemove}>✕</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* アレルギー選択グリッド */}
                <View style={styles.optionGrid}>
                    {COMMON_ALLERGIES.map((allergy) => (
                        <TouchableOpacity
                            key={allergy.id}
                            style={[
                                styles.optionButton,
                                selectedAllergies.includes(allergy.id) && styles.optionButtonSelected,
                            ]}
                            onPress={() => toggleAllergy(allergy.id)}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    selectedAllergies.includes(allergy.id) && styles.optionTextSelected,
                                ]}
                            >
                                {allergy.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* カスタムアレルギー追加 */}
                <View style={styles.customInput}>
                    <TextInput
                        style={styles.customInputField}
                        placeholder="その他のアレルギー"
                        value={customAllergy}
                        onChangeText={setCustomAllergy}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addCustomAllergy}>
                        <Text style={styles.addButtonText}>追加</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 避けたい食材 */}
            <View style={styles.card}>
                <Text style={styles.label}>🚫 避けたい食材</Text>
                <Text style={styles.description}>
                    苦手な食材や避けたい食材を選択してください（複数選択可）
                </Text>

                {/* 選択済み避けたい食材 */}
                {selectedAvoidIngredients.length > 0 && (
                    <View style={styles.selectedContainer}>
                        <Text style={styles.selectedLabel}>選択中:</Text>
                        <View style={styles.chipContainer}>
                            {selectedAvoidIngredients.map((ingredientId) => {
                                const found = COMMON_AVOID_INGREDIENTS.find((a) => a.id === ingredientId);
                                const label = found ? found.label : ingredientId;
                                return (
                                    <TouchableOpacity
                                        key={ingredientId}
                                        style={styles.chip}
                                        onPress={() => removeAvoidIngredient(ingredientId)}
                                    >
                                        <Text style={styles.chipText}>{label}</Text>
                                        <Text style={styles.chipRemove}>✕</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* 避けたい食材選択グリッド */}
                <View style={styles.optionGrid}>
                    {COMMON_AVOID_INGREDIENTS.map((ingredient) => (
                        <TouchableOpacity
                            key={ingredient.id}
                            style={[
                                styles.optionButton,
                                selectedAvoidIngredients.includes(ingredient.id) &&
                                styles.optionButtonSelected,
                            ]}
                            onPress={() => toggleAvoidIngredient(ingredient.id)}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    selectedAvoidIngredients.includes(ingredient.id) &&
                                    styles.optionTextSelected,
                                ]}
                            >
                                {ingredient.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* カスタム避けたい食材追加 */}
                <View style={styles.customInput}>
                    <TextInput
                        style={styles.customInputField}
                        placeholder="その他の避けたい食材"
                        value={customAvoidIngredient}
                        onChangeText={setCustomAvoidIngredient}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addCustomAvoidIngredient}>
                        <Text style={styles.addButtonText}>追加</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 送信ボタン */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>設定を保存</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    ※ 設定はいつでも変更できます
                </Text>
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