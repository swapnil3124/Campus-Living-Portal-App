import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { KeyboardWrapper } from '@/components/KeyboardWrapper';
import Layout, { moderateScale, scale } from '@/constants/layout';

import { LinearGradient } from 'expo-linear-gradient';
import { Send, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { complaintTypes } from '@/mocks/data';

import { API_URL } from '@/constants/config';

export default function NewComplaintScreen() {
    const router = useRouter();
    const { student } = useAuth();
    const [type, setType] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [priority, setPriority] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const priorities = ['Low', 'Medium', 'High'];

    const handleSubmit = async () => {
        if (!type || !description.trim() || !priority) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const studentId = student?._id || student?.id;
        if (!studentId) {
            Alert.alert('Error', 'Student session not found. Please re-login.');
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('studentId', studentId);
            formData.append('type', type);
            formData.append('priority', priority.toLowerCase());
            formData.append('description', description.trim());

            if (selectedImage) {
                const uri = Platform.OS === 'ios' ? selectedImage.uri.replace('file://', '') : selectedImage.uri;
                const filename = selectedImage.fileName || uri.split('/').pop() || 'complaint_img.jpg';
                const mimeType = selectedImage.mimeType || 'image/jpeg';
                
                formData.append('image', {
                    uri: selectedImage.uri, // Use the original URI for fetch on most modern RN versions
                    name: filename,
                    type: mimeType,
                } as any);
            }

            const response = await fetch(`${API_URL}/complaints`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Complaint submitted successfully!', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', data.error + (data.details ? `: ${data.details}` : '') || 'Failed to submit complaint');
            }
        } catch (error) {
            console.error('Error submitting complaint:', error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload an image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
        }
    };

    return (
        <KeyboardWrapper style={styles.container} contentContainerStyle={styles.content}>

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

            <View style={styles.section}>
                <Text style={styles.label}>Attachment (Optional)</Text>
                {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                            <X size={16} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                        <ImageIcon size={24} color={Colors.primary} />
                        <Text style={styles.uploadText}>Upload Image</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Send size={18} color={Colors.white} />
                            <Text style={styles.submitText}>Submit Complaint</Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </KeyboardWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: scale(20),
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
    uploadBtn: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    imagePreviewContainer: {
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    imagePreview: {
        width: '100%',
        height: 180,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
