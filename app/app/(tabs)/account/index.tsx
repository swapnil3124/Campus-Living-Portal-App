import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
    User,
    LogOut,
    UserCircle,
    ShieldCheck,
    MessageSquare,
    UtensilsCrossed,
    BedDouble,
    CalendarDays,
    Siren,
    ChevronRight,
    Lock,
    Smartphone,
    Building2,
    Home,
    FileText,
    ClipboardList,
    Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { boysHostelNames, girlsHostelNames } from '@/mocks/data';
const dashboardItems = [
    { key: 'profile', label: 'My Profile', icon: UserCircle, color: '#1565C0', bg: '#E3F2FD', route: '/student/profile' },
    { key: 'complaints', label: 'Complaints', icon: MessageSquare, color: '#E65100', bg: '#FFF3E0', route: '/student/complaints' },
    { key: 'mess', label: 'Mess', icon: UtensilsCrossed, color: '#2E7D32', bg: '#E8F5E9', route: '/student/mess' },
    { key: 'room', label: 'Room Info', icon: BedDouble, color: '#6A1B9A', bg: '#F3E5F5', route: '/student/room' },
    { key: 'leave', label: 'Leave', icon: CalendarDays, color: '#00838F', bg: '#E0F7FA', route: '/student/leave' },
    { key: 'emergency', label: 'Emergency', icon: Siren, color: '#C62828', bg: '#FFEBEE', route: '/student/emergency' },
];

const adminDashboardItems = [
    { key: 'profile', label: 'Admin Profile', icon: UserCircle, color: '#1565C0', bg: '#E3F2FD', route: '/admin/profile' },
    { key: 'students', label: 'Student Management', icon: Users, color: '#2E7D32', bg: '#E8F5E9', route: '/admin/students' },
    { key: 'notices', label: 'Notice Management', icon: FileText, color: '#6A1B9A', bg: '#F3E5F5', route: '/admin/notices' },
    { key: 'complaints', label: 'Complaint Management', icon: MessageSquare, color: '#E65100', bg: '#FFF3E0', route: '/admin/complaints' },
    { key: 'mess', label: 'Mess Management', icon: UtensilsCrossed, color: '#D84315', bg: '#FBE9E7', route: '/admin/mess' },
    { key: 'hostel', label: 'Room & Hostel Mgmt', icon: Building2, color: '#00695C', bg: '#E0F2F1', route: '/admin/hostel' },
    { key: 'leave', label: 'Leave Management', icon: CalendarDays, color: '#00838F', bg: '#E0F7FA', route: '/admin/leave' },
    { key: 'emergency', label: 'Emergency Mgmt', icon: Siren, color: '#C62828', bg: '#FFEBEE', route: '/admin/emergency' },
    { key: 'exit', label: 'Hostel Exit Mgmt', icon: LogOut, color: '#455A64', bg: '#ECEFF1', route: '/admin/exit' },
];


function LoginScreen() {
    const { login, isLoginLoading } = useAuth();
    const [loginType, setLoginType] = useState<'student' | 'admin' | null>(null);
    const [enrollment, setEnrollment] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [selectedHostel, setSelectedHostel] = useState<string>('');
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleStudentLogin = useCallback(() => {
        if (!enrollment.trim() || !phone.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        login('student');
    }, [enrollment, phone, login]);

    const handleAdminLogin = useCallback(() => {
        if (!selectedHostel || !username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        login('admin');
    }, [selectedHostel, username, password, login]);

    const allHostels = [...boysHostelNames.map(h => ({ name: h, type: 'Boys' })), ...girlsHostelNames.map(h => ({ name: h, type: 'Girls' }))];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={[styles.loginHeader, { paddingTop: insets.top + 12 }]}
            >
                <Animated.View style={[styles.loginHeaderContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.loginIcon}>
                        <Lock size={28} color={Colors.white} />
                    </View>
                    <Text style={styles.loginHeaderTitle}>
                        {loginType ? (loginType === 'student' ? 'Student Login' : 'Admin Login') : 'Login'}
                    </Text>
                    <Text style={styles.loginHeaderSub}>Access your hostel dashboard</Text>
                </Animated.View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.loginContent} showsVerticalScrollIndicator={false}>
                {!loginType ? (
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.selectLabel}>Select Login Type</Text>
                        <TouchableOpacity
                            style={styles.roleCard}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLoginType('student'); }}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.roleGradient}>
                                <View style={styles.roleIconWrap}>
                                    <User size={28} color="#1565C0" />
                                </View>
                                <View style={styles.roleText}>
                                    <Text style={styles.roleTitle}>Student</Text>
                                    <Text style={styles.roleDesc}>Login with enrollment number & OTP</Text>
                                </View>
                                <ChevronRight size={20} color="#1565C0" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.roleCard}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLoginType('admin'); }}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={[Colors.primaryGhost, Colors.primaryLight]} style={styles.roleGradient}>
                                <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(0,137,123,0.15)' }]}>
                                    <ShieldCheck size={28} color={Colors.primaryDark} />
                                </View>
                                <View style={styles.roleText}>
                                    <Text style={[styles.roleTitle, { color: Colors.primaryDark }]}>Admin</Text>
                                    <Text style={styles.roleDesc}>Login with hostel credentials</Text>
                                </View>
                                <ChevronRight size={20} color={Colors.primaryDark} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                ) : loginType === 'student' ? (
                    <View>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setLoginType(null)}>
                            <Text style={styles.backBtnText}>← Back to role selection</Text>
                        </TouchableOpacity>
                        <View style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Enrollment Number</Text>
                                <View style={styles.inputWrap}>
                                    <User size={18} color={Colors.textLight} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter enrollment number"
                                        placeholderTextColor={Colors.textLight}
                                        value={enrollment}
                                        onChangeText={setEnrollment}
                                        testID="enrollment-input"
                                    />
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Mobile Number</Text>
                                <View style={styles.inputWrap}>
                                    <Smartphone size={18} color={Colors.textLight} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter mobile number"
                                        placeholderTextColor={Colors.textLight}
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={setPhone}
                                        testID="phone-input"
                                    />
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.loginBtn}
                                onPress={handleStudentLogin}
                                disabled={isLoginLoading}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryDark]}
                                    style={styles.loginBtnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoginLoading ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Text style={styles.loginBtnText}>Send OTP & Login</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setLoginType(null)}>
                            <Text style={styles.backBtnText}>← Back to role selection</Text>
                        </TouchableOpacity>
                        <View style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Select Hostel</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hostelPicker}>
                                    {allHostels.map((h) => (
                                        <TouchableOpacity
                                            key={h.name}
                                            style={[styles.hostelChip, selectedHostel === h.name && styles.hostelChipActive]}
                                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedHostel(h.name); }}
                                        >
                                            <Building2 size={14} color={selectedHostel === h.name ? Colors.white : Colors.textSecondary} />
                                            <Text style={[styles.hostelChipText, selectedHostel === h.name && styles.hostelChipTextActive]}>
                                                {h.name}
                                            </Text>
                                            <Text style={[styles.hostelChipType, selectedHostel === h.name && { color: 'rgba(255,255,255,0.7)' }]}>
                                                {h.type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Username</Text>
                                <View style={styles.inputWrap}>
                                    <User size={18} color={Colors.textLight} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter username"
                                        placeholderTextColor={Colors.textLight}
                                        value={username}
                                        onChangeText={setUsername}
                                        testID="username-input"
                                    />
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <View style={styles.inputWrap}>
                                    <Lock size={18} color={Colors.textLight} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter password"
                                        placeholderTextColor={Colors.textLight}
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                        testID="password-input"
                                    />
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.loginBtn}
                                onPress={handleAdminLogin}
                                disabled={isLoginLoading}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryDark]}
                                    style={styles.loginBtnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoginLoading ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Text style={styles.loginBtnText}>Login as Admin</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function StudentDashboard() {
    const { student, logout } = useAuth();
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

    const handleLogout = useCallback(() => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    logout();
                },
            },
        ]);
    }, [logout]);

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

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                    <LogOut size={18} color={Colors.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

export default function AccountScreen() {
    const { isLoggedIn, isLoading, role } = useAuth();

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!isLoggedIn) return <LoginScreen />;
    if (role === 'admin') return <AdminDashboard />;
    return <StudentDashboard />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard() {
    const { logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef(adminDashboardItems.map(() => new Animated.Value(0))).current;
    const scaleAnims = useRef(adminDashboardItems.map(() => new Animated.Value(1))).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, { toValue: 1, duration: 400, delay: 200 + i * 80, useNativeDriver: true }).start();
        });
    }, []);

    const handlePressIn = (i: number) => Animated.spring(scaleAnims[i], { toValue: 0.92, useNativeDriver: true }).start();
    const handlePressOut = (i: number) => Animated.spring(scaleAnims[i], { toValue: 1, friction: 3, useNativeDriver: true }).start();

    const handleLogout = useCallback(() => {
        Alert.alert('Logout', 'Are you sure you want to logout as Admin?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    logout();
                },
            },
        ]);
    }, [logout]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#004d40', Colors.primary, '#26A69A']}
                style={[styles.dashHeader, { paddingTop: insets.top + 12 }]}
            >
                <Animated.View style={[{ opacity: fadeAnim }]}>
                    <View style={styles.adminBadgeRow}>
                        <View style={styles.adminIconWrap}>
                            <ShieldCheck size={28} color={Colors.white} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>Administrator</Text>
                            <Text style={styles.profileEnroll}>Government Polytechnic Awasari</Text>
                            <View style={styles.profileBadge}>
                                <View style={[styles.statusDot, { backgroundColor: '#69F0AE' }]} />
                                <Text style={styles.profileStatus}>Admin Panel Access</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.dashContent} showsVerticalScrollIndicator={false}>
                <View style={styles.adminStatsRow}>
                    <View style={styles.adminStatCard}>
                        <Text style={styles.adminStatVal}>12</Text>
                        <Text style={styles.adminStatLab}>Pending Registrations</Text>
                    </View>
                    <View style={styles.adminStatCard}>
                        <Text style={[styles.adminStatVal, { color: Colors.error }]}>5</Text>
                        <Text style={styles.adminStatLab}>Open Complaints</Text>
                    </View>
                </View>

                <Text style={styles.adminSectionTitle}>Management Tools</Text>
                <View style={styles.gridContainer}>
                    {adminDashboardItems.map((item, index) => {
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
                                    testID={`admin-${item.key}`}
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

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                    <LogOut size={18} color={Colors.error} />
                    <Text style={styles.logoutText}>Logout Admin Session</Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
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
    loginHeader: {
        paddingHorizontal: 20,
        paddingBottom: 28,
    },
    loginHeaderContent: {
        alignItems: 'center',
    },
    loginIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    loginHeaderTitle: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    loginHeaderSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    loginContent: {
        padding: 20,
    },
    selectLabel: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: Colors.text,
        marginBottom: 16,
    },
    roleCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 14,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    roleGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
    },
    roleIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(21,101,192,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    roleText: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 17,
        fontWeight: '700' as const,
        color: '#1565C0',
    },
    roleDesc: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    backBtn: {
        marginBottom: 16,
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: Colors.primary,
    },
    formCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 18,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        backgroundColor: Colors.background,
        gap: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.text,
    },
    hostelPicker: {
        marginBottom: 4,
    },
    hostelChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginRight: 8,
    },
    hostelChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    hostelChipText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    hostelChipTextActive: {
        color: Colors.white,
    },
    hostelChipType: {
        fontSize: 10,
        color: Colors.textLight,
    },
    loginBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 6,
    },
    loginBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: Colors.white,
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
        marginBottom: 10,
    },
    gridLabel: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    gridArrow: {
        position: 'absolute',
        top: 14,
        right: 14,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.errorLight,
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 20,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.error,
    },
    // ─────────────────────────────────────────────────────────────────────────
    // Admin Specific Styles
    // ─────────────────────────────────────────────────────────────────────────
    adminBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    adminIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    adminSectionTitle: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: Colors.textSecondary,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
        marginTop: 8,
    },
    adminStatsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    adminStatCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    adminStatVal: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: Colors.primary,
    },
    adminStatLab: {
        fontSize: 11,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '600' as const,
    },
});
