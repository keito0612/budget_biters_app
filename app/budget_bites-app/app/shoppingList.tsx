import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ServiceFactory } from '../factories/serviceFactory';
import { ShoppingListItem } from '../types/types';
import { LoadingOverlay } from '../components/LoadingOverlay';

// 週の開始日（月曜日）を取得
const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の開始に
    return new Date(d.setDate(diff));
};

// 週の終了日（日曜日）を取得
const getWeekEnd = (weekStart: Date): Date => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
};

// 日付をYYYY-MM-DD形式にフォーマット
const formatDateStr = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// 日付を表示用にフォーマット (M/D)
const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 食事タイプを日本語に変換
const getMealTypeLabel = (mealType: 'breakfast' | 'lunch' | 'dinner'): string => {
    const labels = { breakfast: '朝', lunch: '昼', dinner: '夕' };
    return labels[mealType];
};

export default function ShoppingListScreen() {
    const { date } = useLocalSearchParams<{ date?: string }>();
    const initialDate = date ? new Date(date) : new Date();
    const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(initialDate));
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const weekEnd = getWeekEnd(weekStart);
    const weekStartStr = formatDateStr(weekStart);
    const weekEndStr = formatDateStr(weekEnd);

    const loadShoppingList = async () => {
        setIsLoading(true);
        try {
            const service = ServiceFactory.createShoppingListService();
            const list = await service.getShoppingList(weekStartStr, weekEndStr);
            setItems(list);
        } catch (error) {
            Alert.alert('エラー', '買い物リストの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadShoppingList();
        }, [weekStartStr, weekEndStr])
    );

    const handleToggleCheck = async (ingredientName: string, currentChecked: boolean) => {
        try {
            const service = ServiceFactory.createShoppingListService();
            await service.toggleCheck(weekStartStr, ingredientName, !currentChecked);
            await loadShoppingList();
        } catch (error) {
            Alert.alert('エラー', 'チェック状態の更新に失敗しました');
        }
    };

    const handleClearAll = () => {
        Alert.alert(
            '確認',
            'すべてのチェックをクリアしますか？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'クリア',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const service = ServiceFactory.createShoppingListService();
                            await service.clearAllChecks(weekStartStr);
                            await loadShoppingList();
                        } catch (error) {
                            Alert.alert('エラー', 'クリアに失敗しました');
                        }
                    }
                }
            ]
        );
    };

    const handlePrevWeek = () => {
        const newWeekStart = new Date(weekStart);
        newWeekStart.setDate(newWeekStart.getDate() - 7);
        setWeekStart(newWeekStart);
    };

    const handleNextWeek = () => {
        const newWeekStart = new Date(weekStart);
        newWeekStart.setDate(newWeekStart.getDate() + 7);
        setWeekStart(newWeekStart);
    };

    const toggleExpand = (ingredientName: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ingredientName)) {
                newSet.delete(ingredientName);
            } else {
                newSet.add(ingredientName);
            }
            return newSet;
        });
    };

    const checkedCount = items.filter(item => item.isChecked).length;
    const totalCount = items.length;
    const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

    const WeekSelector = () => (
        <View style={styles.weekSelector}>
            <TouchableOpacity onPress={handlePrevWeek} style={styles.weekButton}>
                <Ionicons name="chevron-back" size={24} color="#007AFF" />
                <Text style={styles.weekButtonText}>前週</Text>
            </TouchableOpacity>
            <Text style={styles.weekText}>
                {formatDisplayDate(weekStartStr)}〜{formatDisplayDate(weekEndStr)}
            </Text>
            <TouchableOpacity onPress={handleNextWeek} style={styles.weekButton}>
                <Text style={styles.weekButtonText}>次週</Text>
                <Ionicons name="chevron-forward" size={24} color="#007AFF" />
            </TouchableOpacity>
        </View>
    );

    const ProgressBar = () => (
        <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
                進捗: {checkedCount}/{totalCount} 購入済み
            </Text>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
    );

    const ShoppingItem = ({ item }: { item: ShoppingListItem }) => {
        const isExpanded = expandedItems.has(item.ingredientName);

        return (
            <View style={[styles.itemContainer, item.isChecked && styles.itemChecked]}>
                <TouchableOpacity
                    style={styles.itemMain}
                    onPress={() => toggleExpand(item.ingredientName)}
                >
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => handleToggleCheck(item.ingredientName, item.isChecked)}
                    >
                        <Ionicons
                            name={item.isChecked ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={item.isChecked ? '#34C759' : '#666'}
                        />
                    </TouchableOpacity>
                    <View style={styles.itemContent}>
                        <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
                            {item.ingredientName}
                        </Text>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemAmount}>{item.totalAmount}</Text>
                            <Text style={styles.itemCost}>¥{item.totalCost.toLocaleString()}</Text>
                        </View>
                    </View>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#999"
                    />
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.mealsContainer}>
                        {item.meals.map((meal, index) => (
                            <Text key={index} style={styles.mealText}>
                                {formatDisplayDate(meal.date)}{getMealTypeLabel(meal.mealType)} {meal.menuName}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <>
            <View style={styles.container}>
                <WeekSelector />
                <ProgressBar />

                {items.length > 0 ? (
                    <>
                        <ScrollView style={styles.list}>
                            {items.map((item) => (
                                <ShoppingItem key={item.ingredientName} item={item} />
                            ))}
                        </ScrollView>

                        <View style={styles.footer}>
                            <View style={styles.totalContainer}>
                                <Text style={styles.totalLabel}>合計:</Text>
                                <Text style={styles.totalAmount}>¥{totalCost.toLocaleString()}</Text>
                            </View>
                            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
                                <Text style={styles.clearButtonText}>全てクリア</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cart-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>この週の献立がありません</Text>
                        <Text style={styles.emptySubText}>献立を生成すると買い物リストが表示されます</Text>
                    </View>
                )}
            </View>
            <LoadingOverlay visible={isLoading} title="読み込み中" />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    weekSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    weekButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weekButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
    weekText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        gap: 12,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#34C759',
        borderRadius: 4,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#34C759',
        minWidth: 40,
        textAlign: 'right',
    },
    list: {
        flex: 1,
    },
    itemContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    itemChecked: {
        backgroundColor: '#f8f8f8',
    },
    itemMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    checkbox: {
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    itemNameChecked: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    itemDetails: {
        flexDirection: 'row',
        gap: 16,
    },
    itemAmount: {
        fontSize: 14,
        color: '#666',
    },
    itemCost: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    mealsContainer: {
        paddingLeft: 52,
        paddingRight: 16,
        paddingBottom: 12,
    },
    mealText: {
        fontSize: 13,
        color: '#888',
        marginBottom: 4,
    },
    footer: {
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    clearButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
});
