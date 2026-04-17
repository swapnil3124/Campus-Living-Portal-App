import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { KeyboardWrapper } from '@/components/KeyboardWrapper';
import { LinearGradient } from 'expo-linear-gradient';

import { Send, Calendar, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Colors from '@/constants/colors';
import { leaveTypes } from '@/mocks/data';
import { useLeaveStore } from '@/store/leave-store';
import { useAuth } from '@/contexts/AuthContext';

export default function NewLeaveScreen() {
    const router = useRouter();
    const { addLeave, isLoading: isSubmitting } = useLeaveStore();
    const { student } = useAuth();
    const [leaveType, setLeaveType] = useState<string>('');
    const [fromDate, setFromDate] = useState<Date>(new Date());
    const [toDate, setToDate] = useState<Date>(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [reason, setReason] = useState<string>('');
    const [destination, setDestination] = useState<string>('');
    const [parentContact, setParentContact] = useState<string>('');

    const handleSubmit = useCallback(async () => {
        if (!leaveType || !reason || !destination || !parentContact) {
            Alert.alert('Error', 'Please fill all details');
            return;
        }

        if (reason.length < 10) {
            Alert.alert('Error', 'Reason should be at least 10 characters');
            return;
        }

        if (toDate <= fromDate) {
            Alert.alert('Error', 'Return date must be after departure date');
            return;
        }



        try {
            await addLeave({
                studentId: student?.id,
                studentName: student?.name,
                studentYear: student?.year,
                hostelName: student?.hostelName,
                roomNo: student?.roomNo,
                leaveType,
                fromDate: fromDate.toISOString(),
                toDate: toDate.toISOString(),
                reason,
                destination,
                parentContact,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Success',
                'Leave application submitted successfully!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit application');
        }
    }, [leaveType, fromDate, toDate, reason, destination, parentContact, addLeave, router]);

    const formatDateDisplay = (date: Date) => {
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const showPicker = (type: 'from' | 'to') => {
        const initialDate = type === 'from' ? fromDate : toDate;

        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: initialDate,
                onChange: (event, date) => {
                    if (event.type === 'set' && date) {
                        // After date is set, open time picker
                        DateTimePickerAndroid.open({
                            value: date,
                            onChange: (e, time) => {
                                if (e.type === 'set' && time) {
                                    if (type === 'from') setFromDate(time);
                                    else setToDate(time);
                                }
                            },
                            mode: 'time',
                            is24Hour: false,
                        });
                    }
                },
                mode: 'date',
            });
        } else {
            if (type === 'from') setShowFromPicker(true);
            else setShowToPicker(true);
        }
    };

    return (
        <KeyboardWrapper style={styles.container} contentContainerStyle={styles.content}>

            <View style={styles.section}>
                <Text style={styles.label}>Leave Type</Text>
                <View style={styles.chipRow}>
                    {leaveTypes.map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.chip, leaveType === t && styles.chipActive]}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLeaveType(t); }}
                        >
                            <Text style={[styles.chipText, leaveType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.dateRow}>
                <View style={styles.dateField}>
                    <Text style={styles.label}>From Date & Time</Text>
                    <TouchableOpacity style={styles.inputWrap} onPress={() => showPicker('from')}>
                        <Calendar size={16} color={Colors.textLight} />
                        <Text style={[styles.input, !fromDate && { color: Colors.textLight }]}>
                            {formatDateDisplay(fromDate)}
                        </Text>
                    </TouchableOpacity>
                    {Platform.OS === 'ios' && showFromPicker && (
                        <DateTimePicker
                            value={fromDate}
                            mode="datetime"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowFromPicker(false);
                                if (selectedDate) setFromDate(selectedDate);
                            }}
                        />
                    )}
                </View>
            </View>

            <View style={styles.dateRow}>
                <View style={styles.dateField}>
                    <Text style={styles.label}>To Date & Time</Text>
                    <TouchableOpacity style={styles.inputWrap} onPress={() => showPicker('to')}>
                        <Calendar size={16} color={Colors.textLight} />
                        <Text style={[styles.input, !toDate && { color: Colors.textLight }]}>
                            {formatDateDisplay(toDate)}
                        </Text>
                    </TouchableOpacity>
                    {Platform.OS === 'ios' && showToPicker && (
                        <DateTimePicker
                            value={toDate}
                            mode="datetime"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowToPicker(false);
                                if (selectedDate) setToDate(selectedDate);
                            }}
                        />
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Reason for Leave</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="e.g., Going home for Ganpati Festival (Min 10 characters)"
                    placeholderTextColor={Colors.textLight}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={reason}
                    onChangeText={setReason}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Destination Address</Text>
                <View style={styles.inputWrap}>
                    <MapPin size={16} color={Colors.textLight} />
                    <TextInput
                        style={styles.input}
                        placeholder="Where are you going?"
                        placeholderTextColor={Colors.textLight}
                        value={destination}
                        onChangeText={setDestination}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Parent Contact No</Text>
                <View style={styles.inputWrap}>
                    <TextInput
                        style={styles.input}
                        placeholder="For verification purposes"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="phone-pad"
                        value={parentContact}
                        onChangeText={setParentContact}
                    />
                </View>
            </View>



            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Send size={18} color={Colors.white} />
                    <Text style={styles.submitText}>Submit Leave Application</Text>
                </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
        </KeyboardWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 22,
    },
    label: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
        marginBottom: 10,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: Colors.textSecondary,
    },
    chipTextActive: {
        color: Colors.white,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 22,
    },
    dateField: {
        flex: 1,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        backgroundColor: Colors.white,
        gap: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.text,
    },
    textArea: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: 16,
        fontSize: 15,
        color: Colors.text,
        minHeight: 100,
        lineHeight: 22,
    },
    submitBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: Colors.white,
    },

});
