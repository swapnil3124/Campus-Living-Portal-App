import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '@/contexts/AuthContext';
import { User, BedDouble, CheckCircle2, ChevronLeft } from 'lucide-react-native';

import { API_URL } from '@/constants/config';

type Bed = {
    bedNumber: number;
    isBooked: boolean;
    studentName?: string;
    studentBranch?: string;
};

type Room = {
    _id: string;
    roomNumber: string;
    floor: number;
    beds: Bed[];
};

export default function RoomSelectionScreen() {
    const router = useRouter();
    const { student, userName, refreshProfile } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    // Reversed to show Top floor at the top, like Upper/Lower decks
    const floors = [
        { label: '3rd Floor', num: 3 },
        { label: '2nd Floor', num: 2 },
        { label: '1st Floor', num: 1 },
        { label: 'Ground Floor', num: 0 }
    ];

    useEffect(() => {
        if (student?.hostelName) {
            fetchRooms();
        }
    }, [student]);

    const fetchRooms = async () => {
        if (!student?.hostelName) return;
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/rooms?hostelName=${encodeURIComponent(student.hostelName)}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setRooms(data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBedPress = (room: Room, bed: Bed) => {
        setSelectedRoom(room);
        setSelectedBed(bed);
        setModalVisible(true);
    };

    const confirmBooking = async () => {
        if (!selectedRoom || !selectedBed) return;
        if (!student?.id) {
            Alert.alert('Error', 'Student identifier missing. Please log in again.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/rooms/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: selectedRoom._id,
                    bedNumber: selectedBed.bedNumber,
                    studentId: student.id
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Bed allocated successfully!');
                setModalVisible(false);
                refreshProfile();
                fetchRooms();
                // Navigate to dashboard automatically
                setTimeout(() => {
                    router.replace('/(tabs)/dashboard' as any);
                }, 800);
            } else {
                Alert.alert('Error', data.error || 'Failed to allocate bed.');
            }
        } catch (error) {
            console.error('Network Error:', error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderBed = (room: Room, bed: Bed) => {
        const isSelected = selectedRoom?._id === room._id && selectedBed?.bedNumber === bed.bedNumber;

        const bedStyle = bed.isBooked
            ? styles.bedBooked
            : isSelected
                ? styles.bedSelected
                : styles.bedAvailable;

        const textStyle = (bed.isBooked || isSelected) ? styles.bedTextWhite : styles.bedText;

        return (
            <TouchableOpacity
                key={`bed-${bed.bedNumber}`}
                style={[styles.bedContainer, bedStyle]}
                onPress={() => handleBedPress(room, bed)}
                activeOpacity={0.7}
            >
                <View style={[styles.pillow, bed.isBooked ? styles.pillowBooked : isSelected ? styles.pillowSelected : styles.pillowAvailable]} />
                <Text style={textStyle}>B{bed.bedNumber}</Text>
            </TouchableOpacity>
        );
    };

    if (student?.status === 'past') {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.headerTitle}>Access Denied</Text>
                <Text style={styles.loadingText}>You have exited the hostel and cannot select a room.</Text>
                <TouchableOpacity 
                    style={[styles.btn, styles.confirmBtn, { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24 }]}
                    onPress={() => router.replace('/(tabs)/dashboard' as any)}
                >
                    <Text style={styles.confirmBtnText}>Return to Dashboard</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00897B" />
                <Text style={styles.loadingText}>Loading Layout...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Your Bed</Text>
                <Text style={styles.headerSubtitle}>Choose a floor, room, and your bed position</Text>

                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendBox, styles.bedAvailable]} />
                        <Text style={styles.legendText}>Available</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendBox, styles.bedSelected]} />
                        <Text style={styles.legendText}>Selected</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendBox, styles.bedBooked]} />
                        <Text style={styles.legendText}>Allocated</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {floors.map((fl) => {
                    const floorRooms = rooms.filter(r => r.floor === fl.num);
                    if (floorRooms.length === 0) return null;

                    return (
                        <View key={`floor-${fl.num}`} style={styles.deckContainer}>
                            <View style={styles.deckLabelWrapper}>
                                <Text style={styles.deckLabelText}>{fl.label}</Text>
                            </View>

                            <View style={styles.deckBody}>
                                {floorRooms.map(room => (
                                    <View key={room.roomNumber} style={styles.roomCompartment}>
                                        <View style={styles.roomHeader}>
                                            <BedDouble size={14} color="#64748B" />
                                            <Text style={styles.roomTitle}>Room {room.roomNumber}</Text>
                                        </View>

                                        {/* RedBus-like 2x2 bed arrangement per compartment */}
                                        <View style={styles.roomBedsGrid}>
                                            <View style={styles.bedRow}>
                                                {renderBed(room, room.beds[0])}
                                                {renderBed(room, room.beds[1])}
                                            </View>
                                            <View style={styles.aisle} />
                                            <View style={styles.bedRow}>
                                                {renderBed(room, room.beds[2])}
                                                {renderBed(room, room.beds[3])}
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedBed?.isBooked ? 'Bed Status' : 'Confirm Allocation'}</Text>
                            <Text style={styles.modalSubTitle}>Room {selectedRoom?.roomNumber} - Bed {selectedBed?.bedNumber}</Text>
                        </View>

                        {/* Only show Identity if we are confirming our own allocation */}
                        {!selectedBed?.isBooked && (
                            <>
                                <Text style={styles.sectionLabel}>YOUR IDENTITY</Text>
                                <View style={styles.verifiedIdentityCard}>
                                    <Text style={styles.identityName}>{userName}</Text>
                                    <Text style={styles.identityBranch}>{student?.department || 'Department Pending'}</Text>
                                </View>
                            </>
                        )}

                        <Text style={[styles.sectionLabel, { marginTop: selectedBed?.isBooked ? 0 : 20 }]}>ROOMMATES (IF ANY)</Text>
                        <ScrollView style={styles.roommateList}>
                            {selectedRoom?.beds.filter(b => b.isBooked).length === 0 ? (
                                <View style={styles.emptyRoommatesContainer}>
                                    <CheckCircle2 color="#10B981" size={24} />
                                    <Text style={styles.emptyRoommatesText}>You will be the first in this room!</Text>
                                </View>
                            ) : (
                                selectedRoom?.beds.filter(b => b.isBooked).map(b => (
                                    <View key={b.bedNumber} style={styles.roommateCard}>
                                        <View style={styles.roommateAvatar}>
                                            <User size={20} color="#00897B" />
                                        </View>
                                        <View style={styles.roommateInfo}>
                                            <Text style={styles.roommateName}>{b.studentName}</Text>
                                            <Text style={styles.roommateBranch}>{b.studentBranch}</Text>
                                        </View>
                                        <View style={styles.roommateBadge}>
                                            <Text style={styles.roommateBadgeText}>B{b.bedNumber}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.btn, styles.cancelBtn]}
                                onPress={() => setModalVisible(false)}
                                disabled={submitting}
                            >
                                <Text style={styles.cancelBtnText}>{selectedBed?.isBooked ? 'Close' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            {!selectedBed?.isBooked && (
                                <TouchableOpacity
                                    style={[styles.btn, styles.confirmBtn]}
                                    onPress={confirmBooking}
                                    disabled={submitting}
                                >
                                    {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Confirm Bed</Text>}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9', // Light gray background like app scaffolds
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748B'
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    legendContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendBox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
    },
    legendText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 24,
    },
    deckContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 4,
        flexDirection: 'row', // Deck layout sideways label 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden'
    },
    deckLabelWrapper: {
        backgroundColor: '#F8FAFC',
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
    },
    deckLabelText: {
        transform: [{ rotate: '-90deg' }],
        width: 120,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#334155',
        fontSize: 16,
        letterSpacing: 1.5,
    },
    deckBody: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        gap: 16,
    },
    roomCompartment: {
        width: '46%', // Fit roughly two compartments per row
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        alignItems: 'center',
    },
    roomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        backgroundColor: '#FFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    roomTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#334155',
    },
    roomBedsGrid: {
        alignItems: 'center',
    },
    bedRow: {
        flexDirection: 'row',
        gap: 12,
    },
    aisle: {
        height: 12, // Aisle space between top and bottom beds 
    },
    // Redbus style bed blocks (Sleeper style rendering)
    bedContainer: {
        width: 54,
        height: 32,
        borderRadius: 4,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    pillow: {
        position: 'absolute',
        right: 4,
        width: 6,
        height: 18,
        borderRadius: 3,
        opacity: 0.9,
    },
    bedAvailable: {
        backgroundColor: '#FFFFFF',
        borderColor: '#94A3B8',
    },
    pillowAvailable: {
        backgroundColor: '#CBD5E1',
    },
    bedSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
    },
    pillowSelected: {
        backgroundColor: '#DDE6FD',
    },
    bedBooked: {
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
    },
    pillowBooked: {
        backgroundColor: '#FCA5A5',
    },
    bedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginRight: 6, // shift left to leave room for pillow
    },
    bedTextWhite: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '70%',
    },
    modalHeader: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    modalSubTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#00897B',
        marginTop: 4,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    verifiedIdentityCard: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    identityName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    identityBranch: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    roommateList: {
        maxHeight: 200,
    },
    emptyRoommatesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginTop: 8,
    },
    emptyRoommatesText: {
        color: '#059669',
        fontWeight: '600',
        fontSize: 15,
    },
    roommateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    roommateAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    roommateInfo: {
        flex: 1,
    },
    roommateName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    roommateBranch: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    roommateBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roommateBadgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 10,
    },
    btn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        color: '#475569',
        fontWeight: '600',
        fontSize: 16,
    },
    confirmBtn: {
        backgroundColor: '#00897B',
        shadowColor: '#00897B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
