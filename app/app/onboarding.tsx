import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
    Camera,
    Sun,
    Droplets,
    UtensilsCrossed,
    Shield,
    Bell,
    MessageSquare,
    BedDouble,
    CalendarDays,
    Siren,
    CheckCircle2,
    ArrowRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboardingCompleted';
const SLIDES = ['welcome', 'facilities', 'features'] as const;
type SlideKey = typeof SLIDES[number];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Spring-bounce an Animated.Value to 1. */
function springIn(value: Animated.Value, delay = 0, tension = 55, friction = 7) {
    return Animated.sequence([
        Animated.delay(delay),
        Animated.spring(value, {
            toValue: 1,
            tension,
            friction,
            useNativeDriver: true,
        }),
    ]);
}

/** Slide up + fade an element in. */
function slideUp(
    opacity: Animated.Value,
    translateY: Animated.Value,
    delay = 0,
    duration = 420,
) {
    return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]),
    ]);
}

/** Slide in from left + fade. */
function slideInLeft(
    opacity: Animated.Value,
    translateX: Animated.Value,
    delay = 0,
    duration = 380,
) {
    return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: 0,
                duration,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
        ]),
    ]);
}

/** Reset a set of Animated.Values to their initial states. */
function resetAnims(items: { value: Animated.Value; initial: number }[]) {
    items.forEach(({ value, initial }) => value.setValue(initial));
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide 1 — Welcome
// ─────────────────────────────────────────────────────────────────────────────

function Slide1Welcome({
    isActive,
    scrollX,
    slideIndex,
}: {
    isActive: boolean;
    scrollX: Animated.Value;
    slideIndex: number;
}) {
    // Per-element animation values
    const logoScale = useRef(new Animated.Value(0.4)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleY = useRef(new Animated.Value(28)).current;

    const subOpacity = useRef(new Animated.Value(0)).current;
    const subY = useRef(new Animated.Value(24)).current;

    const descOpacity = useRef(new Animated.Value(0)).current;
    const descY = useRef(new Animated.Value(24)).current;

    const statsOpacity = useRef(new Animated.Value(0)).current;
    const statsY = useRef(new Animated.Value(32)).current;

    useEffect(() => {
        if (!isActive) return;

        // Reset to initial state
        resetAnims([
            { value: logoScale, initial: 0.4 },
            { value: logoOpacity, initial: 0 },
            { value: titleOpacity, initial: 0 },
            { value: titleY, initial: 28 },
            { value: subOpacity, initial: 0 },
            { value: subY, initial: 24 },
            { value: descOpacity, initial: 0 },
            { value: descY, initial: 24 },
            { value: statsOpacity, initial: 0 },
            { value: statsY, initial: 32 },
        ]);

        Animated.parallel([
            // Logo bounces in immediately
            springIn(logoScale, 0, 55, 6),
            Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),

            // Title slides up after logo
            slideUp(titleOpacity, titleY, 220),

            // Subtitle
            slideUp(subOpacity, subY, 360),

            // Description
            slideUp(descOpacity, descY, 460),

            // Stats row
            slideUp(statsOpacity, statsY, 560),
        ]).start();
    }, [isActive]);

    // Parallax scale based on swipe position
    const inputRange = [(slideIndex - 1) * width, slideIndex * width, (slideIndex + 1) * width];
    const slideScale = scrollX.interpolate({
        inputRange,
        outputRange: [0.93, 1, 0.93],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View style={[sStyles.slide, { transform: [{ scale: slideScale }] }]}>
            {/* Gradient header */}
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary, '#26A69A']}
                style={sStyles.slideHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={sStyles.decorCircleLarge} />
                <View style={sStyles.decorCircleSmall} />

                <View style={sStyles.headerContent}>
                    {/* Animated logo */}
                    <Animated.View
                        style={[
                            sStyles.logoBadge,
                            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                        ]}
                    >
                        <Image
                            source={require('@/assets/images/logo.png')}
                            style={sStyles.logoImage}
                            contentFit="contain"
                        />
                    </Animated.View>

                    {/* College name */}
                    <Animated.Text
                        style={[
                            sStyles.collegeName,
                            { opacity: titleOpacity, transform: [{ translateY: titleY }] },
                        ]}
                    >
                        Government Polytechnic
                    </Animated.Text>
                    <Animated.Text
                        style={[
                            sStyles.collegeNameAccent,
                            { opacity: subOpacity, transform: [{ translateY: subY }] },
                        ]}
                    >
                        Awasari (Kh)
                    </Animated.Text>
                </View>
            </LinearGradient>

            {/* Body card */}
            <View style={sStyles.slideBody}>
                <Animated.View
                    style={[
                        sStyles.welcomeCard,
                        { opacity: descOpacity, transform: [{ translateY: descY }] },
                    ]}
                >
                    <View style={[sStyles.tagBadge, { backgroundColor: Colors.primaryGhost }]}>
                        <Text style={[sStyles.tagText, { color: Colors.primaryDark }]}>
                            Campus Living Portal
                        </Text>
                    </View>

                    {/* Description bullet lines */}
                    {[
                        'A complete digital solution for hostel administration.',
                        'Track complaints, leave applications, and emergency alerts instantly.',
                        'Stay updated with important hostel notices in real time.',
                        'Designed to reduce paperwork and administrative workload.',
                        'Ensuring safe, transparent, and efficient campus living.',
                    ].map((line, i) => (
                        <View key={i} style={sStyles.bulletRow}>
                            <View style={sStyles.bulletDot} />
                            <Text style={sStyles.welcomeCardDesc}>{line}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Stats */}
                <Animated.View
                    style={[
                        sStyles.statsRow,
                        { opacity: statsOpacity, transform: [{ translateY: statsY }] },
                    ]}
                >
                    <View style={sStyles.statItem}>
                        <Text style={sStyles.statNumber}>288</Text>
                        <Text style={sStyles.statLabel}>Girls Capacity</Text>
                    </View>
                    <View style={sStyles.statDivider} />
                    <View style={sStyles.statItem}>
                        <Text style={sStyles.statNumber}>336</Text>
                        <Text style={sStyles.statLabel}>Boys Capacity</Text>
                    </View>
                    <View style={sStyles.statDivider} />
                    <View style={sStyles.statItem}>
                        <Text style={sStyles.statNumber}>5</Text>
                        <Text style={sStyles.statLabel}>Hostels</Text>
                    </View>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide 2 — Hostel Facilities
// ─────────────────────────────────────────────────────────────────────────────

const facilitiesList = [
    { icon: Camera, label: 'CCTV Surveillance', iconColor: Colors.info },
    { icon: Sun, label: 'Solar Water Heater', iconColor: Colors.warning },
    { icon: Droplets, label: 'Aqua Guard Water Filter', iconColor: Colors.primary },
    { icon: UtensilsCrossed, label: 'Mess Facility', iconColor: Colors.success },
    { icon: Shield, label: 'Sanitary Napkin Vending Machine', iconColor: '#AD1457' },
];

function Slide2Facilities({
    isActive,
    scrollX,
    slideIndex,
}: {
    isActive: boolean;
    scrollX: Animated.Value;
    slideIndex: number;
}) {
    const badgeScale = useRef(new Animated.Value(0.4)).current;
    const badgeOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleY = useRef(new Animated.Value(24)).current;

    // One pair per facility row
    const rowOpacities = useRef(facilitiesList.map(() => new Animated.Value(0))).current;
    const rowTranslateXs = useRef(facilitiesList.map(() => new Animated.Value(-40))).current;

    const tagOpacity = useRef(new Animated.Value(0)).current;
    const tagY = useRef(new Animated.Value(16)).current;

    useEffect(() => {
        if (!isActive) return;

        resetAnims([
            { value: badgeScale, initial: 0.4 },
            { value: badgeOpacity, initial: 0 },
            { value: titleOpacity, initial: 0 },
            { value: titleY, initial: 24 },
            { value: tagOpacity, initial: 0 },
            { value: tagY, initial: 16 },
        ]);
        rowOpacities.forEach(v => v.setValue(0));
        rowTranslateXs.forEach(v => v.setValue(-40));

        // Staggered row animations
        const rowAnims = facilitiesList.map((_, i) =>
            slideInLeft(rowOpacities[i], rowTranslateXs[i], 320 + i * 90),
        );

        Animated.parallel([
            springIn(badgeScale, 0, 55, 6),
            Animated.timing(badgeOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
            slideUp(titleOpacity, titleY, 200),
            ...rowAnims,
            slideUp(tagOpacity, tagY, 320 + facilitiesList.length * 90 + 60),
        ]).start();
    }, [isActive]);

    const inputRange = [(slideIndex - 1) * width, slideIndex * width, (slideIndex + 1) * width];
    const slideScale = scrollX.interpolate({
        inputRange,
        outputRange: [0.93, 1, 0.93],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View style={[sStyles.slide, { transform: [{ scale: slideScale }] }]}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary, '#26A69A']}
                style={sStyles.slideHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={sStyles.decorCircleLarge} />
                <View style={sStyles.decorCircleSmall} />

                <View style={sStyles.headerContent}>
                    <Animated.View
                        style={[
                            sStyles.iconBadge,
                            { opacity: badgeOpacity, transform: [{ scale: badgeScale }] },
                        ]}
                    >
                        <Shield size={34} color={Colors.white} />
                    </Animated.View>

                    <Animated.Text
                        style={[sStyles.slideHeaderTitle, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
                    >
                        Modern & Secure
                    </Animated.Text>
                    <Animated.Text
                        style={[sStyles.slideHeaderSubtitle, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
                    >
                        Hostel Facilities
                    </Animated.Text>
                </View>
            </LinearGradient>

            <View style={sStyles.slideBody}>
                <View style={sStyles.listCard}>
                    {facilitiesList.map((item, index) => {
                        const IconComp = item.icon;
                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    sStyles.facilityRow,
                                    index < facilitiesList.length - 1 && sStyles.facilityRowBorder,
                                    {
                                        opacity: rowOpacities[index],
                                        transform: [{ translateX: rowTranslateXs[index] }],
                                    },
                                ]}
                            >
                                <View style={[sStyles.facilityIconWrap, { backgroundColor: `${item.iconColor}18` }]}>
                                    <IconComp size={20} color={item.iconColor} />
                                </View>
                                <Text style={sStyles.facilityLabel}>{item.label}</Text>
                                <CheckCircle2 size={16} color={Colors.primaryLight} />
                            </Animated.View>
                        );
                    })}
                </View>

                <Animated.View
                    style={[
                        sStyles.bottomTagRow,
                        { opacity: tagOpacity, transform: [{ translateY: tagY }] },
                    ]}
                >
                    <View style={[sStyles.tagBadge, { backgroundColor: Colors.primaryGhost }]}>
                        <Text style={[sStyles.tagText, { color: Colors.primaryDark }]}>
                            Safe & Student-Friendly Environment
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide 3 — Smart Features + Get Started
// ─────────────────────────────────────────────────────────────────────────────

const featuresList = [
    { icon: Bell, label: 'Notice Board', bg: Colors.infoLight, color: Colors.info },
    { icon: MessageSquare, label: 'Complaint Box', bg: Colors.errorLight, color: Colors.error },
    { icon: UtensilsCrossed, label: 'Mess Section', bg: Colors.successLight, color: Colors.success },
    { icon: BedDouble, label: 'Room Information', bg: Colors.primaryGhost, color: Colors.primary },
    { icon: CalendarDays, label: 'Leave Application', bg: Colors.warningLight, color: Colors.warning },
    { icon: Siren, label: 'Emergency Alert System', bg: '#FFEBEE', color: Colors.error },
];

function Slide3Features({
    isActive,
    scrollX,
    slideIndex,
    onGetStarted,
}: {
    isActive: boolean;
    scrollX: Animated.Value;
    slideIndex: number;
    onGetStarted: () => void;
}) {
    const badgeScale = useRef(new Animated.Value(0.4)).current;
    const badgeOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleY = useRef(new Animated.Value(24)).current;

    const cardScales = useRef(featuresList.map(() => new Animated.Value(0.7))).current;
    const cardOpacities = useRef(featuresList.map(() => new Animated.Value(0))).current;

    const btnOpacity = useRef(new Animated.Value(0)).current;
    const btnY = useRef(new Animated.Value(32)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isActive) return;

        resetAnims([
            { value: badgeScale, initial: 0.4 },
            { value: badgeOpacity, initial: 0 },
            { value: titleOpacity, initial: 0 },
            { value: titleY, initial: 24 },
            { value: btnOpacity, initial: 0 },
            { value: btnY, initial: 32 },
        ]);
        cardScales.forEach(v => v.setValue(0.7));
        cardOpacities.forEach(v => v.setValue(0));

        // Stagger card scale+fade
        const cardAnims = featuresList.map((_, i) =>
            Animated.sequence([
                Animated.delay(300 + i * 70),
                Animated.parallel([
                    Animated.spring(cardScales[i], {
                        toValue: 1, tension: 60, friction: 7, useNativeDriver: true,
                    }),
                    Animated.timing(cardOpacities[i], {
                        toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true,
                    }),
                ]),
            ]),
        );

        const btnDelay = 300 + featuresList.length * 70 + 80;

        Animated.parallel([
            springIn(badgeScale, 0, 55, 6),
            Animated.timing(badgeOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
            slideUp(titleOpacity, titleY, 180),
            ...cardAnims,
            slideUp(btnOpacity, btnY, btnDelay, 460),
        ]).start();
    }, [isActive]);

    const onPressIn = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(btnScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    const inputRange = [(slideIndex - 1) * width, slideIndex * width, (slideIndex + 1) * width];
    const slideScale = scrollX.interpolate({
        inputRange,
        outputRange: [0.93, 1, 0.93],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View style={[sStyles.slide, { transform: [{ scale: slideScale }] }]}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary, '#26A69A']}
                style={sStyles.slideHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={sStyles.decorCircleLarge} />
                <View style={sStyles.decorCircleSmall} />

                <View style={sStyles.headerContent}>
                    <Animated.View
                        style={[
                            sStyles.iconBadge,
                            { opacity: badgeOpacity, transform: [{ scale: badgeScale }] },
                        ]}
                    >
                        <Bell size={34} color={Colors.white} />
                    </Animated.View>

                    <Animated.Text
                        style={[sStyles.slideHeaderTitle, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
                    >
                        Smart Digital
                    </Animated.Text>
                    <Animated.Text
                        style={[sStyles.slideHeaderSubtitle, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
                    >
                        Hostel Management
                    </Animated.Text>
                </View>
            </LinearGradient>

            <View style={[sStyles.slideBody, { gap: 14 }]}>
                {/* 3×2 feature grid */}
                <View style={sStyles.featuresGrid}>
                    {featuresList.map((item, index) => {
                        const IconComp = item.icon;
                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    sStyles.featureCard,
                                    {
                                        opacity: cardOpacities[index],
                                        transform: [{ scale: cardScales[index] }],
                                    },
                                ]}
                            >
                                <View style={[sStyles.featureIconWrap, { backgroundColor: item.bg }]}>
                                    <IconComp size={22} color={item.color} />
                                </View>
                                <Text style={sStyles.featureCardLabel}>{item.label}</Text>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Get Started button */}
                <Animated.View
                    style={{ opacity: btnOpacity, transform: [{ translateY: btnY }, { scale: btnScale }] }}
                >
                    <TouchableOpacity
                        onPress={onGetStarted}
                        onPressIn={onPressIn}
                        onPressOut={onPressOut}
                        activeOpacity={0.9}
                        testID="get-started-btn"
                        style={sStyles.getStartedBtn}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={sStyles.getStartedGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={sStyles.getStartedText}>Get Started</Text>
                            <ArrowRight size={20} color={Colors.white} style={{ marginLeft: 8 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.Text style={[sStyles.taglineText, { opacity: btnOpacity }]}>
                    Transparent  •  Paperless  •  Efficient
                </Animated.Text>
            </View>
        </Animated.View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Pagination Dots
// ─────────────────────────────────────────────────────────────────────────────

function PaginationDots({ total, scrollX }: { total: number; scrollX: Animated.Value }) {
    return (
        <View style={dotsStyles.row}>
            {Array.from({ length: total }).map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 26, 8], extrapolate: 'clamp' });
                const opacity = scrollX.interpolate({ inputRange, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' });
                const scale = scrollX.interpolate({ inputRange, outputRange: [0.85, 1, 0.85], extrapolate: 'clamp' });
                return (
                    <Animated.View
                        key={i}
                        style={[dotsStyles.dot, { width: dotWidth, opacity, transform: [{ scale }] }]}
                    />
                );
            })}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Onboarding Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    // Bottom-bar entrance animation
    const barOpacity = useRef(new Animated.Value(0)).current;
    const barY = useRef(new Animated.Value(40)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(barOpacity, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
            Animated.timing(barY, { toValue: 0, duration: 500, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    const completeOnboarding = useCallback(async () => {
        try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch (_) { }
        router.replace('/(tabs)' as any);
    }, [router]);

    const handleNext = useCallback(() => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    }, [currentIndex]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const isLastSlide = currentIndex === SLIDES.length - 1;

    const renderItem = useCallback(
        ({ item, index }: { item: SlideKey; index: number }) => {
            const isActive = index === currentIndex;
            if (item === 'welcome') {
                return <Slide1Welcome isActive={isActive} scrollX={scrollX} slideIndex={index} />;
            }
            if (item === 'facilities') {
                return <Slide2Facilities isActive={isActive} scrollX={scrollX} slideIndex={index} />;
            }
            return (
                <Slide3Features
                    isActive={isActive}
                    scrollX={scrollX}
                    slideIndex={index}
                    onGetStarted={completeOnboarding}
                />
            );
        },
        [currentIndex, scrollX, completeOnboarding],
    );

    return (
        <View style={gStyles.container}>
            {/* Slide list with scroll tracking */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={(item) => item}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false },
                )}
                scrollEventThrottle={8}
            />

            {/* Bottom navigation bar */}
            <Animated.View
                style={[
                    gStyles.bottomBar,
                    { paddingBottom: insets.bottom + 16 },
                    { opacity: barOpacity, transform: [{ translateY: barY }] },
                ]}
            >
                <PaginationDots total={SLIDES.length} scrollX={scrollX} />

                {!isLastSlide && (
                    <View style={gStyles.bottomActions}>
                        <TouchableOpacity
                            onPress={completeOnboarding}
                            style={gStyles.skipBtn}
                            testID="skip-btn"
                        >
                            <Text style={gStyles.skipText}>Skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleNext}
                            style={gStyles.nextBtn}
                            testID="next-btn"
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryDark]}
                                style={gStyles.nextBtnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={gStyles.nextText}>Next</Text>
                                <ArrowRight size={16} color={Colors.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const BOTTOM_BAR_H = 112;

const gStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primaryDark,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        paddingTop: 14,
        paddingHorizontal: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 12,
        alignItems: 'center',
        gap: 12,
    },
    bottomActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    skipBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    skipText: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    nextBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    nextBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 6,
    },
    nextText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.white,
    },
});

const dotsStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
});

const sStyles = StyleSheet.create({
    // ── Slide shell ──────────────────────────────────────────────────────────
    slide: {
        width,
        height,
        backgroundColor: Colors.background,
    },

    // ── Gradient header ───────────────────────────────────────────────────────
    slideHeader: {
        paddingBottom: 26,
        paddingHorizontal: 24,
        paddingTop: 54,
        overflow: 'hidden',
        position: 'relative',
    },
    decorCircleLarge: {
        position: 'absolute',
        width: width * 0.72,
        height: width * 0.72,
        borderRadius: width * 0.36,
        backgroundColor: 'rgba(255,255,255,0.06)',
        top: -width * 0.18,
        right: -width * 0.18,
    },
    decorCircleSmall: {
        position: 'absolute',
        width: width * 0.45,
        height: width * 0.45,
        borderRadius: width * 0.225,
        backgroundColor: 'rgba(255,255,255,0.05)',
        bottom: -width * 0.12,
        left: -width * 0.1,
    },
    headerContent: {
        alignItems: 'center',
    },

    // ── Logo (Slide 1) ────────────────────────────────────────────────────────
    logoBadge: {
        width: 108,
        height: 108,
        borderRadius: 54,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    logoImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    collegeName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.white,
        textAlign: 'center',
    },
    collegeNameAccent: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginTop: 2,
    },

    // ── Icon badge (Slides 2 & 3) ─────────────────────────────────────────────
    iconBadge: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    slideHeaderTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.white,
        textAlign: 'center',
    },
    slideHeaderSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 2,
    },

    // ── Slide body ────────────────────────────────────────────────────────────
    slideBody: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: BOTTOM_BAR_H + 8,
    },

    // ── Slide 1: Welcome card + stats ─────────────────────────────────────────
    welcomeCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    welcomeCardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 6,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 7,
        gap: 8,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginTop: 6,
        flexShrink: 0,
    },
    welcomeCardDesc: {
        flex: 1,
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 19,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 8,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.primaryDark,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 3,
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginVertical: 4,
    },

    // ── Shared tag ────────────────────────────────────────────────────────────
    tagBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 10,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },

    // ── Slide 2: Facilities list ──────────────────────────────────────────────
    listCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    facilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        gap: 14,
    },
    facilityRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    facilityIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    facilityLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    bottomTagRow: {
        alignItems: 'center',
        marginTop: 14,
    },

    // ── Slide 3: Feature grid ─────────────────────────────────────────────────
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
    },
    featureCard: {
        width: '48%',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    featureIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    featureCardLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 16,
    },

    // ── Get Started button ────────────────────────────────────────────────────
    getStartedBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    getStartedGradient: {
        flexDirection: 'row',
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
    },
    getStartedText: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.white,
        letterSpacing: 0.3,
    },
    taglineText: {
        fontSize: 12,
        color: Colors.textLight,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});
