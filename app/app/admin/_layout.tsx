import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: Colors.primary },
                headerTintColor: Colors.white,
                headerTitleStyle: { fontWeight: '700' as const },
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen name="admission-management" options={{ title: 'Admission Management', headerShown: false }} />
            <Stack.Screen name="home-management" options={{ title: 'Home Management' }} />
            <Stack.Screen name="registration-settings" options={{ title: 'Registration Settings', headerShown: false }} />
            <Stack.Screen name="merit-list-results" options={{ title: 'Merit List Results' }} />
            <Stack.Screen name="merit-list-settings" options={{ title: 'Merit List Settings' }} />
            <Stack.Screen name="leave-management" options={{ title: 'Leave Management', headerShown: false }} />
        </Stack>
    );
}
