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
import {
    User,
    GraduationCap,
    Building2,
    Phone,
    Mail,
    Calendar,
    CreditCard,
    BookOpen,
    Hash,
    BedDouble,
    Users,
    MapPin,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>{icon}</View>
            <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

export default function ProfileScreen() {
    const { student } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const sectionAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        sectionAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 450,
                delay: 200 + i * 120,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    if (!student) return null;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.profileHeader, { opacity: fadeAnim }]}>
                <LinearGradient colors={[Colors.primaryGhost, Colors.background]} style={styles.headerGradient}>
                    <Image source={{ uri: student.photoUrl }} style={styles.avatar} contentFit="cover" />
                    <Text style={styles.name}>{student.name}</Text>
                    <Text style={styles.enrollment}>{student.enrollmentNo}</Text>
                    <View style={styles.headerBadges}>
                        <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, student.status === 'active' && { backgroundColor: Colors.success }]} />
                            <Text style={styles.statusText}>{student.status}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            <View style={styles.content}>
                <Animated.View style={[styles.section, { opacity: sectionAnims[0], transform: [{ translateY: sectionAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.card}>
                        <InfoRow icon={<Phone size={16} color={Colors.primary} />} label="Mobile" value={student.phone} />
                        <InfoRow icon={<Mail size={16} color={Colors.primary} />} label="Email" value={student.email} />
                        <InfoRow icon={<User size={16} color={Colors.primary} />} label="Category" value={student.category} />
                        <InfoRow icon={<CreditCard size={16} color={Colors.primary} />} label="Merit Marks" value={student.prevMarks} />
                        <InfoRow icon={<MapPin size={16} color={Colors.primary} />} label="Distance" value={student.distance} />
                    </View>
                </Animated.View>

                <Animated.View style={[styles.section, { opacity: sectionAnims[1], transform: [{ translateY: sectionAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>Academic Information</Text>
                    <View style={styles.card}>
                        <InfoRow icon={<GraduationCap size={16} color={Colors.primary} />} label="Institute" value="Government Polytechnic Awasari" />
                        <InfoRow icon={<BookOpen size={16} color={Colors.primary} />} label="Department" value={student.department} />
                        <InfoRow icon={<Hash size={16} color={Colors.primary} />} label="Year / Enrollment No" value={`${student.year} / ${student.enrollmentNo}`} />
                    </View>
                </Animated.View>

                <Animated.View style={[styles.section, { opacity: sectionAnims[2], transform: [{ translateY: sectionAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>Hostel Information</Text>
                    <View style={styles.card}>
                        <InfoRow icon={<Building2 size={16} color={Colors.primary} />} label="Hostel" value={student.hostelName} />
                        <InfoRow icon={<BedDouble size={16} color={Colors.primary} />} label="Room / Bed" value={student.isRoomAllocated ? `${student.roomNo} / Bed ${student.bedNumber}` : 'Not Allocated'} />
                        {student.isRoomAllocated && <InfoRow icon={<Hash size={16} color={Colors.primary} />} label="Floor" value={`Floor ${student.floor}`} />}
                        <InfoRow icon={<Calendar size={16} color={Colors.primary} />} label="Date of Joining" value={student.dateOfJoining} />
                    </View>
                </Animated.View>

                {student.parentName && student.parentName !== 'N/A' && (
                    <Animated.View style={[styles.section, { opacity: sectionAnims[3], transform: [{ translateY: sectionAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                        <Text style={styles.sectionTitle}>Guardian Details</Text>
                        <View style={styles.card}>
                            <InfoRow icon={<Users size={16} color={Colors.primary} />} label="Guardian Name" value={student.parentName} />
                            <InfoRow icon={<Phone size={16} color={Colors.primary} />} label="Contact" value={student.parentContact} />
                        </View>
                    </Animated.View>
                )}
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
    profileHeader: {
        overflow: 'hidden',
    },
    headerGradient: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: Colors.primary,
        marginBottom: 12,
    },
    name: {
        fontSize: 20,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    enrollment: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    headerBadges: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.textLight,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: Colors.text,
        textTransform: 'capitalize' as const,
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 10,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 4,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    infoIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primaryGhost,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoText: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        color: Colors.textLight,
        marginBottom: 2,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.3,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: Colors.text,
    },
});
