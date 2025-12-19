import { useDatabase } from '../hooks/useDatabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Stack } from 'expo-router';
import React from "react";
import { Text, ActivityIndicator } from 'react-native'; // 追加
import { CustomHeader } from '../components/custom/CustomHeader';
import { TrackingProvider } from '../contexts/TrackingContext';
import { NotifaicationPermissionProvider } from '../contexts/NotifaicationPermissionContext';
import BackgroundFetch, { HeadlessEvent } from 'react-native-background-fetch';
import { ServiceFactory } from '../factories/serviceFactory';

BackgroundFetch.registerHeadlessTask(async (event: HeadlessEvent) => {
    const mealPlanService = ServiceFactory.createMealPlanService();
    const backgroundService = ServiceFactory.createBackgroundService();
    await backgroundService.updateHeadlessTask(event, async () => {
        await mealPlanService.updateMealPlanTodayNotifications();
    });
});

export default function Layout() {

    const { initialized, loading, error } = useDatabase();

    if (loading) {
        return <LoadingOverlay visible={loading} />;
    }

    if (error) {
        return <Text>データベース初期化エラー: {error.message}</Text>;
    }

    return (
        <NotifaicationPermissionProvider>
            <TrackingProvider>
                <Stack >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ title: 'ログイン', presentation: 'modal', headerShown: false }} />
                    <Stack.Screen name="preferenceSetUp" singular={true} options={{ title: '初期設定', headerShown: true, header: () => <CustomHeader title={'初期設定'} showBackButton={true} /> }} />
                    <Stack.Screen name="mealPlanGenerate" options={{ title: 'AI献立生成', headerShown: true, header: () => <CustomHeader title={'AI献立生成'} showBackButton={true} /> }} />
                    <Stack.Screen name="mealDetail" options={{ title: '献立詳細', headerShown: true, header: () => <CustomHeader title={'献立詳細'} showBackButton={true} /> }} />
                    <Stack.Screen name="mealTime" singular={true} options={{ title: '献立通知', headerShown: true, header: (props) => <CustomHeader title={props.options.title} showBackButton={true} /> }} />
                    <Stack.Screen name="preferences" options={{ title: '設定' }} />
                    <Stack.Screen name="budgetEdit" options={{ title: '食費予算編集', headerShown: true, header: (props) => <CustomHeader title={props.options.title} showBackButton={true} /> }} />
                    <Stack.Screen name="subscription" options={{ presentation: 'modal', headerShown: false }} />
                </Stack>
            </TrackingProvider >
        </NotifaicationPermissionProvider>
    );
}