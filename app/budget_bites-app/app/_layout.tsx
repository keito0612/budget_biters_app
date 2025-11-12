
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { LoadingOverlay } from '../components/LoadingOverlay';

export default function Layout() {

    const { initialized } = useDatabase();

    if (!initialized) {
        return <LoadingOverlay />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
            <Stack.Screen name="preference-setup" />
            <Stack.Screen name="meal-plan-generate" />
            <Stack.Screen name="preferences" />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="restore" />
        </Stack>
    );
}