import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboardingCompleted';

export default function IndexScreen() {
    const [loading, setLoading] = useState(true);
    const [onboardingDone, setOnboardingDone] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(ONBOARDING_KEY)
            .then((value) => {
                setOnboardingDone(value === 'true');
                setLoading(false);
            })
            .catch(() => {
                // If AsyncStorage fails, show onboarding to be safe
                setOnboardingDone(false);
                setLoading(false);
            });
    }, []);

    // While checking storage, show a plain loader (no white flash)
    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#00897B" />
            </View>
        );
    }

    // Redirect based on the flag — Redirect component works inside the Stack
    if (onboardingDone) {
        return <Redirect href="/(tabs)/(home)" />;
    }

    return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#005B4F',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
