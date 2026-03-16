import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Modal,
    Animated,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    BedDouble,
    Users,
    Package,
    CircleCheck as CheckCircle2,
    AlertTriangle,
    X,
    CircleX as XCircle,
    User,
    Building2,
    Mail,
    Phone,
    BookOpen,
    GraduationCap,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

import { API_URL } from '@/constants/config';

const floors = [
    { label: 'Ground Floor', num: 0 },
    { label: '1st Floor', num: 1 },
    { label: '2nd Floor', num: 2 },
    { label: '3rd Floor', num: 3 },
];

const assetStatusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    WORKING: { icon: <CheckCircle2 size={14} color={Colors.success} />, color: Colors.success, bg: Colors.successLight },
    DAMAGED: { icon: <AlertTriangle size={14} color={Colors.warning} />, color: '#E65100', bg: Colors.warningLight },
};

export default function RoomsInfoScreen() {
    const router = useRouter();
    const { hostelName: contextHostelName, token } = useAuth();
    
    const normalizeHostel = (h: string | null) => {
        if (!h) return null;
        const lower = h.toLowerCase().trim();
        if (lower.includes('shivneri')) return 'Shivneri';
        if (lower.includes('lenyadri')) return 'Lenyadri';
        if (lower.includes('bhimashankar')) return 'Bhimashankar';
        if (lower.includes('shwetambara') || lower.includes('shwetamber')) return 'Shwetambara';
        if (lower.includes('saraswati')) return 'Saraswati';
        if (lower.includes('jijau')) return 'Jijau';
        return h;
    };

    const hostelName = normalizeHostel(contextHostelName);
    
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [allottedStudents, setAllottedStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    
    // Student detail modal
    const [studentModalVisible, setStudentModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [loadingStudent, setLoadingStudent] = useState(false);
    const [selectedStudentAssets, setSelectedStudentAssets] = useState<any>(null);
    const [loadingStudentAssets] = useState(false); // Using loadingStudent instead for simplicity

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchAllRooms = useCallback(async () => {
        if (!hostelName || !token) return;
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/rooms?hostelName=${encodeURIComponent(hostelName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setRooms(data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    }, [hostelName, token]);

    useEffect(() => {
        fetchAllRooms();
    }, [fetchAllRooms]);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchAllottedStudents = async (roomNo: string) => {
        if (!token || !hostelName) return;
        try {
            setLoadingStudents(true);
            const response = await fetch(`${API_URL}/rooms/roommates?roomNumber=${roomNo}&hostelName=${encodeURIComponent(hostelName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setAllottedStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleUnbook = async (studentId: string, bedNo: number) => {
        if (!selectedRoom || !token) return;
        
        Alert.alert(
            'Confirm Unbook',
            'Are you sure you want to remove this student from this bed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unbook',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_URL}/rooms/unbook`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    roomId: selectedRoom._id,
                                    bedNumber: bedNo,
                                    studentId: studentId
                                })
                            });
                            
                            if (response.ok) {
                                Alert.alert('Success', 'Bed unbooked successfully');
                                fetchAllRooms();
                                fetchAllottedStudents(selectedRoom.roomNumber);
                            } else {
                                const data = await response.json();
                                Alert.alert('Error', data.error || 'Failed to unbook bed');
                            }
                        } catch (err) {
                            console.error('Unbook error:', err);
                            Alert.alert('Error', 'Network error while unbooking');
                        }
                    }
                }
            ]
        );
    };

    const handleRoomSelect = (room: any) => {
        setSelectedRoom(room);
        // fetchRoomAssets(room.roomNumber); // No longer needed globally
        fetchAllottedStudents(room.roomNumber);
    };

    const fetchStudentDetail = async (studentId: string) => {
        if (!token) return;
        try {
            setLoadingStudent(true);
            setStudentModalVisible(true);
            setSelectedStudent(null);
            setSelectedStudentAssets(null);

            // Parallel fetch detail and student-specific assets
            const [studentRes, assetsRes] = await Promise.all([
                fetch(`${API_URL}/admissions/${studentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/rooms/assets?studentId=${studentId}&roomNumber=${selectedRoom.roomNumber}&hostelName=${encodeURIComponent(hostelName!)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const studentData = await studentRes.json();
            const assetsData = await assetsRes.json();

            if (studentData) {
                setSelectedStudent(studentData);
            }
            if (assetsData && assetsData.items) {
                setSelectedStudentAssets(assetsData);
            }
        } catch (error) {
            console.error('Error fetching student detail or assets:', error);
        } finally {
            setLoadingStudent(false);
        }
    };

    const filteredRooms = rooms.filter(r => r.floor === selectedFloor);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rooms Info</Text>
                <TouchableOpacity onPress={fetchAllRooms} style={styles.backBtn}>
                    <Users size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Floor Selection */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Select Floor</Text>
                </View>
                <View style={styles.floorRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {floors.map((f) => (
                            <TouchableOpacity
                                key={f.num}
                                style={[styles.floorChip, selectedFloor === f.num && styles.activeFloorChip]}
                                onPress={() => {
                                    setSelectedFloor(f.num);
                                    setSelectedRoom(null);
                                }}
                            >
                                <Text style={[styles.floorText, selectedFloor === f.num && styles.activeFloorText]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Room Selection Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Rooms on {selectedFloor === 0 ? 'Ground' : `${selectedFloor}${selectedFloor === 1 ? 'st' : selectedFloor === 2 ? 'nd' : 'rd'} Floor`}</Text>
                </View>
                {filteredRooms.length > 0 ? (
                    <View style={styles.roomGrid}>
                        {filteredRooms.map((room) => {
                            const occupiedBeds = room.beds?.filter((b: any) => b.isBooked).length || 0;
                            return (
                                <TouchableOpacity
                                    key={room._id}
                                    style={[styles.roomCard, selectedRoom?._id === room._id && styles.activeRoomCard]}
                                    onPress={() => handleRoomSelect(room)}
                                >
                                    <View style={styles.roomIcon}>
                                        <BedDouble size={20} color={selectedRoom?._id === room._id ? '#FFF' : Colors.primary} />
                                    </View>
                                    <Text style={[styles.roomCardTitle, selectedRoom?._id === room._id && styles.activeRoomCardText]}>
                                        Room {room.roomNumber}
                                    </Text>
                                    <View style={styles.bedIndicator}>
                                        <Users size={12} color={selectedRoom?._id === room._id ? '#FFF' : Colors.textLight} />
                                        <Text style={[styles.bedCountText, selectedRoom?._id === room._id && styles.activeRoomCardText]}>
                                            {occupiedBeds}/4 Occupied
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyStateContainer}>
                        <Building2 size={48} color={Colors.textLight} opacity={0.2} />
                        <Text style={styles.emptyStateText}>No rooms found for {hostelName} on this floor</Text>
                        <TouchableOpacity style={styles.refreshBtn} onPress={fetchAllRooms}>
                            <Text style={styles.refreshText}>Refresh Data</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {selectedRoom && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {/* Room Details Sub-Header */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Details for Room {selectedRoom.roomNumber}</Text>
                        </View>

                        {/* Room Info Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <BedDouble size={18} color={Colors.primary} />
                                <Text style={styles.cardTitle}>Room Details</Text>
                            </View>
                            <View style={styles.detailsGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>HOSTEL</Text>
                                    <Text style={styles.detailValue}>{hostelName}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>ROOM NO</Text>
                                    <Text style={styles.detailValue}>{selectedRoom.roomNumber}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>FLOOR</Text>
                                    <Text style={styles.detailValue}>{selectedRoom.floor}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>CAPACITY</Text>
                                    <Text style={styles.detailValue}>4 Beds</Text>
                                </View>
                            </View>
                        </View>

                        {/* Allotted To Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Users size={18} color={Colors.primary} />
                                <Text style={styles.cardTitle}>Allotted To</Text>
                            </View>
                            {loadingStudents ? (
                                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
                            ) : allottedStudents.length > 0 ? (
                                allottedStudents.map((mate: any, index: number) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.mateRow, index < allottedStudents.length - 1 && styles.mateBorder]}
                                            onPress={() => fetchStudentDetail(mate.id)}
                                        >
                                            <View style={styles.mateAvatar}>
                                                {mate.photoUrl ? (
                                                    <Image source={{ uri: mate.photoUrl }} style={styles.mateImg} />
                                                ) : (
                                                    <Text style={styles.mateInitial}>{mate.name ? mate.name[0] : 'S'}</Text>
                                                )}
                                            </View>
                                            <View style={styles.mateInfo}>
                                                <Text style={styles.mateName}>{mate.name}</Text>
                                                <Text style={styles.mateBranch}>{mate.branch} • {mate.year} Year</Text>
                                            </View>
                                            <TouchableOpacity 
                                                style={styles.unbookIconBtn} 
                                                onPress={() => {
                                                    // Find the bed number for this student
                                                    const bed = selectedRoom.beds.find((b: any) => b.studentId === mate.id);
                                                    handleUnbook(mate.id, bed?.bedNumber);
                                                }}
                                            >
                                                <XCircle size={20} color={Colors.error} />
                                            </TouchableOpacity>
                                            <ChevronLeft size={16} color={Colors.textLight} style={{ transform: [{ rotate: '180deg' }], marginLeft: 8 }} />
                                        </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No students allotted yet</Text>
                                </View>
                            )}
                        </View>

                    </Animated.View>
                )}
            </ScrollView>

            {/* Student Detail Modal */}
            <Modal
                visible={studentModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setStudentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Student Profile</Text>
                            <TouchableOpacity onPress={() => setStudentModalVisible(false)} style={styles.closeBtn}>
                                <X size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        {loadingStudent ? (
                            <View style={styles.modalCenter}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                            </View>
                        ) : selectedStudent ? (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                                <View style={styles.profileHero}>
                                    <View style={styles.profileAvatarLarge}>
                                        {selectedStudent.photoUrl ? (
                                            <Image source={{ uri: selectedStudent.photoUrl }} style={styles.profileImg} />
                                        ) : (
                                            <User size={40} color={Colors.primary} />
                                        )}
                                    </View>
                                    <Text style={styles.profileNameLarge}>{selectedStudent.fullName}</Text>
                                    <Text style={styles.profileSubText}>{selectedStudent.enrollment}</Text>
                                </View>

                                <View style={styles.infoSection}>
                                    <View style={styles.infoRow}>
                                        <Mail size={18} color={Colors.textLight} />
                                        <View style={styles.infoCol}>
                                            <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.email}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Phone size={18} color={Colors.textLight} />
                                        <View style={styles.infoCol}>
                                            <Text style={styles.infoLabel}>PHONE NUMBER</Text>
                                            <Text style={styles.infoValue}>+91 {selectedStudent.phone}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <BookOpen size={18} color={Colors.textLight} />
                                        <View style={styles.infoCol}>
                                            <Text style={styles.infoLabel}>DEPARTMENT</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.department}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <GraduationCap size={18} color={Colors.textLight} />
                                        <View style={styles.infoCol}>
                                            <Text style={styles.infoLabel}>YEAR</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.year}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>CATEGORY</Text>
                                        <Text style={styles.statValue}>{selectedStudent.category}</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>GENDER</Text>
                                        <Text style={styles.statValue}>{selectedStudent.gender}</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>PREV MARKS</Text>
                                        <Text style={styles.statValue}>{selectedStudent.prevMarks}%</Text>
                                    </View>
                                </View>


                                {/* Room Assets Section in Modal */}
                                <View style={[styles.additionalSection, { marginBottom: 40 }]}>
                                    <Text style={styles.sectionLabel}>ROOM ASSET REPORT</Text>
                                    {selectedStudentAssets ? (
                                        <View style={styles.modalAssetCard}>
                                            <View style={styles.assetHeaderRow}>
                                                <Package size={18} color={Colors.primary} />
                                                <Text style={styles.assetHeaderText}>Inventories filled by student</Text>
                                            </View>
                                            <View style={styles.assetDivider} />
                                            {selectedStudentAssets.items.map((item: any, idx: number) => (
                                                <View key={idx} style={[styles.modalAssetRow, idx === selectedStudentAssets.items.length - 1 && { borderBottomWidth: 0 }]}>
                                                    <View style={styles.assetMainInfo}>
                                                        <Text style={styles.modalAssetName}>{item.name}</Text>
                                                        <View style={styles.modalAssetCounts}>
                                                            <Text style={styles.modalCountText}>Total: {item.count}</Text>
                                                            {item.condition === 'DAMAGED' && (
                                                                <Text style={styles.modalDamagedText}>Damaged: {item.damagedCount}</Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                    <View style={[styles.modalStatusBadge, { backgroundColor: assetStatusConfig[item.condition].bg }]}>
                                                        <Text style={[styles.modalStatusText, { color: assetStatusConfig[item.condition].color }]}>
                                                            {item.condition}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                            <View style={styles.assetFooter}>
                                                <Text style={styles.footerTimestamp}>
                                                    Reported on: {new Date(selectedStudentAssets.submittedAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.modalEmptyAssets}>
                                            <AlertTriangle size={24} color={Colors.textLight} opacity={0.5} />
                                            <Text style={styles.modalEmptyText}>Student hasn't submitted asset report yet</Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    scrollContent: {
        padding: 16,
    },
    sectionHeader: {
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    floorRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    floorChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeFloorChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    floorText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    activeFloorText: {
        color: '#FFF',
    },
    roomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    roomCard: {
        width: (Constants.statusBarHeight > 0 ? (375 - 44) / 3 : 100), // Approx 3 per row
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
    },
    activeRoomCard: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    roomCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    activeRoomCardText: {
        color: '#FFF',
    },
    bedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bedCountText: {
        fontSize: 11,
        color: Colors.textLight,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
    },
    detailItem: {
        width: '50%',
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textLight,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    mateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    mateBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    mateAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    mateInitial: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    mateInfo: {
        flex: 1,
    },
    mateName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    mateBranch: {
        fontSize: 13,
        color: Colors.textLight,
    },
    unbookIconBtn: {
        padding: 8,
    },
    mateImg: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    assetList: {
        gap: 16,
    },
    assetRow: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    assetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    assetName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    assetDetails: {
        flexDirection: 'row',
    },
    assetCount: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
    },
    reportTimestamp: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    timestampText: {
        fontSize: 11,
        color: Colors.textLight,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    modalCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: {
        padding: 24,
    },
    profileHero: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileAvatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: Colors.primaryGhost,
    },
    profileImg: {
        width: '100%',
        height: '100%',
    },
    profileNameLarge: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
    profileSubText: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 4,
    },
    infoSection: {
        gap: 20,
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    infoCol: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textLight,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.textLight,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    additionalSection: {
        marginTop: 10,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textLight,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    roomIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginVertical: 20,
        gap: 12,
    },
    emptyStateText: {
        fontSize: 15,
        color: Colors.textLight,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    refreshBtn: {
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.primaryGhost,
        borderRadius: 10,
    },
    refreshText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    modalAssetCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    assetHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    assetHeaderText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    assetDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 12,
    },
    modalAssetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    assetMainInfo: {
        flex: 1,
    },
    modalAssetName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    modalAssetCounts: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCountText: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    modalDamagedText: {
        fontSize: 12,
        color: Colors.warning,
        fontWeight: '600',
    },
    modalStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    modalStatusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    assetFooter: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        alignItems: 'flex-end',
    },
    footerTimestamp: {
        fontSize: 11,
        color: Colors.textLight,
        fontStyle: 'italic',
    },
    modalEmptyAssets: {
        backgroundColor: '#F8FAFC',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
    },
    modalEmptyText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
        textAlign: 'center',
    },
});
