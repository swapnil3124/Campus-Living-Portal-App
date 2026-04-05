import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { useAdmissionStore } from '@/store/admission-store';
import { useAnnouncementStore } from '@/store/announcement-store';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/constants/config';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RealTimePoller() {
    const fetchAdmissions = useAdmissionStore(state => state.fetchAdmissions);
    const fetchMeritLists = useAdmissionStore(state => state.fetchMeritLists);
    const fetchAnnouncements = useAnnouncementStore(state => state.fetchAnnouncements);
    const fetchActiveAnnouncements = useAnnouncementStore(state => state.fetchActiveAnnouncements);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket'], // Preferred for React Native
        });

        socket.on('connect', () => {
            console.log('Socket attached real-time updates.');
            // Initial fetch to ensure up-to-date data upon connection
            fetchAdmissions();
            fetchMeritLists();
            fetchAnnouncements();
            fetchActiveAnnouncements();
        });

        socket.on('admissions_updated', () => {
            fetchAdmissions();
        });

        socket.on('merits_updated', () => {
            fetchMeritLists();
        });

        socket.on('announcements_updated', () => {
            fetchAnnouncements();
            fetchActiveAnnouncements();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchAdmissions, fetchMeritLists, fetchAnnouncements, fetchActiveAnnouncements]);

    return null;
}

function RootLayoutNav() {
    return (
        <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="registration" options={{ headerShown: false }} />
            <Stack.Screen
                name="admin"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="student"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    );
}

export default function RootLayout() {
    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView>
                <AuthProvider>
                    <RealTimePoller />
                    <RootLayoutNav />
                </AuthProvider>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}
