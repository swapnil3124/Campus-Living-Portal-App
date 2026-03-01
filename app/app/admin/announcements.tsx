import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Plus, Calendar, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAnnouncementStore, Announcement } from '@/store/announcement-store';

export default function AnnouncementsScreen() {
    const insets = useSafeAreaInsets();
    const { announcements, fetchAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, isLoading } = useAnnouncementStore();

    const [message, setMessage] = useState('');
    const [details, setDetails] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleAdd = async () => {
        if (!message || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill in required fields (Message, Start Date, End Date)');
            return;
        }
        const success = await addAnnouncement({
            message,
            details,
            startDate,
            endDate,
            isActive: true,
        });
        if (success) {
            setMessage('');
            setDetails('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            Alert.alert('Success', 'Announcement added successfully');
        } else {
            Alert.alert('Error', 'Failed to add announcement');
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this announcement?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const success = await deleteAnnouncement(id);
                    if (!success) Alert.alert('Error', 'Failed to delete announcement');
                }
            }
        ]);
    };

    const toggleStatus = async (item: Announcement) => {
        if (!item._id) return;
        const success = await updateAnnouncement(item._id, { isActive: !item.isActive });
        if (!success) Alert.alert('Error', 'Failed to update status');
    };

    if (isLoading && announcements.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Announcements</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Add New Announcement</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Announcement Message (Required)"
                        value={message}
                        onChangeText={setMessage}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Detailed Description (Optional)"
                        multiline
                        numberOfLines={3}
                        value={details}
                        onChangeText={setDetails}
                    />
                    <View style={styles.row}>
                        <View style={styles.dateInputContainer}>
                            <Text style={styles.label}>Start Date</Text>
                            <View style={styles.dateWrap}>
                                <Calendar size={18} color={Colors.textLight} />
                                <TextInput
                                    style={styles.dateInput}
                                    value={startDate}
                                    onChangeText={setStartDate}
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>
                        </View>
                        <View style={styles.dateInputContainer}>
                            <Text style={styles.label}>End Date</Text>
                            <View style={styles.dateWrap}>
                                <Calendar size={18} color={Colors.textLight} />
                                <TextInput
                                    style={styles.dateInput}
                                    value={endDate}
                                    onChangeText={setEndDate}
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.btnGradient}>
                            <Plus size={20} color={Colors.white} />
                            <Text style={styles.btnText}>Add Announcement</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={[styles.headerSection, { marginTop: 10 }]}>
                    <Text style={styles.sectionTitle}>Current Announcements</Text>
                </View>

                {announcements.map((ann) => (
                    <View key={ann._id} style={styles.annItem}>
                        <View style={styles.annContent}>
                            <Text style={styles.annItemMsg}>{ann.message}</Text>
                            {!!ann.details && <Text style={styles.annItemDetails} numberOfLines={2}>{ann.details}</Text>}
                            <Text style={styles.annItemDate}>
                                {new Date(ann.startDate).toLocaleDateString()} to {new Date(ann.endDate).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.annActions}>
                            <Switch
                                value={ann.isActive}
                                onValueChange={() => toggleStatus(ann)}
                                trackColor={{ false: '#767577', true: Colors.primary }}
                            />
                            <TouchableOpacity onPress={() => handleDelete(ann._id!)} style={styles.deleteBtn}>
                                <Trash2 size={20} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { padding: 20, backgroundColor: Colors.primary, paddingBottom: 15 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
    scrollContent: { padding: 16 },
    card: { backgroundColor: Colors.white, padding: 16, borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
    headerSection: { marginBottom: 12 },
    input: { borderWidth: 1, borderColor: '#E9ECEF', padding: 12, borderRadius: 10, fontSize: 15, marginBottom: 12, backgroundColor: '#F8F9FA' },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    dateInputContainer: { flex: 1 },
    label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
    dateWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 10, paddingHorizontal: 10, backgroundColor: '#F8F9FA' },
    dateInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 },
    addBtn: { borderRadius: 12, overflow: 'hidden' },
    btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
    btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
    annItem: { flexDirection: 'row', backgroundColor: Colors.white, padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    annContent: { flex: 1 },
    annItemMsg: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
    annItemDetails: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
    annItemDate: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
    annActions: { alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12 },
    deleteBtn: { marginTop: 10, padding: 4 },
});
