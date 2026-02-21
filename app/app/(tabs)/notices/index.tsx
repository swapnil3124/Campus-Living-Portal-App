import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Clock, User as UserIcon, AlertTriangle, Info, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { notices } from '@/mocks/data';
import { Notice } from '@/constants/types';

type FilterType = 'all' | 'urgent' | 'important' | 'normal';

const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'important', label: 'Important' },
    { key: 'normal', label: 'Normal' },
];

function NoticeCard({ notice, index }: { notice: Notice; index: number }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay: index * 80, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 450, delay: index * 80, useNativeDriver: true }),
        ]).start();
    }, []);

    const priorityConfig = {
        urgent: { color: Colors.error, bg: Colors.errorLight, icon: <AlertTriangle size={14} color={Colors.error} />, label: 'URGENT' },
        important: { color: Colors.warning, bg: Colors.warningLight, icon: <AlertCircle size={14} color={Colors.warning} />, label: 'IMPORTANT' },
        normal: { color: Colors.info, bg: Colors.infoLight, icon: <Info size={14} color={Colors.info} />, label: 'NORMAL' },
    };

    const config = priorityConfig[notice.priority];

    return (
        <Animated.View
            style={[
                styles.noticeCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    borderLeftColor: config.color,
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.95}
                onPressIn={() => {
                    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                onPressOut={() => {
                    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
                }}
            >
                <View style={styles.noticeCardInner}>
                    <View style={styles.noticeHeader}>
                        <View style={[styles.priorityBadge, { backgroundColor: config.bg }]}>
                            {config.icon}
                            <Text style={[styles.priorityText, { color: config.color }]}>{config.label}</Text>
                        </View>
                        {notice.isNew && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>NEW</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                    <Text style={styles.noticeDesc} numberOfLines={2}>{notice.description}</Text>
                    <View style={styles.noticeMeta}>
                        <View style={styles.metaItem}>
                            <Clock size={12} color={Colors.textLight} />
                            <Text style={styles.metaText}>{notice.date}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <UserIcon size={12} color={Colors.textLight} />
                            <Text style={styles.metaText}>{notice.issuedBy}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function NoticesScreen() {
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    const filteredNotices = activeFilter === 'all'
        ? notices
        : notices.filter(n => n.priority === activeFilter);

    const handleFilter = useCallback((filter: FilterType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveFilter(filter);
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
            >
                <View style={styles.headerRow}>
                    <Bell size={24} color={Colors.white} />
                    <Text style={styles.headerTitle}>Notice Board</Text>
                </View>
                <Text style={styles.headerSubtitle}>Official hostel announcements</Text>
            </LinearGradient>

            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {filters.map((f) => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                            onPress={() => handleFilter(f.key)}
                        >
                            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredNotices.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Bell size={48} color={Colors.textLight} />
                        <Text style={styles.emptyText}>No notices found</Text>
                    </View>
                ) : (
                    filteredNotices.map((notice, index) => (
                        <NoticeCard key={notice.id} notice={notice} index={index} />
                    ))
                )}
                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginLeft: 34,
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
    filterChipActive: {
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
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    noticeCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    noticeCardInner: {
        padding: 16,
    },
    noticeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700' as const,
        letterSpacing: 0.5,
    },
    newBadge: {
        backgroundColor: Colors.error,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    newBadgeText: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    noticeTitle: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
        marginBottom: 6,
        lineHeight: 20,
    },
    noticeDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        marginBottom: 12,
    },
    noticeMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: Colors.textLight,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textLight,
    },
});
