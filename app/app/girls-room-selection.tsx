import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BedDouble, User, CheckCircle2, Home, ChevronRight } from 'lucide-react-native';
import { API_URL } from '@/constants/config';

type Bed = {
    bedNumber: number;
    isBooked: boolean;
    studentName?: string;
    studentBranch?: string;
};

type Room = {
    _id: string;
    roomNumber:String;
    floor: number;
    beds: Bed[];
};

const GIRLS_HOSTELS = [
    { name: 'Saraswati', label: 'Saraswati Hostel', color: '#BE185D', bg: '#FFF1F2', borderColor: '#FFE4E6' },
    { name: 'Shwetambar', label: 'Shwetambar Hostel', color: '#BE185D', bg: '#FDF2F8', borderColor: '#FCE7F3' },
];

const FLOORS = [
    { label: 'Ground Floor', num: 0, roomRange: '101 – 112' },
    { label: '1st Floor', num: 1, roomRange: '201 – 212' },
    { label: '2nd Floor', num: 2, roomRange: '301 – 312' },
];

export default function GirlsRoomSelectionScreen() {
    const router = useRouter();
    const { student, userName, refreshProfile } = useAuth();

    // Step 1: hostel selection
    const [selectedHostel, setSelectedHostel] = useState<string | null>(null);

    // Step 2: room/bed selection
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);

    // Booking modal
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (selectedHostel) {
            fetchRooms(selectedHostel);
        }
    }, [selectedHostel]);

    const fetchRooms = async (hostelName: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/rooms?hostelName=${encodeURIComponent(hostelName)}`);
            const data = await res.json();
            if (Array.isArray(data)) setRooms(data);
        } catch (e) {
            console.error('Error fetching rooms:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleBedPress = (room: Room, bed: Bed) => {
        if (bed.isBooked) {
            // Show who's in this bed
            setSelectedRoom(room);
            setSelectedBed(bed);
            setModalVisible(true);
        } else {
            setSelectedRoom(room);
            setSelectedBed(bed);
            setModalVisible(true);
        }
    };

    const confirmBooking = async () => {
        if (!selectedRoom || !selectedBed || !student?.id) return;
        if (selectedBed.isBooked) {
            setModalVisible(false);
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
                    studentId: student.id,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert('✅ Allocated!', `You have been allocated Bed ${selectedBed.bedNumber} in Room ${selectedRoom.roomNumber} at ${selectedHostel} Hostel.`);
                setModalVisible(false);
                await refreshProfile();
                fetchRooms(selectedHostel!);
                setTimeout(() => router.replace('/(tabs)/dashboard' as any), 800);
            } else {
                Alert.alert('Error', data.error || 'Failed to allocate bed.');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderBed = (room: Room, bed: Bed) => {
        const isSelected = selectedRoom?._id === room._id && selectedBed?.bedNumber === bed.bedNumber;
        return (
            <TouchableOpacity
                key={`bed-${bed.bedNumber}`}
                style={[styles.bed, bed.isBooked ? styles.bedBooked : isSelected ? styles.bedSelected : styles.bedAvailable]}
                onPress={() => handleBedPress(room, bed)}
                activeOpacity={0.75}
            >
                <View style={[styles.pillow, bed.isBooked ? styles.pillowBooked : isSelected ? styles.pillowSelected : styles.pillowAvailable]} />
                <Text style={[styles.bedText, (bed.isBooked || isSelected) && styles.bedTextWhite]}>B{bed.bedNumber}</Text>
            </TouchableOpacity>
        );
    };

    // ──────────────────────────────────────────────────
    // STEP 1: Hostel Selection
    // ──────────────────────────────────────────────────
    if (!selectedHostel) {
        return (
            <SafeAreaView style={styles.container}>
                {/* Soft minimal header */}
                <View style={styles.heroHeader}>
                    <View style={styles.heroIconWrap}>
                        <Home size={26} color="#BE185D" />
                    </View>
                    <Text style={styles.heroTitle}>Hostel Selection</Text>
                    <Text style={styles.heroSub}>Please select your preferred hostel for allocation</Text>
                </View>

                <ScrollView contentContainerStyle={styles.hostelList}>
                    {GIRLS_HOSTELS.map(h => (
                        <TouchableOpacity
                            key={h.name}
                            style={[styles.hostelCard, { borderColor: h.borderColor }]}
                            onPress={() => setSelectedHostel(h.name)}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.hostelIconWrap2, { backgroundColor: h.bg }]}>
                                <Home size={24} color={h.color} />
                            </View>
                            <View style={styles.hostelCardText}>
                                <Text style={[styles.hostelCardName, { color: h.color }]}>{h.label}</Text>
                            </View>
                            <ChevronRight size={18} color={h.borderColor} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ──────────────────────────────────────────────────
    // STEP 2: Room & Bed Selection
    // ──────────────────────────────────────────────────
    const hostelMeta = GIRLS_HOSTELS.find(h => h.name === selectedHostel)!;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedHostel(null); setRooms([]); }}>
                    <Text style={[styles.backBtnText, { color: hostelMeta.color }]}>← Change Hostel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{hostelMeta.label}</Text>
                <Text style={styles.headerSub}>Select your room and bed</Text>

                <View style={styles.legend}>
                    <View style={styles.legendItem}><View style={[styles.legendBox, styles.bedAvailable]} /><Text style={styles.legendText}>Available</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendBox, styles.bedBooked]} /><Text style={styles.legendText}>Occupied</Text></View>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={hostelMeta.color} />
                    <Text style={styles.loadText}>Loading rooms…</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {FLOORS.map(fl => {
                        const floorRooms = rooms.filter(r => r.floor === fl.num);
                        if (floorRooms.length === 0) return null;

                        return (
                            <View key={`floor-${fl.num}`} style={styles.floorSection}>
                                {/* Floor label */}
                                <View style={[styles.floorHeader, { backgroundColor: hostelMeta.bg, borderColor: hostelMeta.color + '44' }]}>
                                    <Text style={[styles.floorLabel, { color: hostelMeta.color }]}>{fl.label}</Text>
                                    <Text style={styles.floorRange}>Rooms {fl.roomRange}</Text>
                                </View>

                                {/* Rooms grid */}
                                <View style={styles.roomsGrid}>
                                    {floorRooms.map(room => (
                                        <View key={String(room.roomNumber)} style={styles.roomCard}>
                                            <View style={styles.roomHeader}>
                                                <BedDouble size={13} color="#64748B" />
                                                <Text style={styles.roomNo}>Room {room.roomNumber}</Text>
                                            </View>
                                            <View style={styles.bedsGrid}>
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
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* Booking Confirmation Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedBed?.isBooked ? 'Bed Occupied' : 'Confirm Allocation'}
                            </Text>
                            <Text style={[styles.modalSub, { color: hostelMeta.color }]}>
                                {selectedHostel} • Room {selectedRoom?.roomNumber} • Bed {selectedBed?.bedNumber}
                            </Text>
                        </View>

                        {!selectedBed?.isBooked && (
                            <>
                                <Text style={styles.sectionLabel}>YOUR IDENTITY</Text>
                                <View style={styles.identityCard}>
                                    <Text style={styles.identityName}>{userName}</Text>
                                    <Text style={styles.identityDept}>{student?.department || 'Department Pending'}</Text>
                                </View>
                            </>
                        )}

                        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>ROOMMATES (IF ANY)</Text>
                        <ScrollView style={styles.roommateList}>
                            {(selectedRoom?.beds.filter(b => b.isBooked) ?? []).length === 0 ? (
                                <View style={styles.emptyMates}>
                                    <CheckCircle2 color="#10B981" size={22} />
                                    <Text style={styles.emptyMatesText}>You'll be the first in this room!</Text>
                                </View>
                            ) : (
                                selectedRoom?.beds.filter(b => b.isBooked).map(b => (
                                    <View key={b.bedNumber} style={styles.mateCard}>
                                        <View style={[styles.mateAvatar, { backgroundColor: hostelMeta.bg }]}>
                                            <User size={18} color={hostelMeta.color} />
                                        </View>
                                        <View style={styles.mateInfo}>
                                            <Text style={styles.mateName}>{b.studentName}</Text>
                                            <Text style={styles.mateBranch}>{b.studentBranch}</Text>
                                        </View>
                                        <View style={[styles.bedBadge, { backgroundColor: hostelMeta.color }]}>
                                            <Text style={styles.bedBadgeText}>B{b.bedNumber}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                                <Text style={styles.cancelText}>{selectedBed?.isBooked ? 'Close' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            {!selectedBed?.isBooked && (
                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: hostelMeta.color }]}
                                    onPress={confirmBooking}
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? <ActivityIndicator color="#FFF" />
                                        : <Text style={styles.confirmText}>Confirm Bed</Text>
                                    }
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
    container: { flex: 1, backgroundColor: '#FAF7F8' },
    heroHeader: {
        backgroundColor: '#fff',
        paddingTop: 40, paddingBottom: 20, paddingHorizontal: 24,
        alignItems: 'center', gap: 6,
    },
    heroIconWrap: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    heroTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
    heroSub: { fontSize: 14, color: '#64748B', textAlign: 'center', fontWeight: '500' },
    hostelList: { padding: 20, gap: 16 },
    hostelCard: {
        backgroundColor: '#fff', borderRadius: 20,
        borderWidth: 1, padding: 22,
        flexDirection: 'row', alignItems: 'center',
        shadowColor: '#BE185D', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    hostelIconWrap2: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    hostelCardText: { flex: 1 },
    hostelCardName: { fontSize: 18, fontWeight: '700' },

    header: {
        backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: { marginBottom: 8 },
    backBtnText: { fontSize: 14, fontWeight: '700' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
    headerSub: { fontSize: 14, color: '#64748B', marginTop: 3, fontWeight: '500' },
    legend: { flexDirection: 'row', gap: 24, marginTop: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendBox: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
    legendText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadText: { color: '#BE185D', fontSize: 15, fontWeight: '600' },

    scrollContent: { padding: 16, gap: 24 },

    floorSection: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff' },
    floorHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    floorLabel: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    floorRange: { fontSize: 12, color: '#64748B', fontWeight: '600' },

    roomsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12,
        backgroundColor: '#fff',
    },
    roomCard: {
        width: '47%', backgroundColor: '#FAF7F8', borderRadius: 16,
        borderWidth: 1, borderColor: '#F1F5F9', padding: 12, alignItems: 'center',
    },
    roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    roomNo: { fontSize: 13, fontWeight: '700', color: '#334155' },
    bedsGrid: { alignItems: 'center' },
    bedRow: { flexDirection: 'row', gap: 12 },
    aisle: { height: 10 },

    bed: {
        width: 52, height: 34, borderRadius: 6, borderWidth: 1.5,
        justifyContent: 'center', alignItems: 'center', position: 'relative',
    },
    bedAvailable: { backgroundColor: '#fff', borderColor: '#E2E8F0' },
    bedSelected: { backgroundColor: '#BE185D', borderColor: '#BE185D' },
    bedBooked: { backgroundColor: '#FDA4AF', borderColor: '#FDA4AF' },
    pillow: { position: 'absolute', right: 3, width: 6, height: 18, borderRadius: 3, opacity: 0.6 },
    pillowAvailable: { backgroundColor: '#F1F5F9' },
    pillowSelected: { backgroundColor: '#FFF1F2' },
    pillowBooked: { backgroundColor: '#FFF1F2' },
    bedText: { fontSize: 11, fontWeight: '800', color: '#64748B', marginRight: 4 },
    bedTextWhite: { fontSize: 11, fontWeight: '800', color: '#fff', marginRight: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, minHeight: '55%' },
    modalHeader: { marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
    modalSub: { fontSize: 15, fontWeight: '700', marginTop: 4 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 10 },
    identityCard: { backgroundColor: '#FFF1F2', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FFE4E6', marginBottom: 12 },
    identityName: { fontSize: 18, fontWeight: '800', color: '#BE185D' },
    identityDept: { fontSize: 14, color: '#BE185D', opacity: 0.8, marginTop: 2, fontWeight: '600' },
    roommateList: { maxHeight: 200, marginBottom: 12 },
    emptyMates: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#DCFCE7' },
    emptyMatesText: { color: '#166534', fontWeight: '700', fontSize: 15 },
    mateCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10, backgroundColor: '#FAF7F8' },
    mateAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    mateInfo: { flex: 1 },
    mateName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    mateBranch: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
    bedBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    bedBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    modalFooter: { flexDirection: 'row', gap: 14, marginTop: 24 },
    cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
    cancelText: { color: '#475569', fontWeight: '700', fontSize: 16 },
    confirmBtn: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 4, shadowColor: '#BE185D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    confirmText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
