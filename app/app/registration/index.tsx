import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    User,
    Mail,
    Phone,
    School,
    MapPin,
    Calendar,
    Users,
    Briefcase,
    GraduationCap,
    Map,
    Stethoscope,
    FileUp,
    CheckCircle2,
    ChevronLeft,
    Image as ImageIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function RegistrationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const [form, setForm] = useState({
        // Personal Info
        fullName: '',
        enrollment: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        category: '',
        // Academic Info
        instituteName: 'Government Polytechnic Awasari',
        department: '',
        yearOfStudy: '',
        prevMarks: '',
        sscPercentage: '',
        // Hostel Details
        hostelType: '',
        distance: '',
        permanentAddress: '',
        // Parents info
        parentName: '',
        parentPhone: '',
        // Health
        hasMedicalCondition: false,
        medicalDescription: '',
        // Files (simulated)
        photo: null,
        admissionLetter: null,
        feeReceipt: null,
        marksheet: null,
        undertaking: null,
    });

    const handleSubmit = () => {
        setIsLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
            setIsLoading(false);
            Alert.alert(
                'Application Received',
                'Your admission request for 2025-26 has been submitted. Our team will verify your documents.',
                [{ text: 'Return Home', onPress: () => router.replace('/(tabs)/(home)') }]
            );
        }, 2000);
    };

    const renderInput = (label: string, value: string, onChange: (v: string) => void, icon: any, placeholder: string, keyboard: any = 'default', extra: any = {}) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrap}>
                {React.createElement(icon, { size: 18, color: Colors.textLight })}
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    keyboardType={keyboard}
                    {...extra}
                />
            </View>
        </View>
    );

    const renderFileUpload = (label: string, icon: any, isUploaded: boolean) => (
        <TouchableOpacity
            style={[styles.uploadBox, isUploaded && styles.uploadBoxActive]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
            <View style={styles.uploadInfo}>
                {React.createElement(icon, { size: 20, color: isUploaded ? Colors.primary : Colors.textLight })}
                <Text style={[styles.uploadLabel, isUploaded && styles.uploadLabelActive]}>{label}</Text>
            </View>
            <View style={[styles.uploadBtn, isUploaded && styles.uploadBtnActive]}>
                <Text style={styles.uploadBtnText}>{isUploaded ? 'Change' : 'Upload'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Admission Form</Text>
                    <Text style={styles.headerSub}>Hostel Academic Year 2025-26</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Progress Indicators ── */}
                <View style={styles.progressRow}>
                    {[1, 2, 3, 4].map((s) => (
                        <View key={s} style={styles.progressStepWrap}>
                            <View style={[styles.progressDot, currentStep >= s && styles.progressDotActive]} />
                            {s < 4 && <View style={[styles.progressLine, currentStep > s && styles.progressLineActive]} />}
                        </View>
                    ))}
                </View>

                <View style={styles.formContainer}>
                    {currentStep === 1 && (
                        <View>
                            <Text style={styles.sectionTitle}>1. Personal Identity</Text>
                            {renderInput('Full Name (as per records)', form.fullName, (v) => setForm({ ...form, fullName: v }), User, 'Enter full name')}
                            {renderInput('Enrollment Number', form.enrollment, (v) => setForm({ ...form, enrollment: v }), School, 'ENXXXXXXXX')}

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    {renderInput('Date of Birth', form.dob, (v) => setForm({ ...form, dob: v }), Calendar, 'DD/MM/YYYY')}
                                </View>
                                <View style={{ flex: 1 }}>
                                    {renderInput('Gender', form.gender, (v) => setForm({ ...form, gender: v }), Users, 'Male/Female')}
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    {renderInput('Category', form.category, (v) => setForm({ ...form, category: v }), Briefcase, 'Open/OBC/SC/ST')}
                                </View>
                                <View style={{ flex: 1 }}>
                                    {renderInput('Hostel Type', form.hostelType, (v) => setForm({ ...form, hostelType: v }), MapPin, 'Boys/Girls')}
                                </View>
                            </View>

                            {renderInput('Email ID', form.email, (v) => setForm({ ...form, email: v }), Mail, 'your@email.com', 'email-address')}
                            {renderInput('Mobile Number', form.phone, (v) => setForm({ ...form, phone: v }), Phone, '10-digit number', 'phone-pad')}
                        </View>
                    )}

                    {currentStep === 2 && (
                        <View>
                            <Text style={styles.sectionTitle}>2. Academic & Residential</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Institute Name</Text>
                                <View style={[styles.inputWrap, styles.inputDisabled]}>
                                    <School size={18} color={Colors.textLight} />
                                    <Text style={styles.disabledText}>{form.instituteName}</Text>
                                </View>
                            </View>

                            {renderInput('Branch / Department', form.department, (v) => setForm({ ...form, department: v }), Briefcase, 'e.g. Mechanical Eng.')}

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    {renderInput('Year of Study', form.yearOfStudy, (v) => setForm({ ...form, yearOfStudy: v }), GraduationCap, '1st/2nd/3rd')}
                                </View>
                                <View style={{ flex: 1 }}>
                                    {renderInput('Distance (KM)', form.distance, (v) => setForm({ ...form, distance: v }), Map, 'e.g. 45')}
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    {renderInput('Prev Year Marks %', form.prevMarks, (v) => setForm({ ...form, prevMarks: v }), GraduationCap, 'e.g. 85.50')}
                                </View>
                                <View style={{ flex: 1 }}>
                                    {renderInput('SSC Percentage', form.sscPercentage, (v) => setForm({ ...form, sscPercentage: v }), GraduationCap, 'e.g. 92.00')}
                                </View>
                            </View>

                            {renderInput('Permanent Address', form.permanentAddress, (v) => setForm({ ...form, permanentAddress: v }), MapPin, 'Full address with PIN', 'default', { multiline: true, numberOfLines: 3 })}
                        </View>
                    )}

                    {currentStep === 3 && (
                        <View>
                            <Text style={styles.sectionTitle}>3. Parent & Health Info</Text>
                            {renderInput('Parent / Guardian Name', form.parentName, (v) => setForm({ ...form, parentName: v }), User, 'Father/Mother Name')}
                            {renderInput('Parent Mobile Number', form.parentPhone, (v) => setForm({ ...form, parentPhone: v }), Phone, 'Emergency contact', 'phone-pad')}

                            <View style={styles.medicalToggle}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.medicalLabel}>Any Medical Condition?</Text>
                                    <Text style={styles.medicalSub}>Allergies, chronic conditions, etc.</Text>
                                </View>
                                <Switch
                                    value={form.hasMedicalCondition}
                                    onValueChange={(val) => setForm({ ...form, hasMedicalCondition: val })}
                                    trackColor={{ false: '#D1D5DB', true: Colors.primary }}
                                />
                            </View>

                            {form.hasMedicalCondition && (
                                <View style={{ marginTop: 10 }}>
                                    {renderInput('Condition Description', form.medicalDescription, (v) => setForm({ ...form, medicalDescription: v }), Stethoscope, 'Provide brief details')}
                                </View>
                            )}
                        </View>
                    )}

                    {currentStep === 4 && (
                        <View>
                            <Text style={styles.sectionTitle}>4. Document Uploads</Text>
                            <Text style={styles.uploadSub}>Clearly legible images or PDF copies</Text>

                            {renderFileUpload('Passport Size Photo', ImageIcon, false)}
                            {renderFileUpload('Admission Letter', FileUp, false)}
                            {renderFileUpload('Fee Receipt', FileUp, false)}
                            {renderFileUpload('Previous Marksheet', FileUp, false)}
                            {renderFileUpload('Undertaking Form', CheckCircle2, false)}

                            <View style={styles.infoNote}>
                                <Stethoscope size={16} color="#6B7280" />
                                <Text style={styles.noteText}>By submitting, you agree to follow all hostel rules and regulations as per the undertaking form.</Text>
                            </View>
                        </View>
                    )}

                    {/* ── Navigation Buttons ── */}
                    <View style={styles.footer}>
                        {currentStep > 1 && (
                            <TouchableOpacity style={styles.prevBtn} onPress={() => setCurrentStep(currentStep - 1)}>
                                <Text style={styles.prevBtnText}>Previous</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.nextBtn, currentStep === 4 && styles.submitBtn]}
                            onPress={() => {
                                if (currentStep < 4) setCurrentStep(currentStep + 1);
                                else handleSubmit();
                            }}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={currentStep === 4 ? ['#00695C', '#004D40'] : [Colors.primary, Colors.primaryDark]}
                                style={styles.btnGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={Colors.white} />
                                ) : (
                                    <Text style={styles.btnText}>
                                        {currentStep === 4 ? 'Submit Application' : 'Continue'}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800' as const,
        color: Colors.text,
    },
    headerSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 50,
    },
    progressStepWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E5E7EB',
    },
    progressDotActive: {
        backgroundColor: Colors.primary,
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    progressLineActive: {
        backgroundColor: Colors.primary,
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.text,
    },
    inputDisabled: {
        backgroundColor: '#F9FAFB',
        borderColor: '#F3F4F6',
    },
    disabledText: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.textLight,
        fontWeight: '500' as const,
    },
    row: {
        flexDirection: 'row',
    },
    medicalToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 14,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    medicalLabel: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    medicalSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    uploadSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    uploadBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed' as const,
    },
    uploadBoxActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryGhost,
        borderStyle: 'solid' as const,
    },
    uploadInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    uploadLabel: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: Colors.textSecondary,
    },
    uploadLabelActive: {
        color: Colors.primary,
        fontWeight: '600' as const,
    },
    uploadBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    uploadBtnActive: {
        backgroundColor: Colors.primary,
    },
    uploadBtnText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    infoNote: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 10,
        marginTop: 20,
        gap: 10,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 12,
    },
    prevBtn: {
        flex: 1,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    prevBtnText: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    nextBtn: {
        flex: 2,
        borderRadius: 14,
        overflow: 'hidden',
    },
    submitBtn: {
        flex: 2,
    },
    btnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700' as const,
    },
});
