import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    Linking,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Phone, Mail, Globe, Clock, Building2, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const contactInfo = [
    {
        icon: <Building2 size={20} color={Colors.primary} />,
        label: 'Institute',
        value: 'Government Polytechnic, Awasari (Kh.)',
    },
    {
        icon: <Mail size={20} color={Colors.primary} />,
        label: 'Email',
        value: 'gpawasari@gmail.com',
        action: 'mailto:gpawasari@gmail.com',
    },
    {
        icon: <Phone size={20} color={Colors.primary} />,
        label: 'Phone',
        value: '9970723236',
        action: 'tel:9970723236',
    },
    {
        icon: <MapPin size={20} color={Colors.primary} />,
        label: 'Address',
        value: 'Awasari (Kh.), Tal. Ambegaon, Dist. Pune, Maharashtra',
    },
    {
        icon: <Clock size={20} color={Colors.primary} />,
        label: 'Office Hours',
        value: 'Mon - Sat: 9:00 AM - 5:00 PM',
    },
];

const rectors = [
    {
        name: 'Smt. Priya Narayandas Malu',
        title: 'Rector – Girls Hostel',
        department: 'Lecturer in Electronics Engineering',
        hostels: 'Saraswati, Shwetambara',
    },
    {
        name: 'Dr. M. R. Umbarkar',
        title: 'Rector – Boys Hostel',
        department: 'Lecturer in Electronics Engineering',
        hostels: 'Lenyadri, Bhimashankar, Shivneri',
        phone: '7972565738',
    },
];

export default function ContactScreen() {
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 450,
                delay: 200 + i * 150,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const handleLink = (url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL(url);
    };

    const openMap = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const url = Platform.select({
            ios: 'maps:0,0?q=Government+Polytechnic+Awasari+Khurd',
            android: 'geo:0,0?q=Government+Polytechnic+Awasari+Khurd',
            default: 'https://www.google.com/maps/search/Government+Polytechnic+Awasari+Khurd',
        });
        if (url) Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.headerRow}>
                        <Phone size={24} color={Colors.white} />
                        <Text style={styles.headerTitle}>Contact Us</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Get in touch with the hostel office</Text>
                </Animated.View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: cardAnims[0],
                            transform: [{ translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                        },
                    ]}
                >
                    <Text style={styles.cardTitle}>Contact Information</Text>
                    {contactInfo.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.contactRow}
                            disabled={!item.action}
                            onPress={() => item.action && handleLink(item.action)}
                            activeOpacity={item.action ? 0.7 : 1}
                        >
                            <View style={styles.contactIcon}>{item.icon}</View>
                            <View style={styles.contactText}>
                                <Text style={styles.contactLabel}>{item.label}</Text>
                                <Text style={[styles.contactValue, item.action && styles.contactLink]}>
                                    {item.value}
                                </Text>
                            </View>
                            {item.action && <ExternalLink size={14} color={Colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: cardAnims[1],
                            transform: [{ translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                        },
                    ]}
                >
                    <Text style={styles.cardTitle}>Hostel Rectors</Text>
                    {rectors.map((rector, index) => (
                        <View key={index} style={[styles.rectorCard, index < rectors.length - 1 && styles.rectorBorder]}>
                            <View style={styles.rectorAvatar}>
                                <Text style={styles.rectorInitial}>{rector.name[0]}</Text>
                            </View>
                            <View style={styles.rectorInfo}>
                                <Text style={styles.rectorName}>{rector.name}</Text>
                                <Text style={styles.rectorTitle}>{rector.title}</Text>
                                <Text style={styles.rectorDept}>{rector.department}</Text>
                                <Text style={styles.rectorHostels}>Hostels: {rector.hostels}</Text>
                                {rector.phone && (
                                    <TouchableOpacity
                                        onPress={() => handleLink(`tel:${rector.phone}`)}
                                        style={styles.rectorPhone}
                                    >
                                        <Phone size={12} color={Colors.primary} />
                                        <Text style={styles.rectorPhoneText}>{rector.phone}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </Animated.View>

                <Animated.View
                    style={[
                        {
                            opacity: cardAnims[2],
                            transform: [{ translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                        },
                    ]}
                >
                    <TouchableOpacity style={styles.mapButton} onPress={openMap} activeOpacity={0.85}>
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={styles.mapButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MapPin size={20} color={Colors.white} />
                            <Text style={styles.mapButtonText}>Open in Maps</Text>
                            <ExternalLink size={16} color="rgba(255,255,255,0.7)" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

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
    content: {
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
    cardTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 16,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryGhost,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contactText: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 11,
        color: Colors.textLight,
        marginBottom: 2,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
    },
    contactValue: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: Colors.text,
    },
    contactLink: {
        color: Colors.primary,
    },
    rectorCard: {
        flexDirection: 'row',
        paddingVertical: 14,
    },
    rectorBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    rectorAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rectorInitial: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.primaryDark,
    },
    rectorInfo: {
        flex: 1,
    },
    rectorName: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    rectorTitle: {
        fontSize: 13,
        fontWeight: '500' as const,
        color: Colors.primary,
        marginTop: 2,
    },
    rectorDept: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    rectorHostels: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 4,
    },
    rectorPhone: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    rectorPhoneText: {
        fontSize: 13,
        fontWeight: '500' as const,
        color: Colors.primary,
    },
    mapButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    mapButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
    },
    mapButtonText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: Colors.white,
    },
});
