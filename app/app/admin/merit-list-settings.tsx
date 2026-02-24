import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Save,
    School,
    Users,
    Info,
    CheckCircle2,
    ListChecks,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAdmissionStore } from '@/store/admission-store';
import * as Haptics from 'expo-haptics';

const DEPARTMENTS = [
    'Automobile Engineering',
    'Civil Engineering',
    'Computer Engineering',
    'Electrical Engineering',
    'E&TC Engineering',
    'Information Technology',
    'Mechanical Engineering'
];

const CATEGORIES = [
    'Open', 'OBC', 'TFWS', 'EWS', 'SEBC', 'SC', 'ST', 'VJ(NTA)', 'NT1(NTB)', 'NT2(NTC)', 'NT3(NTD)'
];

export default function MeritListSettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const {
        meritListSettings,
        fetchMeritListSettings,
        updateMeritListSettings,
        generateMeritList,
        isLoading
    } = useAdmissionStore();

    const [deptSeats, setDeptSeats] = useState<Record<string, string>>({});
    const [catPercentages, setCatPercentages] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadSettings = async () => {
            await fetchMeritListSettings();
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (meritListSettings) {
            const initialDeptSeats: Record<string, string> = {};
            DEPARTMENTS.forEach(dept => {
                const val = meritListSettings.departmentSeats?.[dept];
                initialDeptSeats[dept] = (val !== undefined && val !== null && val !== 0) ? val.toString() : '';
            });
            setDeptSeats(initialDeptSeats);

            const initialCatPercentages: Record<string, string> = {};
            CATEGORIES.forEach(cat => {
                const val = meritListSettings.categoryPercentages?.[cat];
                initialCatPercentages[cat] = (val !== undefined && val !== null && val !== 0) ? val.toString() : '';
            });
            setCatPercentages(initialCatPercentages);
        }
    }, [meritListSettings]);

    const handleSave = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const departmentSeats: Record<string, number> = {};
        DEPARTMENTS.forEach(dept => {
            departmentSeats[dept] = parseInt(deptSeats[dept] || '0', 10);
        });

        const categoryPercentages: Record<string, number> = {};
        let totalPct = 0;
        CATEGORIES.forEach(cat => {
            const val = parseFloat(catPercentages[cat] || '0');
            categoryPercentages[cat] = val;
            totalPct += val;
        });

        if (totalPct > 100) {
            Alert.alert('Warning', `Total percentage (${totalPct}%) exceeds 100%. Please check your distribution.`);
            return;
        }

        const success = await updateMeritListSettings({
            departmentSeats,
            categoryPercentages,
        });

        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Configuration saved. You can always come back and complete it later.');
            router.back();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to save settings.');
        }
    };

    const handleGenerate = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        const totalPct = Object.values(catPercentages).reduce((acc, val) => acc + parseFloat(val || '0'), 0);

        if (totalPct > 100) {
            Alert.alert('Cannot Generate', `Total category distribution (${totalPct}%) exceeds 100%. Please adjust before generating.`);
            return;
        }

        if (totalPct === 0) {
            Alert.alert('Warning', 'You are generating a merit list with 0% reserved seats. Only the Open category will be filled if it has a percentage. Continue?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', onPress: () => processGeneration() }
            ]);
        } else {
            Alert.alert(
                'Generate Merit List',
                'This will calculate and save a new merit list based on current percentages. Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Generate', onPress: () => processGeneration() }
                ]
            );
        }
    };

    const processGeneration = async () => {
        const result = await generateMeritList();
        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Navigate to results page after successful generation
            router.push('/admin/merit-list-results');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', result.message);
        }
    };

    const totalPercentage = Object.values(catPercentages).reduce((acc, val) => acc + parseFloat(val || '0'), 0);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Merit List Config</Text>
                <TouchableOpacity
                    style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <Save size={20} color={Colors.white} />
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <School size={22} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Department Seats</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>Enter the total number of available seats for each department.</Text>

                        {DEPARTMENTS.map(dept => (
                            <View key={dept} style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <View style={styles.dot} />
                                    <Text style={styles.inputLabel}>{dept}</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    keyboardType="number-pad"
                                    value={deptSeats[dept]}
                                    onChangeText={(text) => setDeptSeats({ ...deptSeats, [dept]: text })}
                                />
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Users size={22} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Category-wise Distribution</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>Define percentage distribution for each category. (Applied to total seats in each department)</Text>

                        <View style={[styles.infoBadge, totalPercentage > 100 && { backgroundColor: '#FFEDEB' }]}>
                            <Text style={[styles.infoBadgeText, totalPercentage > 100 && { color: '#E53E3E' }]}>
                                Total Distribution: {totalPercentage.toFixed(1)}% {totalPercentage > 100 ? '(EXCEEDED)' : ''}
                            </Text>
                        </View>

                        {CATEGORIES.map(cat => (
                            <View key={cat} style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
                                    <Text style={styles.inputLabel}>{cat} Quota</Text>
                                </View>
                                <View style={styles.percentageInputWrap}>
                                    <TextInput
                                        style={[styles.input, { borderColor: Colors.accent + '40', width: 60 }]}
                                        placeholder="0"
                                        keyboardType="decimal-pad"
                                        value={catPercentages[cat]}
                                        onChangeText={(text) => setCatPercentages({ ...catPercentages, [cat]: text })}
                                    />
                                    <Text style={styles.percentageSymbol}>%</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.infoCard}>
                        <Info size={20} color={Colors.primary} />
                        <Text style={styles.infoText}>
                            Students are ranked by percentage. For each department, seats are filled first for Open category, then reserved categories.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.generateBtn, isLoading && styles.generateBtnDisabled]}
                        onPress={handleGenerate}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <ListChecks size={22} color={Colors.white} style={{ marginRight: 10 }} />
                                <Text style={styles.generateBtnText}>Generate Final Merit List</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnDisabled: {
        backgroundColor: Colors.textLight,
        shadowOpacity: 0,
        elevation: 0,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 24,
        lineHeight: 18,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: Colors.background,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border + '40',
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    inputLabel: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        width: 70,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    percentageInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    percentageSymbol: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    infoBadge: {
        backgroundColor: Colors.primary + '10',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    infoBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 20,
        gap: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '20',
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
        lineHeight: 19,
    },
    generateBtn: {
        backgroundColor: Colors.accent,
        flexDirection: 'row',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20, // Added margin bottom
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    generateBtnDisabled: {
        backgroundColor: Colors.textLight,
        shadowOpacity: 0,
        elevation: 0,
    },
    generateBtnText: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.white,
    }
});
