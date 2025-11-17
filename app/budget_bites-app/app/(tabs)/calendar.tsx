import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ServiceFactory } from '../../factories/serviceFactory';


export default function CalendarScreen() {
    const [markedDates, setMarkedDates] = useState({});

    useEffect(() => {
        loadMonthData();
    }, []);

    const loadMonthData = async () => {
        const today = new Date();
        const month = today.toISOString().substring(0, 7);

        const mealPlanRepo = ServiceFactory.getMealPlanRepository();
        const plans = await mealPlanRepo.findByDateRange(`${month}-01`, `${month}-31`);

        const marked: any = {};
        plans.forEach((plan: any) => {
            if (!marked[plan.date]) {
                marked[plan.date] = { marked: true, dotColor: '#007AFF' };
            }
        });

        setMarkedDates(marked);
    };

    return (
        <View style={styles.container}>
            <Calendar
                markedDates={markedDates}
                theme={{
                    todayTextColor: '#007AFF',
                    selectedDayBackgroundColor: '#007AFF',
                }}
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