import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Siren,
    Phone,
    Shield,
    Flame,
    Heart,
    AlertTriangle,
    Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { emergencyTypes } from '@/mocks/data';

const emergencyIcons: Record<string, React.ReactNode> = {
    'Medical Emergency': <Heart size={24} color={Colors.white} />,
    'Fire': <Flame size={24} color={Colors.white} />,
    'Security Threat': <Shield size={24} color={Colors.white} />,
    'Natural Disaster': <AlertTriangle size={24} color={Colors.white} />,
    'Other': <Siren size={24} color={Colors.white} />,
};

const emergencyColors: Record<string, [string, string]> = {
    'Medical Emergency': ['#C62828', '#E53935'],
    'Fire': ['#E65100', '#FF6D00'],
    'Security Threat': ['#4A148C', '#7B1FA2'],
    'Natural Disaster': ['#1B5E20', '#2E7D32'],
    'Other': ['#37474F', '#546E7A'],
};

export default function EmergencyScreen() {
    const { student } = useAuth();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef(emergencyTypes.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                delay: 300 + i * 80,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const handleEmergency = useCallback((type: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
            'Emergency Alert',
            `Are you sure you want to trigger a ${type} alert? This will notify the warden and security immediately.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Alert',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert(
                            'Alert Sent',
                            `Emergency alert for "${type}" has been sent to the warden and security team. Stay calm and wait for assistance.`
                        );
                    },
                },
            ]
        );
    }, []);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.warningBanner, { opacity: fadeAnim, transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient colors={['#C62828', '#D32F2F']} style={styles.warningGradient}>
                    <Siren size={32} color={Colors.white} />
                    <Text style={styles.warningTitle}>Emergency Section</Text>
                    <Text style={styles.warningDesc}>
                        Use only in genuine emergencies. Alerts are sent to warden and security in real-time.
                    </Text>
                </LinearGradient>
            </Animated.View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Select Emergency Type</Text>
                {emergencyTypes.map((type, index) => {
                    const colors: [string, string] = emergencyColors[type] ?? ['#37474F', '#546E7A'];
                    return (
                        <Animated.View
                            key={type}
                            style={{
                                opacity: cardAnims[index],
                                transform: [{ translateY: cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                            }}
                        >
                            <TouchableOpacity
                                style={styles.emergencyCard}
                                onPress={() => handleEmergency(type)}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={colors}
                                    style={styles.emergencyGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <View style={styles.emergencyIcon}>
                                        {emergencyIcons[type]}
                                    </View>
                                    <View style={styles.emergencyText}>
                                        <Text style={styles.emergencyType}>{type}</Text>
                                        <Text style={styles.emergencyAction}>Tap to send alert</Text>
                                    </View>
                                    <Siren size={18} color="rgba(255,255,255,0.5)" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>What happens when you press?</Text>
                    {[
                        'Your Student ID and room details are captured',
                        'Emergency type with timestamp is recorded',
                        'Warden receives instant notification',
                        'Security team is alerted immediately',
                        'Emergency history is stored for records',
                    ].map((item, i) => (
                        <View key={i} style={styles.infoItem}>
                            <View style={styles.infoBullet}>
                                <Text style={styles.infoBulletText}>{i + 1}</Text>
                            </View>
                            <Text style={styles.infoItemText}>{item}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.quickContacts}>
                    <Text style={styles.sectionTitle}>Quick Contacts</Text>
                    <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
                        <Phone size={18} color={Colors.error} />
                        <View>
                            <Text style={styles.contactName}>Warden</Text>
                            <Text style={styles.contactNum}>7972565738</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
                        <Phone size={18} color={Colors.error} />
                        <View>
                            <Text style={styles.contactName}>Security</Text>
                            <Text style={styles.contactNum}>112</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    warningBanner: {
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    warningGradient: {
        padding: 24,
        alignItems: 'center',
        borderRadius: 16,
    },
    warningTitle: {
        fontSize: 20,
        fontWeight: '700' as const,
        color: Colors.white,
        marginTop: 12,
    },
    warningDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
    },
    content: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 12,
    },
    emergencyCard: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 10,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    emergencyGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 14,
    },
    emergencyIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    emergencyText: {
        flex: 1,
    },
    emergencyType: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    emergencyAction: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 18,
        marginTop: 16,
        marginBottom: 20,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
        marginBottom: 14,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoBullet: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.primaryGhost,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    infoBulletText: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.primary,
    },
    infoItemText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    quickContacts: {
        marginBottom: 20,
    },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    contactName: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    contactNum: {
        fontSize: 13,
        color: Colors.error,
        fontWeight: '500' as const,
    },
});
