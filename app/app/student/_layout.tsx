import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function StudentLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: Colors.primary },
                headerTintColor: Colors.white,
                headerTitleStyle: { fontWeight: '600' as const },
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
            <Stack.Screen name="complaints" options={{ title: 'Complaints' }} />
            <Stack.Screen name="new-complaint" options={{ title: 'New Complaint', presentation: 'modal' }} />
            <Stack.Screen name="mess" options={{ title: 'Mess' }} />
            <Stack.Screen name="room" options={{ title: 'Room Info' }} />
            <Stack.Screen name="leave" options={{ title: 'Leave Applications' }} />
            <Stack.Screen name="new-leave" options={{ title: 'Apply Leave', presentation: 'modal' }} />
            <Stack.Screen name="emergency" options={{ title: 'Emergency', headerStyle: { backgroundColor: Colors.error } }} />
        </Stack>
    );
}
