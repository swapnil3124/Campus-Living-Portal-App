import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { UtensilsCrossed, Calendar, CreditCard, Building2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { messMenu, notices } from '@/mocks/data';

export default function MessScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 450,
                delay: 200 + i * 120,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const messNotices = notices.filter(n => n.category === 'Mess');

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.card, { opacity: cardAnims[0], transform: [{ translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <UtensilsCrossed size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Current Menu</Text>
                </View>
                <Image
                    source={{ uri: messMenu.imageUrl }}
                    style={styles.menuImage}
                    contentFit="cover"
                />
                <View style={styles.menuInfo}>
                    <View style={styles.menuInfoRow}>
                        <Building2 size={14} color={Colors.textSecondary} />
                        <Text style={styles.menuInfoText}>{messMenu.hostelName} Hostel</Text>
                    </View>
                    <View style={styles.menuInfoRow}>
                        <Calendar size={14} color={Colors.textSecondary} />
                        <Text style={styles.menuInfoText}>{messMenu.startDate} – {messMenu.endDate}</Text>
                    </View>
                </View>
            </Animated.View>

            <Animated.View style={[styles.card, { opacity: cardAnims[1], transform: [{ translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <CreditCard size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Mess Fees</Text>
                </View>
                <LinearGradient colors={[Colors.primaryGhost, '#F5F5F5']} style={styles.feeCard}>
                    <Text style={styles.feeAmount}>{messMenu.fees}</Text>
                    <Text style={styles.feeLabel}>Monthly Mess Fee</Text>
                </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.card, { opacity: cardAnims[2], transform: [{ translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <Calendar size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Mess Notices</Text>
                </View>
                {messNotices.length > 0 ? (
                    messNotices.map((notice) => (
                        <View key={notice.id} style={styles.noticeItem}>
                            <View style={styles.noticeDot} />
                            <View style={styles.noticeText}>
                                <Text style={styles.noticeTitle}>{notice.title}</Text>
                                <Text style={styles.noticeDate}>{notice.date}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No mess notices at the moment</Text>
                )}
            </Animated.View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 16,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    menuImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 12,
    },
    menuInfo: {
        gap: 8,
    },
    menuInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuInfoText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    feeCard: {
        padding: 20,
        borderRadius: 14,
        alignItems: 'center',
    },
    feeAmount: {
        fontSize: 28,
        fontWeight: '800' as const,
        color: Colors.primaryDark,
    },
    feeLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    noticeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    noticeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginRight: 12,
    },
    noticeText: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: Colors.text,
    },
    noticeDate: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 2,
    },
    emptyText: {
        fontSize: 13,
        color: Colors.textLight,
        textAlign: 'center',
        paddingVertical: 16,
    },
});
