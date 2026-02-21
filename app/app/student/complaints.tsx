import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { Plus, Clock, MessageSquare, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { mockComplaints } from '@/mocks/data';
import { Complaint } from '@/constants/types';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    'pending': { bg: '#FFF3E0', text: '#E65100', label: 'Pending' },
    'in-progress': { bg: Colors.infoLight, text: Colors.info, label: 'In Progress' },
    'resolved': { bg: Colors.successLight, text: Colors.success, label: 'Resolved' },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
    'low': { bg: Colors.successLight, text: Colors.success },
    'medium': { bg: Colors.warningLight, text: '#E65100' },
    'high': { bg: Colors.errorLight, text: Colors.error },
};

function ComplaintCard({ complaint, index }: { complaint: Complaint; index: number }) {
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

    const status = statusConfig[complaint.status];
    const priority = priorityConfig[complaint.priority];

    return (
        <Animated.View style={[styles.complaintCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                activeOpacity={0.95}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
            >
                <View style={styles.complaintHeader}>
                    <View style={styles.complaintTypeRow}>
                        <View style={[styles.typeBadge, { backgroundColor: priority.bg }]}>
                            <Text style={[styles.typeText, { color: priority.text }]}>{complaint.type}</Text>
                        </View>
                        <View style={[styles.priorityDot, { backgroundColor: priority.text }]} />
                        <Text style={[styles.priorityLabel, { color: priority.text }]}>{complaint.priority}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                </View>
                <Text style={styles.complaintDesc} numberOfLines={2}>{complaint.description}</Text>
                {complaint.wardenRemark && (
                    <View style={styles.remarkBox}>
                        <MessageSquare size={12} color={Colors.primary} />
                        <Text style={styles.remarkText}>{complaint.wardenRemark}</Text>
                    </View>
                )}
                <View style={styles.complaintFooter}>
                    <Clock size={12} color={Colors.textLight} />
                    <Text style={styles.dateText}>{complaint.createdAt}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function ComplaintsScreen() {
    const router = useRouter();
    const [filter, setFilter] = useState<string>('all');

    const filtered = filter === 'all'
        ? mockComplaints
        : mockComplaints.filter(c => c.status === filter);

    return (
        <View style={styles.container}>
            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['all', 'pending', 'in-progress', 'resolved'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.filterActive]}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f === 'all' ? 'All' : statusConfig[f]?.label ?? f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {filtered.map((complaint, index) => (
                    <ComplaintCard key={complaint.id} complaint={complaint} index={index} />
                ))}
                {filtered.length === 0 && (
                    <View style={styles.emptyState}>
                        <MessageSquare size={48} color={Colors.textLight} />
                        <Text style={styles.emptyText}>No complaints found</Text>
                    </View>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/student/new-complaint' as any);
                }}
                activeOpacity={0.85}
                testID="new-complaint-btn"
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
    filterRow: {
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filterScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500' as const,
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: Colors.white,
    },
    listContent: {
        padding: 16,
    },
    complaintCard: {
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
    complaintHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    complaintTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600' as const,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    priorityLabel: {
        fontSize: 11,
        fontWeight: '500' as const,
        textTransform: 'capitalize' as const,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600' as const,
    },
    complaintDesc: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
        marginBottom: 10,
    },
    remarkBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.primaryGhost,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    remarkText: {
        flex: 1,
        fontSize: 12,
        color: Colors.primaryDark,
        lineHeight: 17,
    },
    complaintFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        color: Colors.textLight,
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
