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
    TextInput,
    Alert,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertTriangle,
    X,
    User,
    Building2,
    Send,
    MessageCircle,
    Image as ImageIcon,
    ExternalLink,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

import { API_URL } from '@/constants/config';

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    'pending': { icon: Clock, color: '#E65100', bg: '#FFF3E0', label: 'Pending' },
    'in-progress': { icon: ActivityIndicator, color: Colors.info, bg: Colors.infoLight, label: 'In Progress' },
    'resolved': { icon: CheckCircle2, color: Colors.success, bg: Colors.successLight, label: 'Resolved' },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
    'low': { color: Colors.success, bg: Colors.successLight },
    'medium': { color: '#E65100', bg: '#FFF3E0' },
    'high': { color: Colors.error, bg: Colors.errorLight },
};

export default function WardenComplaintsScreen() {
    const router = useRouter();
    const { hostelName: contextHostelName, token, student } = useAuth();
    
    const normalizeHostel = (h: string | null) => {
        if (!h) return null;
        const lower = h.toLowerCase().trim();
        if (lower === 'shivneri' || lower === 'shivneri hostel') return 'Shivneri';
        if (lower === 'lenyadri' || lower === 'lenyadri hostel') return 'Lenyadri';
        if (lower === 'bhimashankar' || lower === 'bhimashankar hostel') return 'Bhimashankar';
        if (lower.includes('shwetambar')) return 'Shwetambar';  // Girls hostel
        if (lower === 'saraswati' || lower === 'saraswati hostel') return 'Saraswati';  // Girls hostel
        if (lower === 'girls') return 'girls';  // Rector – handled server-side
        if (lower === 'boys') return 'boys';
        return h;
    };

    const hostelName = normalizeHostel(contextHostelName);
    
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    
    // Modal state
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [newRemark, setNewRemark] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [updating, setUpdating] = useState(false);
    const [isViewerVisible, setIsViewerVisible] = useState(false);

    const fetchComplaints = useCallback(async () => {
        if (!hostelName || !token) return;
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/complaints/warden?hostelName=${encodeURIComponent(hostelName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setComplaints(data);
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    }, [hostelName, token]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const handleUpdateStatus = async () => {
        if (!selectedComplaint) return;
        try {
            setUpdating(true);
            const response = await fetch(`${API_URL}/complaints/${selectedComplaint._id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    wardenRemark: newRemark,
                    wardenId: student?._id // Or staff ID if available
                }),
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Complaint status updated');
                setModalVisible(false);
                fetchComplaints();
            }
        } catch (error) {
            console.error('Error updating complaint:', error);
            Alert.alert('Error', 'Failed to update complaint');
        } finally {
            setUpdating(false);
        }
    };

    const filteredComplaints = filter === 'all' 
        ? complaints 
        : complaints.filter(c => c.status === filter);

    const openDetails = (complaint: any) => {
        setSelectedComplaint(complaint);
        setNewRemark(complaint.wardenRemark || '');
        setNewStatus(complaint.status);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>

            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['all', 'pending', 'in-progress', 'resolved'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.filterActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f === 'all' ? 'All' : statusConfig[f]?.label ?? f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : filteredComplaints.length > 0 ? (
                    filteredComplaints.map((c, idx) => (
                        <TouchableOpacity key={c._id || idx} style={styles.complaintCard} onPress={() => openDetails(c)}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[c.priority]?.bg }]}>
                                    <Text style={[styles.priorityText, { color: priorityConfig[c.priority]?.color }]}>
                                        {c.priority.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.timestamp}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                            </View>

                            <Text style={styles.complaintType}>{c.type}</Text>
                            <Text style={styles.description} numberOfLines={2}>{c.description}</Text>

                            <View style={styles.cardFooter}>
                                <View style={styles.studentInfo}>
                                    <User size={14} color={Colors.textLight} />
                                    <Text style={styles.studentText}>{c.studentName} (Room {c.roomNumber})</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusConfig[c.status].bg }]}>
                                    <Text style={[styles.statusText, { color: statusConfig[c.status].color }]}>
                                        {statusConfig[c.status].label}
                                    </Text>
                                </View>
                            </View>

                            {c.imageUrl && (
                                <View style={styles.attachmentMarker}>
                                    <ImageIcon size={12} color={Colors.primary} />
                                    <Text style={styles.attachmentMarkerText}>Image Attachment</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <MessageSquare size={48} color={Colors.textLight} opacity={0.3} />
                        <Text style={styles.emptyText}>No complaints found for this category</Text>
                    </View>
                )}
            </ScrollView>

            {/* Manage Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage Complaint</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <X size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedComplaint && (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                                <View style={styles.detailSection}>
                                    <Text style={styles.modalSectionLabel}>COMPLAINT DETAILS</Text>
                                    <View style={styles.detailCard}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Student:</Text>
                                            <Text style={styles.detailVal}>{selectedComplaint.studentName}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Room No:</Text>
                                            <Text style={styles.detailVal}>{selectedComplaint.roomNumber}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Enrollment:</Text>
                                            <Text style={styles.detailVal}>{selectedComplaint.studentEnrollment}</Text>
                                        </View>
                                        <View style={styles.detailDivider} />
                                        <Text style={styles.detailLabel}>Issue Description:</Text>
                                        <Text style={styles.modalDesc}>{selectedComplaint.description}</Text>

                                        {selectedComplaint.imageUrl && (
                                            <View style={styles.attachmentSection}>
                                                <Text style={[styles.detailLabel, { marginTop: 16 }]}>ATTACHMENT:</Text>
                                                <TouchableOpacity 
                                                    style={styles.imagePreviewBox}
                                                    onPress={() => setIsViewerVisible(true)}
                                                >
                                                    <Image 
                                                        source={{ uri: `${API_URL.replace('/api', '')}${selectedComplaint.imageUrl}` }} 
                                                        style={styles.detailImage}
                                                        contentFit="cover"
                                                    />
                                                    <View style={styles.imageOverlay}>
                                                        <ExternalLink size={20} color="#FFF" />
                                                        <Text style={styles.overlayText}>Tap to Enlarge</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.actionSection}>
                                    <Text style={styles.modalSectionLabel}>UPDATE STATUS</Text>
                                    <View style={styles.statusOptions}>
                                        {['pending', 'in-progress', 'resolved'].map(s => (
                                            <TouchableOpacity 
                                                key={s} 
                                                style={[styles.statusOption, newStatus === s && { borderColor: statusConfig[s].color, backgroundColor: statusConfig[s].bg }]}
                                                onPress={() => setNewStatus(s)}
                                            >
                                                <Text style={[styles.statusOptionText, newStatus === s && { color: statusConfig[s].color }]}>
                                                    {statusConfig[s].label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.modalSectionLabel, { marginTop: 20 }]}>WARDEN REMARK</Text>
                                    <TextInput
                                        style={styles.remarkInput}
                                        placeholder="Add a remark for the student..."
                                        multiline
                                        numberOfLines={4}
                                        value={newRemark}
                                        onChangeText={setNewRemark}
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={styles.updateBtn} 
                                    onPress={handleUpdateStatus}
                                    disabled={updating}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.primaryDark]}
                                        style={styles.updateGradient}
                                    >
                                        {updating ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <>
                                                <Send size={18} color="#FFF" />
                                                <Text style={styles.updateBtnText}>Save Changes</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* In-App Viewer Modal */}
            <Modal
                visible={isViewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsViewerVisible(false)}
            >
                <View style={styles.viewerOverlay}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                    <TouchableOpacity style={styles.viewerClose} onPress={() => setIsViewerVisible(false)}>
                        <X size={32} color="#FFF" />
                    </TouchableOpacity>
                    <Image 
                        source={{ uri: selectedComplaint?.imageUrl ? `${API_URL.replace('/api', '')}${selectedComplaint.imageUrl}` : '' }}
                        style={styles.fullImage}
                        contentFit="contain"
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    filterRow: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    filterScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: '#FFF',
    },
    listContent: {
        padding: 16,
    },
    complaintCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '800',
    },
    timestamp: {
        fontSize: 11,
        color: Colors.textLight,
    },
    complaintType: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    studentText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        gap: 12,
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    closeBtn: {
        padding: 4,
    },
    modalScroll: {
        padding: 20,
    },
    detailSection: {
        marginBottom: 24,
    },
    actionSection: {
        marginBottom: 24,
    },
    modalSectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textLight,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    detailCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    detailLabel: {
        width: 100,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    detailVal: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
    detailDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    modalDesc: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 22,
        marginTop: 4,
    },
    statusOptions: {
        flexDirection: 'row',
        gap: 10,
    },
    statusOption: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    statusOptionText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textLight,
    },
    remarkInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    updateBtn: {
        marginTop: 30,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 40,
    },
    updateGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    updateBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    attachmentMarker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
        backgroundColor: Colors.primaryGhost,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    attachmentMarkerText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.primary,
    },
    attachmentSection: {
        marginTop: 8,
    },
    imagePreviewBox: {
        borderRadius: 12,
        overflow: 'hidden',
        height: 180,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    overlayText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 12,
    },
    viewerOverlay: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerClose: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
});
