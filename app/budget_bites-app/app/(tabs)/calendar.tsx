import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MealPlanRepository } from '../../lib/repositories';
import { DailyMenuModal } from '../../components/DailyMenuModal';
import type { MealPlan } from '../../lib/types';

export default function CalendarScreen() {
    const [selectedDate, setSelectedDate] = useState('');
    const [markedDates, setMarkedDates] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
    const mealPlanRepository = new MealPlanRepository();

    useEffect(() => {
        loadMonthData();
    }, []);

    const loadMonthData = async () => {
        const today = new Date();
        const month = today.toISOString().substring(0, 7);
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;

        const plans = await mealPlanRepository.findByDateRange(startDate, endDate);

        const marked: any = {};
        plans.forEach((plan) => {
            if (!marked[plan.date]) {
                marked[plan.date] = { marked: true, dotColor: '#007AFF' };
            }
        });

        setMarkedDates(marked);
    };

    const handleDayPress = async (day: any) => {
        setSelectedDate(day.dateString);
        const meals = await mealPlanRepository.findByDate(day.dateString);
        if (meals.length > 0) {
            setSelectedMeal(meals[0]);
            setModalVisible(true);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>献立カレンダー</Text>
            </View>

            <Calendar
                markedDates={markedDates}
                onDayPress={handleDayPress}
                theme={{
                    todayTextColor: '#007AFF',
                    selectedDayBackgroundColor: '#007AFF',
                    selectedDayTextColor: 'white',
                }}
            />

            <DailyMenuModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                meal={selectedMeal}
                onRefresh={loadMonthData}
            />
        </View>
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
});