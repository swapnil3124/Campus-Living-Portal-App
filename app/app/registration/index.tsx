import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    Animated,
    Dimensions,
    Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    ChevronDown,
    X,
    CheckCircle2,
    Calendar,
    Briefcase,
    FileUp,
    CheckCircle,
    Send,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAdmissionStore } from '@/store/admission-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RegistrationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { addAdmission, regConfig, fetchRegConfig } = useAdmissionStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isConfigLoaded, setIsConfigLoaded] = useState(false);
    const [currentStep, setCurrentStep] = useState(0); // 0-indexed page
    const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<{ fieldId: string, options: string[] } | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Progressive animation
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchRegConfig().then(() => {
            setIsConfigLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (regConfig.pages && regConfig.pages.length > 0) {
            const initialData: Record<string, any> = {};
            regConfig.pages.forEach(page => {
                page.fields.forEach(field => {
                    // Preserve existing data if possible, otherwise initialize
                    initialData[field.id] = formData[field.id] || (field.type === 'dropdown' ? '' : '');
                });
            });
            setFormData(initialData);
        }
    }, [regConfig.pages]);

    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: currentStep,
            useNativeDriver: false,
            friction: 7,
            tension: 40,
        }).start();
    }, [currentStep]);

    if (!isConfigLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading form...</Text>
            </View>
        );
    }

    const pages = regConfig.pages || [];
    const currentPage = pages[currentStep];
    const isClosed = !regConfig.isOpen;
    const now = new Date();
    const isPast = regConfig.endDate && now > new Date(regConfig.endDate);
    const isBefore = regConfig.startDate && now < new Date(regConfig.startDate);

    if (isClosed || isPast || isBefore) {
        return (
            <View style={styles.loadingContainer}>
                <X size={48} color={Colors.error} />
                <Text style={[styles.loadingText, { color: Colors.text, fontSize: 18, marginTop: 16 }]}>
                    {isClosed ? 'Registration is Closed' :
                        isPast ? 'Registration Deadline has Passed' :
                            'Registration has not started yet'}
                </Text>
                <Text style={{ color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginTop: 8 }}>
                    {isPast ? `The deadline was ${new Date(regConfig.endDate).toLocaleDateString()}` :
                        isBefore ? `Registration will open on ${new Date(regConfig.startDate).toLocaleDateString()}` :
                            'Please check back later or contact the administrator.'}
                </Text>
                <TouchableOpacity style={[styles.backBtnFooter, { marginTop: 30, width: 200 }]} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (pages.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Syncing form configuration...</Text>
            </View>
        );
    }

    const validateStep = () => {
        if (!currentPage) return false;
        const missing = currentPage.fields.find(f => f.required && !formData[f.id]);
        if (missing) {
            Alert.alert('Required Field', `Please fill in "${missing.label}" to proceed.`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < pages.length - 1) {
                setCurrentStep(currentStep + 1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            router.back();
        }
    };

    const handleFilePick = async (fieldId: string) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                console.log('Picked file URI:', asset.uri);

                // Convert to base64 for persistent storage
                const base64 = await FileSystem.readAsStringAsync(asset.uri, {
                    encoding: 'base64',
                });

                setFormData(prev => ({
                    ...prev,
                    [fieldId]: {
                        name: asset.name,
                        type: asset.mimeType,
                        base64: `data:${asset.mimeType};base64,${base64}`
                    }
                }));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (err: any) {
            console.error('File pick error details:', err);
            Alert.alert('Processing Error', `Failed to process document: ${err.message || 'Unknown error'}`);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Map fixed fields explicitly, everything else goes to additionalData
            const {
                fullName, enrollment, email, phone,
                department, year, prevMarks, category, gender,
                ...rest
            } = formData;

            const success = await addAdmission({
                fullName: fullName || '',
                enrollment: enrollment || '',
                email: email || '',
                phone: phone || '',
                department: department || '',
                year: year || '',
                prevMarks: prevMarks || '',
                category: category || '',
                gender: gender || '',
                additionalData: rest,
                status: 'pending'
            } as any);

            setIsLoading(false);
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Success!',
                    'Your admission application has been submitted.',
                    [{ text: 'Done', onPress: () => router.replace('/(tabs)/(home)') }]
                );
            } else {
                Alert.alert('Submission Failed', 'Please try again later.');
            }
        } catch (error) {
            setIsLoading(false);
            Alert.alert('Error', 'An unexpected error occurred.');
        }
    };

    const renderField = (field: any) => {
        const value = formData[field.id] || '';
        const updateValue = (v: any) => setFormData(prev => ({ ...prev, [field.id]: v }));

        const label = (
            <Text style={styles.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
        );

        if (field.type === 'dropdown') {
            return (
                <View key={field.id} style={styles.inputGroup}>
                    {label}
                    <TouchableOpacity
                        style={[styles.inputContainer, value ? styles.inputActive : null]}
                        onPress={() => setActiveDropdown({ fieldId: field.id, options: field.options || [] })}
                    >
                        <Text style={[styles.inputText, !value && { color: Colors.textLight }]}>
                            {value || `Select ${field.label}`}
                        </Text>
                        <ChevronDown size={18} color={Colors.textLight} />
                    </TouchableOpacity>
                </View>
            );
        }

        if (field.type === 'date') {
            return (
                <View key={field.id} style={styles.inputGroup}>
                    {label}
                    <TouchableOpacity
                        style={[styles.inputContainer, value ? styles.inputActive : null]}
                        onPress={() => setShowDatePicker(field.id)}
                    >
                        <Text style={[styles.inputText, !value && { color: Colors.textLight }]}>
                            {value || `Choose date`}
                        </Text>
                        <Calendar size={18} color={value ? Colors.primary : Colors.textLight} />
                    </TouchableOpacity>
                    {showDatePicker === field.id && (
                        <DateTimePicker
                            value={value ? new Date(value) : new Date()}
                            mode="date"
                            onChange={(e, d) => {
                                setShowDatePicker(null);
                                if (d) updateValue(d.toLocaleDateString());
                            }}
                        />
                    )}
                </View>
            );
        }

        if (field.type === 'file') {
            return (
                <View key={field.id} style={styles.inputGroup}>
                    {label}
                    <TouchableOpacity
                        style={[styles.inputContainer, value ? styles.inputActive : null]}
                        onPress={() => handleFilePick(field.id)}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.inputText, !value && { color: Colors.textLight }]}>
                                {value ? (typeof value === 'object' ? value.name : 'Document Selected') : `Upload ${field.label}`}
                            </Text>
                            {value ? <Text style={{ fontSize: 10, color: Colors.success, marginTop: 2 }}>File ready for submission</Text> : null}
                        </View>
                        <FileUp size={18} color={value ? Colors.primary : Colors.textLight} />
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View key={field.id} style={styles.inputGroup}>
                {label}
                <View style={[styles.inputContainer, value ? styles.inputActive : null]}>
                    <TextInput
                        style={styles.inputText}
                        value={value}
                        onChangeText={updateValue}
                        placeholder={field.label}
                        placeholderTextColor={Colors.textLight}
                        keyboardType={field.type === 'number' ? 'number-pad' :
                            field.type === 'email' ? 'email-address' :
                                field.type === 'phone' ? 'phone-pad' : 'default'}
                    />
                </View>
            </View>
        );
    };

    const renderProgressBar = () => {
        if (pages.length <= 1) return null;
        return (
            <View style={styles.progressContainer}>
                {pages.map((_, idx) => {
                    const isActive = currentStep >= idx;
                    const isPassed = currentStep > idx;
                    return (
                        <React.Fragment key={idx}>
                            <View style={[
                                styles.progressDot,
                                isActive && styles.progressDotActive,
                                isPassed && styles.progressDotPassed
                            ]}>
                                {isPassed ? (
                                    <CheckCircle size={12} color="#FFF" />
                                ) : (
                                    <Text style={[styles.progressText, isActive && { color: '#FFF' }]}>{idx + 1}</Text>
                                )}
                            </View>
                            {idx < pages.length - 1 && (
                                <View style={[
                                    styles.progressLine,
                                    isActive && styles.progressLineActive
                                ]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.headerBackBtn} onPress={handleBack}>
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Hostel Admission</Text>
                    <Text style={styles.headerSubtitle}>2025 - 2026 Academic Year</Text>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
            >
                {renderProgressBar()}

                <View style={styles.card}>
                    <View style={styles.pageInfo}>
                        <Text style={styles.pageTitle}>{currentPage.title}</Text>
                        {currentPage.description ? <Text style={styles.pageDesc}>{currentPage.description}</Text> : null}
                    </View>

                    <View style={styles.formContent}>
                        {currentPage.fields.map(field => renderField(field))}
                    </View>
                </View>
            </ScrollView>

            {/* Footer Navigation */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                {currentStep > 0 && (
                    <TouchableOpacity style={styles.backBtnFooter} onPress={handleBack}>
                        <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.nextBtn, currentStep === pages.length - 1 && styles.submitBtn]}
                    onPress={currentStep === pages.length - 1 ? handleSubmit : handleNext}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={currentStep === pages.length - 1 ? ['#059669', '#047857'] : [Colors.primary, Colors.primaryDark]}
                        style={styles.btnGradient}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.btnText}>
                                    {currentStep === pages.length - 1 ? 'Submit Application' : 'Continue'}
                                </Text>
                                {currentStep === pages.length - 1 ? <Send size={18} color="#FFF" /> : null}
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Dropdown Modal */}
            <Modal visible={!!activeDropdown} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveDropdown(null)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Option</Text>
                            <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                                <X size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={activeDropdown?.options}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        setFormData(prev => ({ ...prev, [activeDropdown!.fieldId]: item }));
                                        setActiveDropdown(null);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        formData[activeDropdown?.fieldId || ''] === item && styles.optionTextActive
                                    ]}>{item}</Text>
                                    {formData[activeDropdown?.fieldId || ''] === item && (
                                        <CheckCircle2 size={18} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    loadingText: { marginTop: 12, color: Colors.textSecondary, fontWeight: '600' },
    backBtnLight: { marginTop: 20, padding: 10 },

    header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
    headerBackBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    headerTitleWrap: { marginTop: 16 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },

    progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 30 },
    progressDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    progressDotActive: { backgroundColor: Colors.primary },
    progressDotPassed: { backgroundColor: '#10B981' },
    progressText: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary },
    progressLine: { flex: 1, height: 4, backgroundColor: '#E2E8F0', marginHorizontal: -2, zIndex: 1 },
    progressLineActive: { backgroundColor: Colors.primary },

    card: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 24, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    pageInfo: { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 16 },
    pageTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, textTransform: 'capitalize' },
    pageDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, lineHeight: 18 },

    formContent: { gap: 16 },
    inputGroup: { marginBottom: 4 },
    label: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, paddingLeft: 4 },
    required: { color: Colors.error },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    inputActive: { borderColor: Colors.primary, backgroundColor: '#FFF' },
    inputText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text, padding: 0 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#FFF', flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    backBtnFooter: { flex: 0.4, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },
    backBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
    nextBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
    submitBtn: { flex: 1.5 },
    btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    optionText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
    optionTextActive: { color: Colors.primary, fontWeight: '700' },
});
