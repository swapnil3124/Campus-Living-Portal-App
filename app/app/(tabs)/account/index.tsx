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
    ChevronRight,
    Lock,
    Smartphone,
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    Zap,
    Key,
    User2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { boysHostelNames, girlsHostelNames } from '@/mocks/data';

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
        login('admin', selectedHostel);
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
                    <Text style={styles.loginHeaderSub}>Access your hostel account</Text>
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

function ProfileScreen() {
    const { student, role, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

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

    const ProfileItem = ({ icon: Icon, label, value, color = Colors.primary }: any) => (
        <View style={styles.profileItem}>
            <View style={[styles.profileItemIcon, { backgroundColor: color + '12' }]}>
                <Icon size={20} color={color} />
            </View>
            <View style={styles.profileItemContent}>
                <Text style={styles.profileItemLabel}>{label}</Text>
                <Text style={styles.profileItemValue}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}
            >
                <Animated.View style={[styles.profileHeaderContent, { opacity: fadeAnim }]}>
                    <View style={styles.avatarContainer}>
                        {role === 'student' ? (
                            <Image
                                source={{ uri: student?.photoUrl }}
                                style={styles.profileAvatar}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={styles.adminAvatarCircle}>
                                <ShieldCheck size={40} color={Colors.white} />
                            </View>
                        )}
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDotInner} />
                            <Text style={styles.statusText}>{role === 'student' ? 'Student' : 'Admin'}</Text>
                        </View>
                    </View>
                    <Text style={styles.profileHeaderName}>
                        {role === 'student' ? student?.name : 'Administrator'}
                    </Text>
                    <Text style={styles.profileHeaderSub}>
                        {role === 'student' ? student?.enrollmentNo : 'Govt. Poly. Awasari'}
                    </Text>
                </Animated.View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.profileSection}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.card}>
                        {role === 'student' ? (
                            <>
                                <ProfileItem icon={Mail} label="Email Address" value={student?.email} color="#1565C0" />
                                <ProfileItem icon={Phone} label="Phone Number" value={student?.phone} color="#2E7D32" />
                                <ProfileItem icon={Calendar} label="Date of Birth" value={student?.dob} color="#E65100" />
                                <ProfileItem icon={Briefcase} label="Department" value={student?.department} color="#6A1B9A" />
                                <ProfileItem icon={Zap} label="Academic Year" value={student?.academicYear} color="#00838F" />
                            </>
                        ) : (
                            <>
                                <ProfileItem icon={Mail} label="Contact Email" value="admin@gpawasari.ac.in" color="#1565C0" />
                                <ProfileItem icon={Building2} label="Institute" value="Government Polytechnic Awasari" color="#2E7D32" />
                                <ProfileItem icon={Zap} label="Access Level" value="Full System Access" color="#D84315" />
                            </>
                        )}
                    </View>
                </View>

                {role === 'student' && (
                    <View style={styles.profileSection}>
                        <Text style={styles.sectionTitle}>Hostel Details</Text>
                        <View style={styles.card}>
                            <ProfileItem icon={Building2} label="Hostel Name" value={student?.hostelName} color="#00897B" />
                            <ProfileItem icon={Key} label="Room & Bed" value={`Room ${student?.roomNo}, Bed ${student?.bedNumber}`} color="#C62828" />
                            <ProfileItem icon={MapPin} label="Floor" value={`${student?.floor}${student?.floor === 1 ? 'st' : student?.floor === 2 ? 'nd' : 'rd'} Floor`} color="#455A64" />
                        </View>
                    </View>
                )}

                <View style={styles.profileSection}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.settingRow}>
                            <View style={[styles.settingIcon, { backgroundColor: '#F5F5F5' }]}>
                                <Lock size={18} color={Colors.textSecondary} />
                            </View>
                            <Text style={styles.settingLabel}>Change Password</Text>
                            <ChevronRight size={18} color={Colors.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingRow}>
                            <View style={[styles.settingIcon, { backgroundColor: '#F5F5F5' }]}>
                                <User2 size={18} color={Colors.textSecondary} />
                            </View>
                            <Text style={styles.settingLabel}>Update Contact Info</Text>
                            <ChevronRight size={18} color={Colors.textLight} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                    <LogOut size={20} color={Colors.error} />
                    <Text style={styles.logoutButtonText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

export default function AccountScreen() {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!isLoggedIn) return <LoginScreen />;
    return <ProfileScreen />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
    profileHeader: {
        paddingHorizontal: 30,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    profileHeaderContent: {
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    adminAvatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 0,
        backgroundColor: Colors.white,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignSelf: 'center',
    },
    statusDotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.text,
        textTransform: 'uppercase' as const,
    },
    profileHeaderName: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: Colors.white,
        textAlign: 'center',
    },
    profileHeaderSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        textAlign: 'center',
    },
    profileScrollContent: {
        padding: 20,
    },
    profileSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.textSecondary,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    profileItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    profileItemContent: {
        flex: 1,
    },
    profileItemLabel: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500' as const,
    },
    profileItemValue: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '600' as const,
        marginTop: 2,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    settingLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FFF1F2',
        paddingVertical: 18,
        borderRadius: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#FECDD3',
    },
    logoutButtonText: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: '700' as const,
    },
});
