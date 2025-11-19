import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomHeader } from '../../components/custom/CustomHeader';
import React from 'react';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#aaa',
            tabBarStyle: { backgroundColor: '#fff' },
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'ホーム',
                    header: () => <CustomHeader title={'ホーム'} />,
                    tabBarIcon: (props) => <Ionicons name="home-outline" size={20} color={props.color} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'カレンダー',
                    tabBarIcon: (props) => <Ionicons name="calendar-outline" size={20} color={props.color} />,
                }}
            />
            <Tabs.Screen
                name="expense"
                options={{
                    title: '支出',
                    tabBarIcon: (props) => <Ionicons name="cash-outline" size={20} color={props.color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'プロフィール',
                    tabBarIcon: (props) => <Ionicons name="person-outline" size={20} color={props.color} />,
                }}
            />
        </Tabs>
    );
}