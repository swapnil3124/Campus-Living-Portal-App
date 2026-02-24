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
    UtensilsCrossed,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Student, UserRole } from '@/constants/types';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { boysHostelNames, girlsHostelNames } from '@/mocks/data';

function LoginScreen() {
    const { login, isLoginLoading } = useAuth();
    const [loginType, setLoginType] = useState<UserRole>(null);
    const [enrollment, setEnrollment] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [selectedHostel, setSelectedHostel] = useState<string>('');
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, [loginType]);

    const handleStudentLogin = useCallback(() => {
        if (!enrollment.trim() || !phone.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        login('student');
    }, [enrollment, phone, login]);

    const handleStaffLogin = useCallback(() => {
        if (!loginType) return;
        if (loginType === 'admin') {
            if (!selectedHostel || !username.trim() || !password.trim()) {
                Alert.alert('Error', 'Please fill in all fields');
                return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            login('admin', selectedHostel);
        } else {
            if (!username.trim() || !password.trim()) {
                Alert.alert('Error', 'Please fill in all fields');
                return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            login(loginType);
        }
    }, [loginType, selectedHostel, username, password, login]);

    const allHostels = [...boysHostelNames.map(h => ({ name: h, type: 'Boys' })), ...girlsHostelNames.map(h => ({ name: h, type: 'Girls' }))];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={[styles.loginHeader, { paddingTop: insets.top + 30 }]}
            >
                <Animated.View style={[styles.loginHeaderContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('@/assets/images/logo.png')}
                            style={styles.logoImage}
                            contentFit="contain"
                        />
                    </View>
                    <Text style={styles.loginHeaderTitleText}>Campus Living Portal</Text>
                    <Text style={styles.loginHeaderSub}>
                        {loginType ? (loginType === 'student' ? 'Student Portal Access' : 'Staff Administration Access') : 'Welcome to our Campus Community'}
                    </Text>
                </Animated.View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.loginContent} showsVerticalScrollIndicator={false}>
                {!loginType ? (
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.selectLabel}>Choose Your Role</Text>

                        <TouchableOpacity
                            style={styles.heroRoleCard}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setLoginType('student'); }}
                            activeOpacity={0.9}
                        >
                            <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.heroRoleGradient}>
                                <View style={styles.heroRoleIconWrap}>
                                    <User size={32} color="#059669" />
                                </View>
                                <View style={styles.roleText}>
                                    <Text style={[styles.roleTitle, { color: '#065F46' }]}>Student Access</Text>
                                    <Text style={styles.roleDesc}>Login to manage your room, leave, and mess details</Text>
                                </View>
                                <View style={styles.goBtn}>
                                    <ChevronRight size={20} color="#059669" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={[styles.selectLabel, { marginTop: 20 }]}>Staff & Administration</Text>

                        <View style={styles.staffGrid}>
                            <TouchableOpacity
                                style={styles.staffCard}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLoginType('admin'); }}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.staffIconWrap, { backgroundColor: '#F0F9FF' }]}>
                                    <ShieldCheck size={24} color="#0284C7" />
                                </View>
                                <Text style={styles.staffTitle}>Warden</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.staffCard}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLoginType('rector'); }}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.staffIconWrap, { backgroundColor: '#F5F3FF' }]}>
                                    <UserCircle size={24} color="#7C3AED" />
                                </View>
                                <Text style={styles.staffTitle}>Rector</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.staffCard}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLoginType('contractor'); }}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.staffIconWrap, { backgroundColor: '#FEF2F2' }]}>
                                    <UtensilsCrossed size={24} color="#DC2626" />
                                </View>
                                <Text style={styles.staffTitle}>Contractor</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.staffCard}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLoginType('watchman'); }}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.staffIconWrap, { backgroundColor: '#FFF7ED' }]}>
                                    <Building2 size={24} color="#EA580C" />
                                </View>
                                <Text style={styles.staffTitle}>Watchman</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <TouchableOpacity style={styles.backButtonContainer} onPress={() => setLoginType(null)}>
                            <ChevronRight size={18} color={Colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                            <Text style={styles.backButtonText}>Return to selection</Text>
                        </TouchableOpacity>

                        <View style={styles.loginFormContainer}>
                            <View style={styles.formHeader}>
                                <Text style={styles.formTitle}>
                                    {loginType === 'student' ? 'Student Login' : `${loginType.charAt(0).toUpperCase() + loginType.slice(1)} Login`}
                                </Text>
                                <View style={styles.formTitleUnderline} />
                            </View>

                            {loginType === 'admin' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Select Assigned Hostel</Text>
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
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {loginType === 'student' ? (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Enrollment ID</Text>
                                        <View style={styles.inputWrap}>
                                            <User size={18} color={Colors.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter your enrollment no."
                                                placeholderTextColor={Colors.textLight}
                                                value={enrollment}
                                                onChangeText={setEnrollment}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Registered Mobile</Text>
                                        <View style={styles.inputWrap}>
                                            <Smartphone size={18} color={Colors.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter registered number"
                                                placeholderTextColor={Colors.textLight}
                                                keyboardType="phone-pad"
                                                value={phone}
                                                onChangeText={setPhone}
                                            />
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Staff Username</Text>
                                        <View style={styles.inputWrap}>
                                            <Mail size={18} color={Colors.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter username"
                                                placeholderTextColor={Colors.textLight}
                                                value={username}
                                                onChangeText={setUsername}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Security Password</Text>
                                        <View style={styles.inputWrap}>
                                            <Lock size={18} color={Colors.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter password"
                                                placeholderTextColor={Colors.textLight}
                                                secureTextEntry
                                                value={password}
                                                onChangeText={setPassword}
                                            />
                                        </View>
                                    </View>
                                </>
                            )}

                            <TouchableOpacity
                                style={styles.primeButton}
                                onPress={loginType === 'student' ? handleStudentLogin : handleStaffLogin}
                                disabled={isLoginLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryDark]}
                                    style={styles.primeButtonGradient}
                                >
                                    {isLoginLoading ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <>
                                            <Text style={styles.primeButtonText}>Sign In to Account</Text>
                                            <Zap size={18} color={Colors.white} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.footerNote}>
                                Having trouble signing in? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Contact Admin</Text>
                            </Text>
                        </View>
                    </Animated.View>
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
                            <Text style={styles.statusText}>{role === 'student' ? 'Student' : 'Warden'}</Text>
                        </View>
                    </View>
                    <Text style={styles.profileHeaderName}>
                        {role === 'student' ? student?.name : 'Hostel Warden'}
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
        paddingHorizontal: 24,
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    loginHeaderContent: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 24,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    loginHeaderTitleText: {
        fontSize: 26,
        fontWeight: '800' as const,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    loginHeaderSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 6,
        textAlign: 'center',
    },
    loginContent: {
        padding: 24,
    },
    selectLabel: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.textSecondary,
        marginBottom: 16,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
    heroRoleCard: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    heroRoleGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    heroRoleIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    roleText: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 20,
        fontWeight: '800' as const,
    },
    roleDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 4,
        lineHeight: 18,
    },
    goBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    staffGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    staffCard: {
        width: '47%',
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    staffIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    staffTitle: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    backButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.primary,
    },
    loginFormContainer: {
        backgroundColor: Colors.white,
        borderRadius: 32,
        padding: 28,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 10,
    },
    formHeader: {
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '800' as const,
        color: Colors.text,
    },
    formTitleUnderline: {
        width: 40,
        height: 4,
        backgroundColor: Colors.primary,
        borderRadius: 2,
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: Colors.textLight,
        marginBottom: 10,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    hostelPicker: {
        marginHorizontal: -28,
        paddingHorizontal: 28,
        marginBottom: 4,
    },
    hostelChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
    },
    hostelChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    hostelChipText: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: Colors.textSecondary,
    },
    hostelChipTextActive: {
        color: Colors.white,
    },
    primeButton: {
        borderRadius: 18,
        marginTop: 10,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    primeButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    primeButtonText: {
        fontSize: 17,
        fontWeight: '800' as const,
        color: Colors.white,
    },
    footerNote: {
        fontSize: 13,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 24,
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
