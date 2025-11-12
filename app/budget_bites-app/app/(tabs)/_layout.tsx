import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'ホーム',
                    tabBarIcon: () => <Ionicons name="home-outline" size={30} color={'#fff'} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'カレンダー',
                    tabBarIcon: () => <Ionicons name="home-outline" size={30} color={'#fff'} />,
                }}
            />
            <Tabs.Screen
                name="expense"
                options={{
                    title: '支出',
                    tabBarIcon: () => <Ionicons name="home-outline" size={30} color={'#fff'} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'プロフィール',
                    tabBarIcon: () => <Ionicons name="home-outline" size={30} color={'#fff'} />,
                }}
            />
        </Tabs>
    );
}