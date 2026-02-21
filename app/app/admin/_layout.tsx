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
            <Stack.Screen name="home-management" options={{ title: 'Home Management' }} />
            <Stack.Screen name="registrations" options={{ title: 'Student Registrations' }} />
            <Stack.Screen name="complaints" options={{ title: 'Complaints Management' }} />
        </Stack>
    );
}
