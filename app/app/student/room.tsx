import React, { useEffect, useRef, useCallback } from 'react';
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
    BedDouble,
    Users,
    Package,
    CircleCheck as CheckCircle2,
    AlertTriangle,
    CircleX as XCircle,
    Flag,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { roomAssets, roommates } from '@/mocks/data';

const assetStatusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    working: { icon: <CheckCircle2 size={16} color={Colors.success} />, color: Colors.success, bg: Colors.successLight },
    damaged: { icon: <AlertTriangle size={16} color={Colors.warning} />, color: '#E65100', bg: Colors.warningLight },
    missing: { icon: <XCircle size={16} color={Colors.error} />, color: Colors.error, bg: Colors.errorLight },
};

export default function RoomScreen() {
    const { student } = useAuth();
    const cardAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 450,
                delay: 100 + i * 120,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const handleReportDamage = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Report Damage', 'This will notify the warden about damaged assets in your room. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Report', style: 'destructive', onPress: () => Alert.alert('Reported', 'Damage report submitted successfully.') },
        ]);
    }, []);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.card, { opacity: cardAnims[0], transform: [{ translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <BedDouble size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Room Details</Text>
                </View>
                <LinearGradient colors={[Colors.primaryGhost, '#F5F5F5']} style={styles.roomInfo}>
                    <View style={styles.roomGrid}>
                        <View style={styles.roomStat}>
                            <Text style={styles.roomStatLabel}>Hostel</Text>
                            <Text style={styles.roomStatValue}>{student?.hostelName ?? '-'}</Text>
                        </View>
                        <View style={styles.roomStat}>
                            <Text style={styles.roomStatLabel}>Room No</Text>
                            <Text style={styles.roomStatValue}>{student?.roomNo ?? '-'}</Text>
                        </View>
                        <View style={styles.roomStat}>
                            <Text style={styles.roomStatLabel}>Floor</Text>
                            <Text style={styles.roomStatValue}>{student?.floor ?? '-'}</Text>
                        </View>
                        <View style={styles.roomStat}>
                            <Text style={styles.roomStatLabel}>Bed</Text>
                            <Text style={styles.roomStatValue}>{student?.bedNumber ?? '-'}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.card, { opacity: cardAnims[1], transform: [{ translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <Users size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Roommates</Text>
                </View>
                {roommates.map((mate, index) => (
                    <View key={index} style={[styles.mateRow, index < roommates.length - 1 && styles.mateBorder]}>
                        <View style={styles.mateAvatar}>
                            <Text style={styles.mateInitial}>{mate.name[0]}</Text>
                        </View>
                        <View style={styles.mateInfo}>
                            <Text style={styles.mateName}>{mate.name}</Text>
                            <Text style={styles.mateBranch}>{mate.branch} • {mate.year}</Text>
                        </View>
                    </View>
                ))}
            </Animated.View>

            <Animated.View style={[styles.card, { opacity: cardAnims[2], transform: [{ translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <Package size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Room Assets</Text>
                </View>
                {roomAssets.map((asset, index) => {
                    const config = assetStatusConfig[asset.status];
                    return (
                        <View key={index} style={[styles.assetRow, index < roomAssets.length - 1 && styles.assetBorder]}>
                            <Text style={styles.assetName}>{asset.name}</Text>
                            <View style={[styles.assetStatus, { backgroundColor: config.bg }]}>
                                {config.icon}
                                <Text style={[styles.assetStatusText, { color: config.color }]}>
                                    {asset.status}
                                </Text>
                            </View>
                        </View>
                    );
                })}

                <TouchableOpacity style={styles.reportBtn} onPress={handleReportDamage} activeOpacity={0.85}>
                    <Flag size={16} color={Colors.error} />
                    <Text style={styles.reportBtnText}>Report Damage</Text>
                </TouchableOpacity>
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
    roomInfo: {
        borderRadius: 14,
        padding: 16,
    },
    roomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    roomStat: {
        width: '46%' as any,
        flexGrow: 1,
    },
    roomStatLabel: {
        fontSize: 11,
        color: Colors.textLight,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    roomStatValue: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.primaryDark,
    },
    mateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    mateBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    mateAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    mateInitial: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.primaryDark,
    },
    mateInfo: {
        flex: 1,
    },
    mateName: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    mateBranch: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    assetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    assetBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    assetName: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: Colors.text,
    },
    assetStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    assetStatusText: {
        fontSize: 12,
        fontWeight: '500' as const,
        textTransform: 'capitalize' as const,
    },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.errorLight,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 14,
    },
    reportBtnText: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.error,
    },
});
