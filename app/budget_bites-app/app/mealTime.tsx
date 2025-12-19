import React, { useState, useCallback, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ServiceFactory } from '../factories/serviceFactory';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { MealTime } from '../types/types';
import { DateUtils } from '../utils/DateUtils';
import MyBanner from '../components/MyBanner';
import { BannerAdSize } from "react-native-google-mobile-ads";
import { NotifaicationPermissionContext } from '../contexts/NotifaicationPermissionContext';
import NotifacationPermissionBanner from '../components/NotifacationPermissionBanner';

export default function MealTimeScreen() {
    const [loading, setLoading] = useState(false);
    const [mealTimes, setMealTimes] = useState<MealTime[]>([]);
    const [selectedMealTime, setSelectedMealTime] = useState<MealTime | null>(null);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [originalHour, setOriginalHour] = useState(12);
    const [originalMinute, setOriginalMinute] = useState(0);
    const mealTimeService = ServiceFactory.createMealTimeService();
    const notifacationContext = useContext(NotifaicationPermissionContext);

    const isTimeChanged = selectedHour !== originalHour || selectedMinute !== originalMinute;
    if (!notifacationContext) return null;
    const { permisstion } = notifacationContext;

    useFocusEffect(
        useCallback(() => {
            getMealTimes();
        }, [])
    );

    const getMealTimes = async () => {
        setLoading(true);
        try {
            const times = await mealTimeService.getMealTimes();
            setMealTimes(times);
        } catch (e) {
            Alert.alert('エラー', '通知時間の取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const getMealIcon = (type: string) => {
        switch (type) {
            case 'breakfast':
                return { name: 'sunny' as const, color: '#FF9500' };
            case 'lunch':
                return { name: 'sunny-outline' as const, color: '#FFCC00' };
            case 'dinner':
                return { name: 'moon' as const, color: '#000000FF' };
            default:
                return { name: 'restaurant' as const, color: '#007AFF' };
        }
    };

    const getMealLabel = (type: string) => {
        switch (type) {
            case 'breakfast':
                return '朝食';
            case 'lunch':
                return '昼食';
            case 'dinner':
                return '夕食';
            default:
                return '食事';
        }
    };

    const handleEditTime = (mealTime: MealTime) => {
        setSelectedMealTime(mealTime);
        if (mealTime.hour !== undefined && mealTime.hour !== null) {
            setSelectedHour(mealTime.hour);
            setSelectedMinute(mealTime.minute);
            setOriginalHour(mealTime.hour);
            setOriginalMinute(mealTime.minute);
        } else {
            const defaultHour = 12;
            const defaultMinute = 0;
            setSelectedHour(defaultHour);
            setSelectedMinute(defaultMinute);
            setOriginalHour(defaultHour);
            setOriginalMinute(defaultMinute);
        }
        setShowTimePicker(true);
    };

    const handleSaveTime = async () => {
        if (!selectedMealTime) return;
        try {
            setLoading(true);
            await mealTimeService.updateMealTime(selectedMealTime.id!, selectedHour, selectedMinute);
            setShowTimePicker(false);
            await getMealTimes();
            Alert.alert('成功', '通知時間を設定しました');
        } catch (e) {
            console.log(e);
            Alert.alert('エラー', '通知時間の設定に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const toggleEnabled = async (mealTime: MealTime) => {
        try {
            setLoading(true);
            await mealTimeService.updateEnabled(mealTime.id!, !mealTime.enabled);
            await getMealTimes();
        } catch (e) {
            console.log(e);
            Alert.alert('エラー', '設定の変更に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const renderTimePicker = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const minutes = Array.from({ length: 60 }, (_, i) => i);

        return (
            <Modal
                visible={showTimePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedMealTime && getMealLabel(selectedMealTime.meal_type)}の時間を設定
                            </Text>
                        </View>

                        <View style={styles.timePickerContainer}>
                            <ScrollView
                                style={styles.pickerColumn}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={50}
                                decelerationRate="fast"
                            >
                                {hours.map((hour) => (
                                    <TouchableOpacity
                                        key={hour}
                                        style={[
                                            styles.pickerItem,
                                            selectedHour === hour && styles.pickerItemSelected
                                        ]}
                                        onPress={() => setSelectedHour(hour)}
                                    >
                                        <Text style={[
                                            styles.pickerText,
                                            selectedHour === hour && styles.pickerTextSelected
                                        ]}>
                                            {String(hour).padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.timeSeparator}>:</Text>

                            <ScrollView
                                style={styles.pickerColumn}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={50}
                                decelerationRate="fast"
                            >
                                {
                                    minutes.map((minute) => (
                                        <TouchableOpacity
                                            key={minute}
                                            style={[
                                                styles.pickerItem,
                                                selectedMinute === minute && styles.pickerItemSelected
                                            ]}
                                            onPress={() => setSelectedMinute(minute)}
                                        >
                                            <Text style={[
                                                styles.pickerText,
                                                selectedMinute === minute && styles.pickerTextSelected
                                            ]}>
                                                {String(minute).padStart(2, '0')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                }
                            </ScrollView>
                        </View>

                        <View style={styles.timeDisplay}>
                            <Text style={styles.timeDisplayText}>
                                {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                            </Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowTimePicker(false)}
                            >
                                <Text style={styles.cancelButtonText}>キャンセル</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.saveButton,
                                    !isTimeChanged && styles.saveButtonDisabled
                                ]}
                                onPress={() => handleSaveTime()}
                                disabled={!isTimeChanged}
                            >
                                <Text style={[
                                    styles.saveButtonText,
                                    !isTimeChanged && styles.saveButtonTextDisabled
                                ]}>
                                    保存
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }
    const mealTimeCard = (mealTime: MealTime) => {
        const icon = getMealIcon(mealTime.meal_type);
        return (
            <TouchableOpacity
                key={mealTime.id}
                style={styles.mealTimeCard}
                onPress={() => handleEditTime(mealTime)}
                activeOpacity={0.7}
            >
                <View style={styles.mealTimeLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={icon.name}
                            size={32}
                            color={icon.color}
                        />
                    </View>
                    <View style={styles.mealTimeInfo}>
                        <Text style={styles.mealLabel}>
                            {getMealLabel(mealTime.meal_type)}
                        </Text>
                        {mealTime.hour !== undefined && mealTime.hour !== null && (
                            <Text style={styles.mealTimeText}>
                                {DateUtils.numberToTimeString(mealTime.hour, mealTime.minute)}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={styles.mealTimeRight}>
                    <TouchableOpacity
                        style={[
                            styles.statusBadge,
                            mealTime.enabled ? styles.statusEnabled : styles.statusDisabled
                        ]}
                        onPress={(e) => {
                            e.stopPropagation();
                            toggleEnabled(mealTime);
                        }}
                    >
                        <Text style={[
                            styles.statusText,
                            mealTime.enabled ? styles.statusTextEnabled : styles.statusTextDisabled
                        ]}>
                            {mealTime.enabled ? 'ON' : 'OFF'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.wrapper}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.content}>
                    {
                        permisstion ?
                            mealTimes.length === 0 && !loading ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="alarm-outline" size={64} color="#ccc" />
                                    <Text style={styles.emptyText}>
                                        通知時間が設定されていません
                                    </Text>
                                </View>
                            ) : (
                                mealTimes.map((mealTime) => {
                                    return mealTimeCard(mealTime);
                                })
                            ) : <NotifacationPermissionBanner />}
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="bulb" size={20} color="#1976d2" />
                    <Text style={styles.infoText}>
                        各カードをタップして通知時間を変更できます
                    </Text>
                </View>
                <View style={styles.bannerContainer}>
                    <MyBanner size={BannerAdSize.MEDIUM_RECTANGLE} />
                </View>
            </ScrollView>

            {renderTimePicker()}

            <LoadingOverlay
                title='読み込み中'
                visible={loading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 60,
    },
    content: {
        padding: 16,
    },
    mealTimeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    mealTimeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    mealTimeInfo: {
        flex: 1,
    },
    mealLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    mealTimeText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#007AFF',
        letterSpacing: 1,
    },
    mealTimeRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusEnabled: {
        backgroundColor: '#007AFF',
    },
    statusDisabled: {
        backgroundColor: '#f5f5f5',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusTextEnabled: {
        color: '#F7F7F7FF',
    },
    statusTextDisabled: {
        color: '#999',
    },
    chevron: {
        fontSize: 24,
        color: '#ccc',
        fontWeight: '300',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 16,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#e3f2fd',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1976d2',
        lineHeight: 20,
    },
    bannerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 34,
    },
    modalHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
    },
    timePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 250,
        paddingVertical: 20,
    },
    pickerColumn: {
        width: 80,
        height: 250,
    },
    pickerItem: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerItemSelected: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    pickerText: {
        fontSize: 24,
        color: '#999',
    },
    pickerTextSelected: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFFFF',
    },
    timeSeparator: {
        fontSize: 32,
        fontWeight: '700',
        color: '#333',
        marginHorizontal: 12,
    },
    timeDisplay: {
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#007AFF',
    },
    timeDisplayText: {
        fontSize: 40,
        fontWeight: '700',
        color: '#007AFF',
        letterSpacing: 2,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    saveButtonDisabled: {
        backgroundColor: '#e0e0e0',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    saveButtonTextDisabled: {
        color: '#999',
    },
});