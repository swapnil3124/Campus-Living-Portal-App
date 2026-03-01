import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    Dimensions,
    Platform,
    ImageBackground,
    Modal,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
    Building2,
    Users,
    ChevronRight,
    ClipboardList,
    BellRing,
    X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { hostels, notices } from '@/mocks/data';

const { width } = Dimensions.get('window');

// ── Image map keyed by hostel name ──────────────────────────────────────────
const hostelImages: Record<string, any> = {
    Shivneri: require('@/assets/images/Shivneri.png'),
    Lenyadri: require('@/assets/images/Lenyadri.png'),
    Bhimashankar: require('@/assets/images/Bhimashankar.png'),
    Saraswati: require('@/assets/images/Saraswati.png'),
    Shwetambara: require('@/assets/images/Shwetambara.png'),
};



import { useAdmissionStore } from '@/store/admission-store';
import { useAnnouncementStore, Announcement } from '@/store/announcement-store';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { regConfig, fetchRegConfig } = useAdmissionStore();
    const { activeAnnouncements, fetchActiveAnnouncements } = useAnnouncementStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Marquee Animation
    const marqueeAnim = useRef(new Animated.Value(width)).current;
    const [textWidth, setTextWidth] = useState(0);
    const slideAnim = useRef(new Animated.Value(30)).current;
    const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
    const scaleAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchRegConfig();
        fetchActiveAnnouncements();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();

        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 500,
                delay: 300 + i * 120,
                useNativeDriver: true,
            }).start();
        });

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (textWidth > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(marqueeAnim, {
                        toValue: -textWidth,
                        duration: (textWidth + width) * 15,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(marqueeAnim, {
                        toValue: width,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [textWidth, activeAnnouncements]);

    const handleAnnouncementClick = (ann: Announcement) => {
        setSelectedAnn(ann);
        setModalVisible(true);
    };

    const isRegistrationVisible = () => {
        if (!regConfig.isOpen) return false;
        if (!regConfig.startDate || !regConfig.endDate) return true; // Default to open if no date set but isOpen is true

        const now = new Date();
        const start = new Date(regConfig.startDate);
        const end = new Date(regConfig.endDate);
        return now >= start && now <= end;
    };

    const boysHostels = hostels.filter(h => h.type === 'boys');
    const girlsHostels = hostels.filter(h => h.type === 'girls');
    const totalBoys = boysHostels.reduce((sum, h) => sum + h.capacity, 0);
    const totalGirls = girlsHostels.reduce((sum, h) => sum + h.capacity, 0);


    const handlePressIn = (index: number) => {
        Animated.spring(scaleAnims[index], {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = (index: number) => {
        Animated.spring(scaleAnims[index], {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const latestNotices = notices.slice(0, 3);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
                <LinearGradient
                    colors={['#00443D', '#00695C', '#00897B', '#26A69A']}
                    style={[styles.header, { paddingTop: insets.top + 16 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >

                    <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {/* Logo with glow ring */}
                        <View style={styles.logoGlowRing}>
                            <View style={styles.collegeBadge}>
                                <Image
                                    source={require('@/assets/images/logo.png')}
                                    style={styles.collegeLogo}
                                    contentFit="contain"
                                />
                            </View>
                        </View>
                        <Text style={styles.collegeName}>Government Polytechnic</Text>
                        <Text style={styles.collegeSubtitle}>Awasari (Kh.)</Text>
                        <Text style={styles.systemTitle}>CAMPUS LIVING PORTAL</Text>
                    </Animated.View>

                    <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(33,150,243,0.22)' }]}>
                                <Users size={18} color="#90CAF9" />
                            </View>
                            <Text style={styles.statNumber}>{totalBoys}</Text>
                            <Text style={styles.statLabel}>Boys Capacity</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(233,30,99,0.22)' }]}>
                                <Users size={18} color="#F48FB1" />
                            </View>
                            <Text style={styles.statNumber}>{totalGirls}</Text>
                            <Text style={styles.statLabel}>Girls Capacity</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,152,0,0.22)' }]}>
                                <Building2 size={18} color="#FFB74D" />
                            </View>
                            <Text style={styles.statNumber}>{hostels.length}</Text>
                            <Text style={styles.statLabel}>Total Hostels</Text>
                        </View>
                    </Animated.View>
                </LinearGradient>

                {/* Announcement Bar */}
                {activeAnnouncements.length > 0 && (
                    <View style={styles.announcementBar}>
                        <View style={styles.announcementBadge}>
                            <Text style={styles.announcementBadgeText}>Announcements</Text>
                            <BellRing size={14} color={Colors.white} style={{ marginLeft: 4 }} />
                        </View>
                        <View style={styles.marqueeContainer}>
                            <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: marqueeAnim }] }}>
                                <View onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}>
                                    <View style={{ flexDirection: 'row' }}>
                                        {activeAnnouncements.map((ann, idx) => (
                                            <TouchableOpacity key={idx} onPress={() => handleAnnouncementClick(ann)} style={styles.marqueeItem}>
                                                <Text style={styles.marqueeText}>{ann.message}</Text>
                                                {idx < activeAnnouncements.length - 1 && <Text style={styles.marqueeDivider}> • </Text>}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </Animated.View>
                        </View>
                    </View>
                )}

                <View style={styles.content}>


                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: cardAnims[1],
                                transform: [{ translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                            },
                        ]}
                    >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Boys Hostels</Text>
                            <View style={styles.capacityBadge}>
                                <Text style={styles.capacityText}>{totalBoys} beds</Text>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hostelScroll}>
                            {boysHostels.map((hostel) => (
                                <Animated.View key={hostel.id} style={[styles.hostelCard, { transform: [{ scale: scaleAnims[0] }] }]}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPressIn={() => { handlePressIn(0); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                        onPressOut={() => handlePressOut(0)}
                                    >
                                        <ImageBackground
                                            source={hostelImages[hostel.name] ?? hostelImages.Shivneri}
                                            style={styles.hostelCardBg}
                                            imageStyle={styles.hostelCardBgImage}
                                        >
                                            <View style={styles.hostelCardOverlay}>
                                                <View style={styles.hostelCardHeader}>
                                                    <View style={styles.capacityPill}>
                                                        <Text style={styles.capacityPillText}>{hostel.capacity} beds</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.hostelCardName}>{hostel.name}</Text>
                                                <Text style={styles.hostelCardType}>Boys Hostel</Text>
                                            </View>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: cardAnims[2],
                                transform: [{ translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                            },
                        ]}
                    >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Girls Hostels</Text>
                            <View style={[styles.capacityBadge, { backgroundColor: '#FCE4EC' }]}>
                                <Text style={[styles.capacityText, { color: '#e94285ff' }]}>{totalGirls} beds</Text>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hostelScroll}>
                            {girlsHostels.map((hostel) => (
                                <View key={hostel.id} style={styles.hostelCard}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPressIn={() => { handlePressIn(1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                        onPressOut={() => handlePressOut(1)}
                                    >
                                        <ImageBackground
                                            source={hostelImages[hostel.name] ?? hostelImages.Saraswati}
                                            style={styles.hostelCardBg}
                                            imageStyle={styles.hostelCardBgImage}
                                        >
                                            <View style={styles.hostelCardOverlay}>
                                                <View style={styles.hostelCardHeader}>
                                                    <View style={styles.capacityPill}>
                                                        <Text style={styles.capacityPillText}>{hostel.capacity} beds</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.hostelCardName}>{hostel.name}</Text>
                                                <Text style={styles.hostelCardType}>Girls Hostel</Text>
                                            </View>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: cardAnims[3],
                                transform: [{ translateY: cardAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                            },
                        ]}
                    >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Latest Notices</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/(tabs)/notices' as any);
                                }}
                                style={styles.viewAllBtn}
                            >
                                <Text style={styles.viewAllText}>View All</Text>
                                <ChevronRight size={14} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                        {latestNotices.map((notice) => (
                            <View key={notice.id} style={styles.noticePreview}>
                                <View style={styles.noticeLeft}>
                                    <View
                                        style={[
                                            styles.noticeDot,
                                            notice.priority === 'urgent' && { backgroundColor: Colors.error },
                                            notice.priority === 'important' && { backgroundColor: Colors.warning },
                                            notice.priority === 'normal' && { backgroundColor: Colors.primary },
                                        ]}
                                    />
                                    <View style={styles.noticeTextWrap}>
                                        <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                                        <Text style={styles.noticeDate}>{notice.date} • {notice.issuedBy}</Text>
                                    </View>
                                </View>
                                {notice.isNew && (
                                    <View style={styles.newBadge}>
                                        <Text style={styles.newBadgeText}>NEW</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </Animated.View>

                    {/* ── Dynamic "Apply for Hostel" Button ───────────────────── */}
                    {isRegistrationVisible() && (
                        <Animated.View
                            style={[
                                styles.section,
                                {
                                    opacity: cardAnims[0],
                                    transform: [
                                        { translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                                    ],
                                },
                            ]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push('/registration' as any);
                                }}
                                style={styles.applyButton}
                            >
                                <View style={styles.applyButtonContent}>
                                    <View style={styles.applyIconWrap}>
                                        <ClipboardList size={22} color={Colors.white} />
                                    </View>
                                    <View style={styles.applyTextWrap}>
                                        <Text style={styles.applyButtonText}>Hostel Admission 2025-26</Text>
                                        <View style={styles.applyBadge}>
                                            <Text style={styles.applyBadgeText}>APPLICATION OPEN</Text>
                                        </View>
                                    </View>
                                    <ChevronRight size={20} color={Colors.primary} />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    <View style={{ height: 20 }} />
                </View>
            </ScrollView>

            <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Announcement</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalMsg}>{selectedAnn?.message}</Text>
                            {!!selectedAnn?.details && <Text style={styles.modalDetails}>{selectedAnn.details}</Text>}
                            <Text style={styles.modalDate}>Valid from: {selectedAnn?.startDate ? new Date(selectedAnn.startDate).toLocaleDateString() : ''}</Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingBottom: 28,
        paddingHorizontal: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    headerContent: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoGlowRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: Colors.white,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 0,
    },
    collegeBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 6,
    },
    collegeLogo: {
        width: 66,
        height: 66,
        borderRadius: 33,
    },
    collegeName: {
        fontSize: 22,
        fontWeight: '800' as const,
        color: Colors.white,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    collegeSubtitle: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 3,
    },
    systemTitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 8,
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800' as const,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '500' as const,
        color: 'rgba(255,255,255,0.72)',
        marginTop: 3,
        letterSpacing: 0.3,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 4,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    capacityBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    capacityText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: '#1565C0',
    },
    hostelScroll: {
        paddingRight: 16,
        gap: 12,
    },
    hostelCard: {
        width: width * 0.52,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    hostelCardBg: {
        width: '100%',
        borderRadius: 16,
    },
    hostelCardBgImage: {
        borderRadius: 16,
    },
    hostelCardOverlay: {
        backgroundColor: 'rgba(0,0,0,0.38)',
        borderRadius: 16,
        padding: 16,
    },
    hostelCardHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 28,
    },
    capacityPill: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    capacityPillText: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    hostelCardName: {
        fontSize: 17,
        fontWeight: '800' as const,
        color: Colors.white,
        marginBottom: 3,
    },
    hostelCardType: {
        fontSize: 12,
        fontWeight: '500' as const,
        color: 'rgba(255,255,255,0.85)',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.primary,
    },
    noticePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    noticeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    noticeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    noticeTextWrap: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    noticeDate: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 2,
    },
    newBadge: {
        backgroundColor: Colors.error,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 8,
    },
    newBadgeText: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    // ── Apply Button ────────────────────────────────────────────────────────
    applyButton: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,137,123,0.1)',
    },
    applyButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    applyIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    applyTextWrap: {
        flex: 1,
    },
    applyButtonText: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: '700' as const,
    },
    applyBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryGhost,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 4,
    },
    applyBadgeText: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    announcementBar: {
        flexDirection: 'row',
        backgroundColor: '#E0F2F1',
        borderBottomWidth: 1,
        borderBottomColor: '#B2DFDB',
        alignItems: 'center',
    },
    announcementBadge: {
        flexDirection: 'row',
        backgroundColor: '#00695C',
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        zIndex: 2,
    },
    announcementBadgeText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 13,
    },
    marqueeContainer: {
        flex: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    marqueeItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    marqueeText: {
        color: '#004D40',
        fontSize: 14,
        fontWeight: '600',
    },
    marqueeDivider: {
        color: '#00897B',
        fontSize: 14,
        fontWeight: '700',
        marginHorizontal: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    modalBody: {
        marginBottom: 10,
    },
    modalMsg: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 10,
    },
    modalDetails: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
        lineHeight: 22,
    },
    modalDate: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '500',
    },
});
