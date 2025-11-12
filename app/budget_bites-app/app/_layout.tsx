import { useDatabase } from '../hooks/useDatabase';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Stack } from 'expo-router';
import React from "react";


export default function Layout() {

    const { initialized } = useDatabase();

    if (!initialized) {
        return <LoadingOverlay />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
            <Stack.Screen name="preferenceSetUp" singular={true} />
            <Stack.Screen name="mealPlanGenerate" />
            <Stack.Screen name="preferences" />
            <Stack.Screen name="subscription" />
        </Stack>
    );
}