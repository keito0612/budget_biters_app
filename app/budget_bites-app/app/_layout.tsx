import { useDatabase } from '../hooks/useDatabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Stack } from 'expo-router';
import React from "react";
import { CustomHeader } from '../components/custom/CustomHeader';


export default function Layout() {

    const { initialized } = useDatabase();

    if (!initialized) {
        return <LoadingOverlay visible={false} />;
    }

    return (
        <Stack >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
            <Stack.Screen name="preferenceSetUp" singular={true} />
            <Stack.Screen name="mealPlanGenerate" options={{ title: 'AI献立生成', headerShown: true, header: () => <CustomHeader title={'AI献立生成'} showBackButton={true} /> }} />
            <Stack.Screen name="mealDetail" options={{ title: '献立詳細', headerShown: true, header: () => <CustomHeader title={'献立詳細'} showBackButton={true} /> }} />
            <Stack.Screen name="preferences" options={{ title: '設定' }} />
            <Stack.Screen name="subscription" />
        </Stack>
    );
}