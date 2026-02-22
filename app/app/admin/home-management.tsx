import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Calendar,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    Save,
    Bell,
    Settings2,
    CheckCircle2,
    Clock,
    ChevronDown,
    FileText,
    Users,
    ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

// ── Mock Initial State ──────────────────────────────────────────────────────
const initialSettings = {
    isRegistrationEnabled: true,
    startDate: '2025-07-01',
    endDate: '2025-07-31',
    showFeeStructure: true,
    showMeritList: false,
};

const initialAnnouncements = [
    { id: '1', title: 'Admissions 2025', message: 'Registration starts from July 1st.', priority: 'urgent', visible: true },
    { id: '2', title: 'Documents Required', message: 'Keep your marksheet and photos ready.', priority: 'normal', visible: true },
];

export default function HomeManagementScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [isSaving, setIsSaving] = useState(false);

    // Form for new announcement
    const [newAnnTitle, setNewAnnTitle] = useState('');
    const [newAnnMsg, setNewAnnMsg] = useState('');

    const saveSuccessAnim = useRef(new Animated.Value(0)).current;

    const handleSaveSettings = () => {
        setIsSaving(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Simulating save delay
        setTimeout(() => {
            setIsSaving(false);
            Animated.sequence([
                Animated.timing(saveSuccessAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.delay(2000),
                Animated.timing(saveSuccessAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]).start();
        }, 800);
    };

    const addAnnouncement = () => {
        if (!newAnnTitle || !newAnnMsg) {
            Alert.alert('Error', 'Please fill in both title and message');
            return;
        }
        const newAnn = {
            id: Date.now().toString(),
            title: newAnnTitle,
            message: newAnnMsg,
            priority: 'normal',
            visible: true,
        };
        setAnnouncements([newAnn, ...announcements]);
        setNewAnnTitle('');
        setNewAnnMsg('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const deleteAnnouncement = (id: string) => {
        setAnnouncements(announcements.filter(a => a.id !== id));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerSection}>
                    <Text style={styles.sectionTitle}>Management Modules</Text>
                    <Text style={styles.sectionSubtitle}>Quick access to administrative tasks</Text>
                </View>

                <View style={styles.card}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.moduleBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/admin/admission-management' as any);
                        }}
                    >
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconWrap, { backgroundColor: '#E0F2F1' }]}>
                                <Users size={20} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Admission Management</Text>
                                <Text style={styles.settingDesc}>Review and process hostel applications</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color={Colors.textLight} />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerSection}>
                    <Text style={styles.sectionTitle}>Home Page Visibility</Text>
                    <Text style={styles.sectionSubtitle}>Control what students see on the home screen</Text>
                </View>

                {/* ── Visibility Toggles ── */}
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconWrap, { backgroundColor: '#E3F2FD' }]}>
                                <Eye size={20} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Admission Form</Text>
                                <Text style={styles.settingDesc}>Control admission form visibility</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.isRegistrationEnabled}
                            onValueChange={(val) => setSettings({ ...settings, isRegistrationEnabled: val })}
                            trackColor={{ false: '#767577', true: Colors.primary }}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconWrap, { backgroundColor: '#E8F5E9' }]}>
                                <Calendar size={20} color="#2E7D32" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Admission Schedule</Text>
                                <Text style={styles.settingDesc}>Display procedure timeline</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.showFeeStructure}
                            onValueChange={(val) => setSettings({ ...settings, showFeeStructure: val })}
                            trackColor={{ false: '#767577', true: Colors.primary }}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconWrap, { backgroundColor: '#FFF3E0' }]}>
                                <FileText size={20} color="#E65100" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Merit List</Text>
                                <Text style={styles.settingDesc}>Public link for selections</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.showMeritList}
                            onValueChange={(val) => setSettings({ ...settings, showMeritList: val })}
                            trackColor={{ false: '#767577', true: Colors.primary }}
                        />
                    </View>
                </View>

                {/* ── Date Controls ── */}
                <View style={styles.headerSection}>
                    <Text style={styles.sectionTitle}>Registration Timeline</Text>
                </View>
                <View style={styles.card}>
                    <View style={styles.dateInputGroup}>
                        <Text style={styles.inputLabel}>Opening Date</Text>
                        <View style={styles.inputContainer}>
                            <Calendar size={18} color={Colors.textLight} />
                            <TextInput
                                style={styles.textInput}
                                value={settings.startDate}
                                onChangeText={(val) => setSettings({ ...settings, startDate: val })}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    </View>
                    <View style={styles.dateInputGroup}>
                        <Text style={styles.inputLabel}>Closing Date</Text>
                        <View style={styles.inputContainer}>
                            <Clock size={18} color={Colors.textLight} />
                            <TextInput
                                style={styles.textInput}
                                value={settings.endDate}
                                onChangeText={(val) => setSettings({ ...settings, endDate: val })}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    </View>
                </View>

                {/* ── Announcements Management ── */}
                <View style={[styles.headerSection, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View>
                        <Text style={styles.sectionTitle}>Global Announcements</Text>
                        <Text style={styles.sectionSubtitle}>Broadcasting to all students</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{announcements.length} Active</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.newAnnForm}>
                        <TextInput
                            style={styles.annTitleInput}
                            placeholder="Announcement Title"
                            value={newAnnTitle}
                            onChangeText={setNewAnnTitle}
                        />
                        <TextInput
                            style={styles.annMsgInput}
                            placeholder="Brief message..."
                            multiline
                            numberOfLines={3}
                            value={newAnnMsg}
                            onChangeText={setNewAnnMsg}
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={addAnnouncement}>
                            <Plus size={18} color={Colors.white} />
                            <Text style={styles.addBtnText}>Add Announcement</Text>
                        </TouchableOpacity>
                    </View>

                    {announcements.map((ann, idx) => (
                        <View key={ann.id} style={[styles.annItem, idx === 0 && { borderTopWidth: 0 }]}>
                            <View style={styles.annContent}>
                                <View style={styles.annHeader}>
                                    <View style={[styles.priorityDot, ann.priority === 'urgent' && { backgroundColor: Colors.error }]} />
                                    <Text style={styles.annItemTitle}>{ann.title}</Text>
                                </View>
                                <Text style={styles.annItemMsg}>{ann.message}</Text>
                            </View>
                            <TouchableOpacity onPress={() => deleteAnnouncement(ann.id)} style={styles.deleteBtn}>
                                <Trash2 size={18} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* ── Save Action ── */}
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveSettings}
                    disabled={isSaving}
                >
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryDark]}
                        style={styles.saveBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isSaving ? (
                            <Text style={styles.saveBtnText}>Saving Changes...</Text>
                        ) : (
                            <>
                                <Save size={20} color={Colors.white} />
                                <Text style={styles.saveBtnText}>Apply All Changes</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Animated.View style={[styles.successBanner, { opacity: saveSuccessAnim, transform: [{ translateY: saveSuccessAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <CheckCircle2 size={18} color={Colors.white} />
                    <Text style={styles.successText}>Settings updated successfully!</Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        padding: 16,
    },
    headerSection: {
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    moduleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    settingDesc: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F3F5',
        marginHorizontal: 4,
    },
    dateInputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderWidth: 1.5,
        borderColor: '#E9ECEF',
        borderRadius: 12,
        paddingHorizontal: 12,
        gap: 10,
    },
    textInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.text,
    },
    badge: {
        backgroundColor: Colors.primaryGhost,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '700' as const,
    },
    newAnnForm: {
        marginBottom: 16,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        borderStyle: 'dashed' as const,
    },
    annTitleInput: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
        marginBottom: 8,
    },
    annMsgInput: {
        fontSize: 14,
        color: Colors.textSecondary,
        minHeight: 60,
        textAlignVertical: 'top' as const,
        marginBottom: 12,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    addBtnText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600' as const,
    },
    annItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
    },
    annContent: {
        flex: 1,
    },
    annHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    annItemTitle: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    annItemMsg: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    deleteBtn: {
        padding: 8,
        marginLeft: 8,
    },
    saveBtn: {
        marginTop: 10,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    saveBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    saveBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700' as const,
    },
    successBanner: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        backgroundColor: '#2E7D32',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    successText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600' as const,
    },
});
