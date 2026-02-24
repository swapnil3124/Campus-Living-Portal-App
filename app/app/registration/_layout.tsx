import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function RegistrationLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: Colors.primary },
                headerTintColor: Colors.white,
                headerTitleStyle: { fontWeight: '700' as const },
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Admission Form' }} />
        </Stack>
    );
}
