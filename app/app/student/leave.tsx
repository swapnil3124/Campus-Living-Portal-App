import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
} from 'react-native';
import {
    Plus,
    Clock,
    MapPin,
    CalendarDays,
    Download,
    CircleCheck as CheckCircle2,
    CircleX as XCircle,
    Timer,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { mockLeaves } from '@/mocks/data';
import { LeaveApplication } from '@/constants/types';

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    pending: { bg: Colors.warningLight, text: '#E65100', label: 'Pending', icon: <Timer size={14} color="#E65100" /> },
    approved: { bg: Colors.successLight, text: Colors.success, label: 'Approved', icon: <CheckCircle2 size={14} color={Colors.success} /> },
    rejected: { bg: Colors.errorLight, text: Colors.error, label: 'Rejected', icon: <XCircle size={14} color={Colors.error} /> },
};

function LeaveCard({ leave, index }: { leave: LeaveApplication; index: number }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, []);

    const status = statusConfig[leave.status];

    return (
        <Animated.View style={[styles.leaveCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                activeOpacity={0.95}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
            >
                <View style={styles.leaveHeader}>
                    <View style={styles.leaveTypeWrap}>
                        <CalendarDays size={16} color={Colors.primary} />
                        <Text style={styles.leaveType}>{leave.leaveType}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        {status.icon}
                        <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.leaveDates}>
                    <View style={styles.dateBlock}>
                        <Text style={styles.dateLabel}>From</Text>
                        <Text style={styles.dateValue}>{leave.fromDate}</Text>
                    </View>
                    <View style={styles.dateSeparator}>
                        <Text style={styles.dateSepText}>→</Text>
                    </View>
                    <View style={styles.dateBlock}>
                        <Text style={styles.dateLabel}>To</Text>
                        <Text style={styles.dateValue}>{leave.toDate}</Text>
                    </View>
                </View>

                <View style={styles.leaveDetails}>
                    <View style={styles.detailRow}>
                        <MapPin size={12} color={Colors.textLight} />
                        <Text style={styles.detailText}>{leave.destination}</Text>
                    </View>
                    <Text style={styles.leaveReason}>{leave.reason}</Text>
                </View>

                {leave.status === 'approved' && (
                    <TouchableOpacity
                        style={styles.gatePassBtn}
                        onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
                        activeOpacity={0.85}
                    >
                        <Download size={14} color={Colors.primary} />
                        <Text style={styles.gatePassText}>Download Gate Pass</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function LeaveScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {mockLeaves.map((leave, index) => (
                    <LeaveCard key={leave.id} leave={leave} index={index} />
                ))}
                {mockLeaves.length === 0 && (
                    <View style={styles.emptyState}>
                        <CalendarDays size={48} color={Colors.textLight} />
                        <Text style={styles.emptyText}>No leave applications</Text>
                    </View>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/student/new-leave' as any);
                }}
                activeOpacity={0.85}
                testID="new-leave-btn"
            >
                <Plus size={24} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: 16,
    },
    leaveCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    leaveHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    leaveTypeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    leaveType: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600' as const,
    },
    leaveDates: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    dateBlock: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 10,
        color: Colors.textLight,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    dateSeparator: {
        paddingHorizontal: 12,
    },
    dateSepText: {
        fontSize: 16,
        color: Colors.textLight,
    },
    leaveDetails: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    leaveReason: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    gatePassBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primaryGhost,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 12,
    },
    gatePassText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textLight,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
});
