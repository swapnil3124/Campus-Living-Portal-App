import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { leaveTypes } from '@/mocks/data';

export default function NewLeaveScreen() {
    const router = useRouter();
    const [leaveType, setLeaveType] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [destination, setDestination] = useState<string>('');
    const [parentContact, setParentContact] = useState<string>('');

    const handleSubmit = useCallback(() => {
        if (!leaveType || !fromDate.trim() || !toDate.trim() || !reason.trim() || !destination.trim() || !parentContact.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Leave application submitted successfully!', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    }, [leaveType, fromDate, toDate, reason, destination, parentContact, router]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                    <Text style={styles.label}>From Date</Text>
                    <View style={styles.inputWrap}>
                        <Calendar size={16} color={Colors.textLight} />
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={Colors.textLight}
                            value={fromDate}
                            onChangeText={setFromDate}
                        />
                    </View>
                </View>
                <View style={styles.dateField}>
                    <Text style={styles.label}>To Date</Text>
                    <View style={styles.inputWrap}>
                        <Calendar size={16} color={Colors.textLight} />
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={Colors.textLight}
                            value={toDate}
                            onChangeText={setToDate}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Reason</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Reason for leave..."
                    placeholderTextColor={Colors.textLight}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={reason}
                    onChangeText={setReason}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Destination</Text>
                <View style={styles.inputWrap}>
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
                <Text style={styles.label}>Parent Contact Number</Text>
                <View style={styles.inputWrap}>
                    <TextInput
                        style={styles.input}
                        placeholder="Parent's mobile number"
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
        </ScrollView>
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
