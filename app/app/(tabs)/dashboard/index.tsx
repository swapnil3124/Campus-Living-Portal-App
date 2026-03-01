import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
    UserCircle,
    MessageSquare,
    UtensilsCrossed,
    BedDouble,
    CalendarDays,
    Siren,
    ChevronRight,
    Lock,
    Home,
    FileText,
    ClipboardList,
    Calendar,
    Users,
    Building2,
    ShieldCheck,
    LogOut,
    Bell,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmissionStore } from '@/store/admission-store';

const dashboardItems = [
    { key: 'profile', label: 'My Profile', icon: UserCircle, color: '#1565C0', bg: '#E3F2FD', route: '/student/profile' },
    { key: 'complaints', label: 'Complaints', icon: MessageSquare, color: '#E65100', bg: '#FFF3E0', route: '/student/complaints' },
    { key: 'mess', label: 'Mess', icon: UtensilsCrossed, color: '#2E7D32', bg: '#E8F5E9', route: '/student/mess' },
    { key: 'room', label: 'Room Info', icon: BedDouble, color: '#6A1B9A', bg: '#F3E5F5', route: '/student/room' },
    { key: 'leave', label: 'Leave', icon: CalendarDays, color: '#00838F', bg: '#E0F7FA', route: '/student/leave' },
    { key: 'emergency', label: 'Emergency', icon: Siren, color: '#C62828', bg: '#FFEBEE', route: '/student/emergency' },
];

const adminDashboardItems = [
    { key: 'admission', label: 'Admission Management', icon: ClipboardList, color: '#00897B', bg: '#E0F2F1', route: '/admin/admission-management' },
    { key: 'reg-settings', label: 'Registration Settings', icon: Calendar, color: Colors.primary, bg: Colors.primaryGhost, route: '/admin/registration-settings' },
    { key: 'home-mgmt', label: 'Manage Home UI', icon: Home, color: '#1565C0', bg: '#E3F2FD', route: '/admin/home-management' },
    { key: 'students', label: 'Student Management', icon: Users, color: '#2E7D32', bg: '#E8F5E9', route: '/admin/students' },
    { key: 'notices', label: 'Notice Management', icon: FileText, color: '#6A1B9A', bg: '#F3E5F5', route: '/admin/notices' },
    { key: 'complaints', label: 'Complaint Management', icon: MessageSquare, color: '#E65100', bg: '#FFF3E0', route: '/admin/complaints' },
    { key: 'mess', label: 'Mess Management', icon: UtensilsCrossed, color: '#D84315', bg: '#FBE9E7', route: '/admin/mess' },
    { key: 'hostel', label: 'Room & Hostel Mgmt', icon: Building2, color: '#00695C', bg: '#E0F2F1', route: '/admin/hostel' },
    { key: 'leave', label: 'Leave Management', icon: CalendarDays, color: '#00838F', bg: '#E0F7FA', route: '/admin/leave-management' },
    { key: 'emergency', label: 'Emergency Mgmt', icon: Siren, color: '#C62828', bg: '#FFEBEE', route: '/admin/emergency' },
    { key: 'exit', label: 'Hostel Exit Mgmt', icon: LogOut, color: '#455A64', bg: '#ECEFF1', route: '/admin/exit' },
    { key: 'announcements', label: 'Announcements', icon: Bell, color: '#D81B60', bg: '#FCE4EC', route: '/admin/announcements' },
];

const boysRectorDashboardItems = [
    { key: 'admission', label: 'Admission Review', icon: ClipboardList, color: '#00897B', bg: '#E0F2F1', route: '/admin/merit-list-results' },
    { key: 'students', label: 'Student Directory', icon: Users, color: '#2E7D32', bg: '#E8F5E9', route: '/admin/students' },
    { key: 'notices', label: 'Official Notices', icon: FileText, color: '#6A1B9A', bg: '#F3E5F5', route: '/admin/notices' },
    { key: 'hostel', label: 'Campus Overview', icon: Building2, color: '#00695C', bg: '#E0F2F1', route: '/admin/hostel' },
    { key: 'leave', label: 'Leave Approvals', icon: CalendarDays, color: '#00838F', bg: '#E0F7FA', route: '/admin/leave-management' },
    { key: 'announcements', label: 'Announcements', icon: Bell, color: '#D81B60', bg: '#FCE4EC', route: '/admin/announcements' },
];

const girlsRectorDashboardItems = [
    { key: 'admission', label: 'Admission Review', icon: ClipboardList, color: '#00897B', bg: '#E0F2F1', route: '/admin/admission-management' },
    { key: 'reg-settings', label: 'Registration Settings', icon: Calendar, color: Colors.primary, bg: Colors.primaryGhost, route: '/admin/registration-settings' },
    { key: 'students', label: 'Student Directory', icon: Users, color: '#2E7D32', bg: '#E8F5E9', route: '/admin/students' },
    { key: 'notices', label: 'Official Notices', icon: FileText, color: '#6A1B9A', bg: '#F3E5F5', route: '/admin/notices' },
    { key: 'hostel', label: 'Campus Overview', icon: Building2, color: '#00695C', bg: '#E0F2F1', route: '/admin/hostel' },
    { key: 'leave', label: 'Leave Approvals', icon: CalendarDays, color: '#00838F', bg: '#E0F7FA', route: '/admin/leave-management' },
    { key: 'announcements', label: 'Announcements', icon: Bell, color: '#D81B60', bg: '#FCE4EC', route: '/admin/announcements' },
];

const contractorDashboardItems = [
    { key: 'mess', label: 'Menu Management', icon: UtensilsCrossed, color: '#D84315', bg: '#FBE9E7', route: '/admin/mess' },
    { key: 'students', label: 'Student Count', icon: Users, color: '#2E7D32', bg: '#E8F5E9', route: '/admin/students' },
    { key: 'complaints', label: 'Food Feedback', icon: MessageSquare, color: '#E65100', bg: '#FFF3E0', route: '/admin/complaints' },
    { key: 'notices', label: 'Mess Notices', icon: FileText, color: '#6A1B9A', bg: '#F3E5F5', route: '/admin/notices' },
];

const watchmanDashboardItems = [
    { key: 'exit', label: 'Entry/Exit Logs', icon: LogOut, color: '#455A64', bg: '#ECEFF1', route: '/admin/exit' },
    { key: 'emergency', label: 'Emergency Alerts', icon: Siren, color: '#C62828', bg: '#FFEBEE', route: '/admin/emergency' },
    { key: 'students', label: 'Student Verifier', icon: Users, color: '#2E7D32', bg: '#E8F5E9', route: '/admin/students' },
    { key: 'notices', label: 'Station Orders', icon: FileText, color: '#6A1B9A', bg: '#F3E5F5', route: '/admin/notices' },
];

function StudentDashboard() {
    const { student } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef(dashboardItems.map(() => new Animated.Value(0))).current;
    const scaleAnims = useRef(dashboardItems.map(() => new Animated.Value(1))).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                delay: 200 + i * 80,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const handlePressIn = (index: number) => {
        Animated.spring(scaleAnims[index], { toValue: 0.92, useNativeDriver: true }).start();
    };

    const handlePressOut = (index: number) => {
        Animated.spring(scaleAnims[index], { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };


    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary, '#26A69A']}
                style={[styles.dashHeader, { paddingTop: insets.top + 12 }]}
            >
                <Animated.View style={[styles.profileRow, { opacity: fadeAnim }]}>
                    <Image
                        source={{ uri: student?.photoUrl }}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{student?.name ?? 'Student'}</Text>
                        <Text style={styles.profileEnroll}>{student?.enrollmentNo}</Text>
                        <View style={styles.profileBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.profileStatus}>{student?.status === 'active' ? 'Active' : student?.status}</Text>
                            <Text style={styles.profileHostel}> • {student?.hostelName}</Text>
                        </View>
                    </View>
                </Animated.View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.dashContent} showsVerticalScrollIndicator={false}>
                <View style={styles.gridContainer}>
                    {dashboardItems.map((item, index) => {
                        const IconComp = item.icon;
                        return (
                            <Animated.View
                                key={item.key}
                                style={[
                                    styles.gridItem,
                                    {
                                        opacity: cardAnims[index],
                                        transform: [
                                            { translateY: cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                                            { scale: scaleAnims[index] },
                                        ],
                                    },
                                ]}
                            >
                                <TouchableOpacity
                                    style={styles.gridCard}
                                    activeOpacity={0.9}
                                    onPressIn={() => { handlePressIn(index); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                    onPressOut={() => handlePressOut(index)}
                                    onPress={() => router.push(item.route as any)}
                                    testID={`dash-${item.key}`}
                                >
                                    <View style={[styles.gridIconWrap, { backgroundColor: item.bg }]}>
                                        <IconComp size={26} color={item.color} />
                                    </View>
                                    <Text style={styles.gridLabel}>{item.label}</Text>
                                    <ChevronRight size={14} color={Colors.textLight} style={styles.gridArrow} />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>


                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

function StaffDashboard() {
    const router = useRouter();
    const { role, subRole } = useAuth();
    const { admissions, fetchAdmissions } = useAdmissionStore();
    const pendingAdmissions = admissions.filter(a => a.status === 'pending').length;
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const isGirlsHostel = typeof subRole === 'string' && ['saraswati', 'shwetambara', 'shwetamber', 'girls'].includes(subRole.toLowerCase());

    const items = useMemo(() => {
        switch (role) {
            case 'rector':
                return isGirlsHostel ? girlsRectorDashboardItems : boysRectorDashboardItems;
            case 'contractor': return contractorDashboardItems;
            case 'watchman': return watchmanDashboardItems;
            default:
                return (role === 'admin' && isGirlsHostel)
                    ? adminDashboardItems.filter(item => item.key !== 'admission' && item.key !== 'reg-settings')
                    : adminDashboardItems;
        }
    }, [role, isGirlsHostel]);

    const cardAnims = useRef(items.map(() => new Animated.Value(0))).current;
    const scaleAnims = useRef(items.map(() => new Animated.Value(1))).current;

    const roleInfo = useMemo(() => {
        switch (role) {
            case 'rector': return { title: 'Rector', icon: UserCircle, color: '#7B1FA2' };
            case 'contractor': return { title: 'Mess Contractor', icon: UtensilsCrossed, color: '#2E7D32' };
            case 'watchman': return { title: 'Watchman', icon: Building2, color: '#E65100' };
            default: return { title: 'Warden', icon: ShieldCheck, color: Colors.primary };
        }
    }, [role]);

    useEffect(() => {
        if ((role === 'rector' && isGirlsHostel) || (role === 'admin' && !isGirlsHostel)) {
            fetchAdmissions();
        }
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, { toValue: 1, duration: 400, delay: 200 + i * 80, useNativeDriver: true }).start();
        });
    }, [role, items, isGirlsHostel]);

    const handlePressIn = (i: number) => Animated.spring(scaleAnims[i], { toValue: 0.92, useNativeDriver: true }).start();
    const handlePressOut = (i: number) => Animated.spring(scaleAnims[i], { toValue: 1, friction: 3, useNativeDriver: true }).start();

    const Icon = roleInfo.icon;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#004d40', Colors.primary, '#26A69A']}
                style={[styles.dashHeader, { paddingTop: insets.top + 12 }]}
            >
                <Animated.View style={[{ opacity: fadeAnim }]}>
                    <View style={styles.adminBadgeRow}>
                        <View style={[styles.adminIconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Icon size={28} color={Colors.white} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {role === 'rector' ? `${subRole?.toUpperCase()} HOSTEL DASHBOARD` : roleInfo.title}
                            </Text>
                            <Text style={styles.profileEnroll}>Government Polytechnic Awasari</Text>
                            <View style={styles.profileBadge}>
                                <View style={[styles.statusDot, { backgroundColor: '#69F0AE' }]} />
                                <Text style={styles.profileStatus}>
                                    {role === 'rector' && subRole ? `${subRole.charAt(0).toUpperCase() + subRole.slice(1)} Hostel Rector` : `${roleInfo.title} Control Panel`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.dashContent} showsVerticalScrollIndicator={false}>
                {((role === 'rector' && isGirlsHostel) || (role === 'admin' && !isGirlsHostel)) && (
                    <View style={styles.adminStatsRow}>
                        <View style={styles.adminStatCard}>
                            <Text style={styles.adminStatVal}>{pendingAdmissions}</Text>
                            <Text style={styles.adminStatLab}>Pending Admissions</Text>
                        </View>
                        <View style={styles.adminStatCard}>
                            <Text style={[styles.adminStatVal, { color: Colors.error }]}>5</Text>
                            <Text style={styles.adminStatLab}>Open Complaints</Text>
                        </View>
                    </View>
                )}

                {(role === 'admin' && isGirlsHostel) && (
                    <View style={styles.adminStatsRow}>
                        <View style={styles.adminStatCard}>
                            <Text style={[styles.adminStatVal, { color: Colors.error }]}>5</Text>
                            <Text style={styles.adminStatLab}>Open Complaints</Text>
                        </View>
                    </View>
                )}

                {role === 'rector' && !isGirlsHostel && (
                    <View style={styles.adminStatsRow}>
                        <View style={styles.adminStatCard}>
                            <Text style={[styles.adminStatVal, { color: Colors.error }]}>5</Text>
                            <Text style={styles.adminStatLab}>Open Complaints</Text>
                        </View>
                    </View>
                )}

                <Text style={styles.adminSectionTitle}>Management Tools</Text>
                <View style={styles.gridContainer}>
                    {items.map((item, index) => {
                        const IconComp = item.icon;
                        return (
                            <Animated.View
                                key={item.key}
                                style={[
                                    styles.gridItem,
                                    {
                                        opacity: cardAnims[index] || 1,
                                        transform: [
                                            { translateY: (cardAnims[index] || new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                                            { scale: scaleAnims[index] || 1 },
                                        ],
                                    },
                                ]}
                            >
                                <TouchableOpacity
                                    style={styles.gridCard}
                                    activeOpacity={0.9}
                                    onPressIn={() => { handlePressIn(index); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                    onPressOut={() => handlePressOut(index)}
                                    onPress={() => router.push(item.route as any)}
                                    testID={`staff-${item.key}`}
                                >
                                    <View style={[styles.gridIconWrap, { backgroundColor: item.bg }]}>
                                        <IconComp size={26} color={item.color} />
                                    </View>
                                    <Text style={styles.gridLabel}>{item.label}</Text>
                                    <ChevronRight size={14} color={Colors.textLight} style={styles.gridArrow} />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

function LockedDashboard() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, styles.center]}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={[styles.lockedHeader, { paddingTop: insets.top + 40 }]}
            >
                <View style={styles.lockIconCircle}>
                    <Lock size={40} color={Colors.white} />
                </View>
                <Text style={styles.lockedTitle}>Dashboard Locked</Text>
                <Text style={styles.lockedSub}>Please login to access your hostel dashboard</Text>
            </LinearGradient>

            <View style={styles.lockedContent}>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push('/(tabs)/account' as any)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryBtnText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function DashboardScreen() {
    const { isLoggedIn, isLoading, role } = useAuth();

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!isLoggedIn) return <LockedDashboard />;
    if (role === 'student') return <StudentDashboard />;
    return <StaffDashboard />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dashHeader: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        marginRight: 14,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    profileEnroll: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#69F0AE',
        marginRight: 6,
    },
    profileStatus: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500' as const,
    },
    profileHostel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    dashContent: {
        padding: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: '48%' as any,
        flexGrow: 1,
        flexBasis: '46%' as any,
    },
    gridCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        minHeight: 120,
        justifyContent: 'center',
    },
    gridIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    gridLabel: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.text,
        textAlign: 'center',
    },
    gridArrow: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.error + '20',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.error,
    },
    adminBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    adminIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    adminStatsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    adminStatCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    adminStatVal: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: Colors.primary,
    },
    adminStatLab: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '600' as const,
        textTransform: 'uppercase' as const,
        marginTop: 4,
    },
    adminSectionTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    lockedHeader: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    lockIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    lockedTitle: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: Colors.white,
        marginBottom: 8,
    },
    lockedSub: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 22,
    },
    lockedContent: {
        flex: 1,
        width: '100%',
        padding: 30,
        justifyContent: 'center',
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700' as const,
    }
});
