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
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { complaintTypes } from '@/mocks/data';

export default function NewComplaintScreen() {
    const router = useRouter();
    const [type, setType] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [priority, setPriority] = useState<string>('');

    const priorities = ['Low', 'Medium', 'High'];

    const handleSubmit = useCallback(() => {
        if (!type || !description.trim() || !priority) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Complaint submitted successfully!', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    }, [type, description, priority, router]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={styles.label}>Complaint Type</Text>
                <View style={styles.chipRow}>
                    {complaintTypes.map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.chip, type === t && styles.chipActive]}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType(t); }}
                        >
                            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.chipRow}>
                    {priorities.map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.chip, priority === p && styles.chipActive]}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPriority(p); }}
                        >
                            <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Describe your complaint in detail..."
                    placeholderTextColor={Colors.textLight}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                    testID="complaint-description"
                />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Send size={18} color={Colors.white} />
                    <Text style={styles.submitText}>Submit Complaint</Text>
                </LinearGradient>
            </TouchableOpacity>
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
        marginBottom: 24,
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
    textArea: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: 16,
        fontSize: 15,
        color: Colors.text,
        minHeight: 120,
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
