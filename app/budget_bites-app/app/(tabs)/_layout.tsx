import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'ホーム',
                    tabBarIcon: () => '🏠',
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'カレンダー',
                    tabBarIcon: () => '📅',
                }}
            />
            <Tabs.Screen
                name="expense"
                options={{
                    title: '支出',
                    tabBarIcon: () => '💰',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'プロフィール',
                    tabBarIcon: () => '👤',
                }}
            />
        </Tabs>
    );
}