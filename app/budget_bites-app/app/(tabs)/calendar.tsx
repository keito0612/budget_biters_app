import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { ServiceFactory } from '../../factories/serviceFactory';
import { MealPlan } from '../../types/types';
import { router, useFocusEffect } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useMealPlanGeneration } from '../../contexts/MealPlanGenerationContext';

// 日本語ロケール設定
LocaleConfig.locales['ja'] = {
    monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
    today: '今日'
};
LocaleConfig.defaultLocale = 'ja';

// 祝日データのキャッシュ（Holidays JP APIから取得）
let holidaysCache: { [key: string]: string } = {};
type DateFormat = 'full' | 'date-only';


interface DayMeals {
    breakfast?: MealPlan;
    lunch?: MealPlan;
    dinner?: MealPlan;
}

export default function CalendarScreen() {
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDayMeals, setSelectedDayMeals] = useState<DayMeals | null>(null);
    const [allPlans, setAllPlans] = useState<MealPlan[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMassage, setLoadingMassage] = useState<string>('');
    const { progress, isGenerating } = useMealPlanGeneration();
    const [lastCompletedWeeks, setLastCompletedWeeks] = useState(0);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-31`;


    useEffect(() => {
        if (allPlans.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            selectDate(todayStr);
        }
    }, [allPlans]);

    // 生成進捗が変わったらデータを再読み込み
    useEffect(() => {
        if (progress.completedWeeks > lastCompletedWeeks) {
            setLastCompletedWeeks(progress.completedWeeks);
            loadMonthData();
        }
    }, [progress.completedWeeks]);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                setIsLoading(true);
                setLoadingMassage('読み込み中');
                await loadHolidays();
                await loadMonthData();
                setIsLoading(false);
            })();
        }, [])
    );

    // 祝日データをAPIから取得（Holidays JP API使用）
    const loadHolidays = async () => {
        if (Object.keys(holidaysCache).length > 0) {
            return;
        }

        try {
            const response = await fetch('https://holidays-jp.github.io/api/v1/date.json');
            const data = await response.json();

            // 振替休日を追加（APIに含まれていない場合のため）
            // 日曜の祝日の翌日（月曜）を振替休日として追加
            const addedHolidays = { ...data };
            Object.keys(data).forEach(dateStr => {
                const date = new Date(dateStr);
                if (date.getDay() === 0) { // 日曜日の場合
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const nextDayStr = nextDay.toISOString().split('T')[0];

                    // 翌日が既に祝日でない場合のみ振替休日を追加
                    if (!addedHolidays[nextDayStr]) {
                        addedHolidays[nextDayStr] = '振替休日';
                    }
                }
            });

            holidaysCache = addedHolidays;
        } catch (error) {
            Alert.alert('エラー', 'データの取得に失敗しました。　\n 通信状況をご確認のうえ、再度お試しください。');
            holidaysCache = {};
        }
    };

    const loadMonthData = async () => {
        const today = new Date();
        const month = today.toISOString().substring(0, 7);
        const plans = await getPlans(month);
        setAllPlans(plans);

        const marked: any = {};
        const datesWithMeals = new Set<string>();

        plans.forEach((plan: MealPlan) => {
            datesWithMeals.add(plan.date);
        });

        // 献立がある日をマーク
        datesWithMeals.forEach((date) => {
            const dayOfWeek = new Date(date).getDay();
            const isHoliday = holidaysCache[date];

            marked[date] = {
                marked: true,
                dotColor: '#007AFF',
                customStyles: {
                    text: {
                        color: isHoliday || dayOfWeek === 0 ? '#ff0000' : (dayOfWeek === 6 ? '#0000ff' : '#000000'),
                        fontWeight: isHoliday ? 'bold' : 'normal',
                    },
                    container: {
                        backgroundColor: 'transparent',
                    }
                }
            };
        });

        // 献立がない日も祝日・土日の色付け
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (!marked[dateStr]) {
                const dayOfWeek = d.getDay();
                const isHoliday = holidaysCache[dateStr];

                marked[dateStr] = {
                    customStyles: {
                        text: {
                            color: isHoliday || dayOfWeek === 0 ? '#ff0000' : (dayOfWeek === 6 ? '#0000ff' : '#000000'),
                            fontWeight: isHoliday ? 'bold' : 'normal',
                        },
                        container: {
                            backgroundColor: 'transparent',
                        }
                    }
                };
            }
        }

        setMarkedDates(marked);

        // 初期選択日を今日に設定
        const todayStr = today.toISOString().split('T')[0];
        selectDate(todayStr);
    };

    const getPlans = async (month: string): Promise<MealPlan[]> => {
        const mealPlanRepo = ServiceFactory.getMealPlanRepository();
        const plans = await mealPlanRepo.findByDateRange(`${month}-01`, `${month}-31`);
        return plans;
    };

    const selectDate = (dateStr: string) => {
        const dayMeals: DayMeals = {
            breakfast: allPlans.find(p => p.date === dateStr && p.meal_type === 'breakfast'),
            lunch: allPlans.find(p => p.date === dateStr && p.meal_type === 'lunch'),
            dinner: allPlans.find(p => p.date === dateStr && p.meal_type === 'dinner'),
        };

        setSelectedDate(dateStr);
        setSelectedDayMeals(dayMeals);
    };

    const onDayPress = (day: any) => {
        selectDate(day.dateString);
    };

    const getTotalCalories = (dayMeals: DayMeals | null) => {
        if (!dayMeals) return 0;
        const breakfast = dayMeals.breakfast?.nutrition.calories || 0;
        const lunch = dayMeals.lunch?.nutrition.calories || 0;
        const dinner = dayMeals.dinner?.nutrition.calories || 0;
        return breakfast + lunch + dinner;
    };

    const hasMeals = (dayMeals: DayMeals | null) => {
        if (!dayMeals) return false;
        return !!(dayMeals.breakfast || dayMeals.lunch || dayMeals.dinner);
    };


    const todayMealEdit = async () => {
        setIsLoading(true);
        setLoadingMassage('献立を変更中');
        try {
            const mealPlanService = ServiceFactory.createMealPlanService();
            await mealPlanService.regenerateTodayMeal(selectedDate!);
            Alert.alert('成功', '献立を生成しました！', [
                {
                    text: 'OK', onPress: async () => {
                        setIsLoading(true);
                        await loadMonthData();
                        setIsLoading(false);
                    }
                },
            ]);
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleEdit = () => {
        Alert.alert(
            '確認',
            `${formatDate(selectedDate, 'date-only')}の献立を変更しますか？`,
            [
                {
                    text: 'はい',
                    onPress: async () => {
                        await todayMealEdit();
                    }
                },
                {
                    text: 'キャンセル',
                    onPress: () => {
                    }
                }
            ]
        );
    };

    const handleSetting = () => {
        router.push('/mealPlanGenerate');
    }


    const formatDate = (dateStr: string | null, format: DateFormat = 'full') => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        if (format === 'date-only') {
            return `${year}年${month}月${day}日`;
        }

        // format === 'full'
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        const holiday = holidaysCache[dateStr];

        return `${year}年${month}月${day}日（${dayOfWeek}）${holiday ? ` ${holiday}` : ''}`;
    };

    const DateHeader = ({ selectedDate }: { selectedDate: string }) => {
        return (
            <View style={styles.dateHeader}>
                <Text style={[
                    styles.dateTitle,
                    holidaysCache[selectedDate] && styles.holidayText
                ]}>
                    {formatDate(selectedDate)}
                </Text>
            </View>
        );
    };

    const MealItem = ({
        selectedDayMeals,
        mealType,
    }: {
        selectedDayMeals: DayMeals | null;
        mealType: 'breakfast' | 'lunch' | 'dinner';
    }) => {
        const meal = selectedDayMeals?.[mealType];
        return (
            <View style={styles.mealSection}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.mealLabel}>
                        {mealType === 'breakfast'
                            ? '🌅 朝食'
                            : mealType === 'lunch'
                                ? '☀️ 昼食'
                                : '🌙 夕食'}
                    </Text>

                    {meal ? (
                        <View style={styles.mealContent}>
                            <Text style={styles.mealName}>{meal.menu_name}</Text>
                            <View style={styles.mealInfo}>
                                <Text style={styles.calories}>{meal.nutrition.calories} kcal</Text>
                                <Text style={styles.cookingTime}>⏱️ {meal.cooking_time}分</Text>
                            </View>
                            <Text style={styles.estimatedCost}>¥{meal.estimated_cost}</Text>
                        </View>
                    ) : (
                        <Text style={styles.noMeal}>未設定</Text>
                    )}
                </View>
                {meal &&
                    <MealDetailButton meal={meal} />
                }
            </View>
        );
    };

    const MealDetailButton = ({ meal }: { meal: MealPlan }) => {
        return (
            <TouchableOpacity
                style={styles.detailButton}
                onPress={() => {
                    router.push({
                        pathname: '/mealDetail',
                        params: {
                            date: meal.date,
                            mealType: meal.meal_type,
                        },
                    })
                }}
            >
                <Text style={styles.detailButtonText}>詳細</Text>
            </TouchableOpacity>
        );
    };
    const MealList = () => {
        return (
            <ScrollView style={styles.mealList}>
                {selectedDate && (
                    <>
                        {hasMeals(selectedDayMeals) ? (
                            <>
                                <MealItem selectedDayMeals={selectedDayMeals} mealType={'breakfast'} />
                                <MealItem selectedDayMeals={selectedDayMeals} mealType={'lunch'} />
                                <MealItem selectedDayMeals={selectedDayMeals} mealType={'dinner'} />
                                <View style={styles.totalSection}>
                                    <Text style={styles.totalLabel}>合計カロリー</Text>
                                    <Text style={styles.totalCalories}>{getTotalCalories(selectedDayMeals)} kcal</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.noPlanContainer}>
                                <Text style={styles.noPlanText}>献立がまだ登録されていません</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        );
    };

    const MealEditButton = () => {
        return (
            <TouchableOpacity style={styles.editButton} onPress={hasMeals(selectedDayMeals) ? handleEdit : handleSetting}>
                <Text style={styles.editButtonText}>
                    {hasMeals(selectedDayMeals) ? ' 献立を変更' : '献立を設定'}
                </Text>
            </TouchableOpacity>
        );
    };

    const GenerationProgressBanner = () => {
        if (!isGenerating || progress.status !== 'generating') {
            return null;
        }

        return (
            <View style={styles.progressBanner}>
                <View style={styles.progressContent}>
                    <Ionicons name="sync" size={18} color="#007AFF" />
                    <Text style={styles.progressText}>
                        献立を生成中... 第{progress.currentWeek}週 ({progress.completedWeeks}/{progress.totalWeeks})
                    </Text>
                </View>
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            { width: `${(progress.completedWeeks / progress.totalWeeks) * 100}%` }
                        ]}
                    />
                </View>
            </View>
        );
    };

    return (
        <>
            <View style={styles.container}>
                <GenerationProgressBanner />
                <Calendar
                    hideArrows={true}
                    markedDates={{
                        ...markedDates,
                        [selectedDate || '']: {
                            ...markedDates[selectedDate || ''],
                            selected: true,
                            selectedColor: '#007AFF',
                        }
                    }}
                    onDayPress={onDayPress}
                    markingType={'custom'}
                    minDate={startOfMonth}
                    maxDate={endOfMonth}
                    renderHeader={(date) => {
                        const month = date.getMonth() + 1;
                        const year = date.getFullYear();
                        return (
                            <View style={styles.calendarHeader}>
                                <Text style={styles.calendarHeaderText}>{year}年{month}月</Text>
                            </View>
                        );
                    }}
                    theme={{
                        todayTextColor: '#007AFF',
                        selectedDayBackgroundColor: '#007AFF',
                        arrowColor: '#007AFF',
                        textDayFontFamily: 'System',
                        textMonthFontFamily: 'System',
                        textDayHeaderFontFamily: 'System',
                        textMonthFontWeight: 'bold',
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                    }}
                />
                <View style={styles.mealDetailContainer}>
                    {selectedDate && (
                        <DateHeader selectedDate={selectedDate} />
                    )}
                    <MealList />
                    <MealEditButton />
                </View>
            </View>
            <LoadingOverlay visible={isLoading} title={loadingMassage} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    calendarHeader: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    calendarHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    mealDetailContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingBottom: 50
    },
    dateHeader: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fafafa',
    },
    dateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    holidayText: {
        color: '#ff0000',
    },
    mealList: {
        flex: 1,
    },
    mealSection: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    mealLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    mealContent: {
        marginLeft: 10,
        flex: 1
    },
    mealName: {
        fontSize: 15,
        color: '#333',
        marginBottom: 4,
    },
    mealInfo: {
        flexDirection: 'row',
        gap: 15,
    },
    calories: {
        fontSize: 14,
        color: '#666',
    },
    cookingTime: {
        fontSize: 14,
        color: '#888',
    },
    estimatedCost: {
        fontSize: 14,
        color: '#888',
        paddingTop: 4
    },
    noMeal: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        marginLeft: 10,
    },
    totalSection: {
        backgroundColor: '#007AFF',
        padding: 15,
        margin: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    totalCalories: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    noPlanContainer: {
        padding: 40,
        alignItems: 'center',
    },
    noPlanText: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
    },
    editButton: {
        backgroundColor: '#007AFF',
        margin: 12,
        padding: 8,
        borderRadius: 10,
        alignItems: 'center',
    },
    editButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: 'bold'
    },
    detailButton: {
        padding: 6,
        borderRadius: 6,
        alignSelf: 'center',
        marginLeft: 10,
    },
    progressBanner: {
        backgroundColor: '#E8F4FD',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#B8D4E8',
    },
    progressContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: '#D0E4F5',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
});