import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Platform,
} from 'react-native';
import { Plus, Clock, MessageSquare, ChevronRight, X, Image as ImageIcon, ExternalLink } from 'lucide-react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Complaint } from '@/constants/types';

import { API_URL } from '@/constants/config';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    'pending': { bg: '#FFF3E0', text: '#E65100', label: 'Pending' },
    'in-progress': { bg: Colors.infoLight, text: Colors.info, label: 'In Progress' },
    'resolved': { bg: Colors.successLight, text: Colors.success, label: 'Resolved' },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
    'low': { bg: Colors.successLight, text: Colors.success },
    'medium': { bg: Colors.warningLight, text: '#E65100' },
    'high': { bg: Colors.errorLight, text: Colors.error },
};

function ComplaintCard({ complaint, index, onPress }: { complaint: Complaint; index: number; onPress: () => void }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, []);

    const status = statusConfig[complaint.status];
    const priority = priorityConfig[complaint.priority];

    return (
        <Animated.View style={[styles.complaintCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                activeOpacity={0.95}
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
            >
                <View style={styles.complaintHeader}>
                    <View style={styles.complaintTypeRow}>
                        <View style={[styles.typeBadge, { backgroundColor: priority?.bg || Colors.border }]}>
                            <Text style={[styles.typeText, { color: priority?.text || Colors.textSecondary }]}>{complaint.type}</Text>
                        </View>
                        <View style={[styles.priorityDot, { backgroundColor: priority?.text || Colors.textSecondary }]} />
                        <Text style={[styles.priorityLabel, { color: priority?.text || Colors.textSecondary }]}>{complaint.priority}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status?.bg || Colors.border }]}>
                        <Text style={[styles.statusText, { color: status?.text || Colors.textSecondary }]}>{status?.label || complaint.status}</Text>
                    </View>
                </View>
                <Text style={styles.complaintDesc} numberOfLines={2}>{complaint.description}</Text>
                
                <View style={styles.cardInfoRow}>
                    <View style={styles.dateWrap}>
                        <Clock size={12} color={Colors.textLight} />
                        <Text style={styles.dateText}>{complaint.createdAt}</Text>
                    </View>
                    {complaint.imageUrl && (
                        <View style={styles.attachmentMarker}>
                            <ImageIcon size={12} color={Colors.primary} />
                            <Text style={styles.attachmentMarkerText}>Image Attached</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function ComplaintsScreen() {
    const router = useRouter();
    const { student, token } = useAuth();
    const [filter, setFilter] = useState<string>('all');
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isViewerVisible, setIsViewerVisible] = useState(false);

    const fetchComplaints = async () => {
        const studentId = student?._id || student?.id;
        if (!studentId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/complaints/student/${studentId}`);
            const text = await response.text();
            
            try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    setComplaints(data);
                } else if (data.error) {
                    console.error('API Error:', data.error);
                }
            } catch (e) {
                console.error('Invalid JSON response:', text.substring(0, 100));
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [student?._id, student?.id]);

    const filtered = filter === 'all'
        ? complaints
        : complaints.filter(c => c.status === filter);

    return (
        <View style={styles.container}>
            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['all', 'pending', 'in-progress', 'resolved'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.filterActive]}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
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
                ) : filtered.length > 0 ? (
                    filtered.map((complaint, index) => (
                        <ComplaintCard 
                            key={complaint._id || index} 
                            complaint={{
                                ...complaint,
                                priority: complaint.priority?.toLowerCase() || 'medium',
                                status: complaint.status?.toLowerCase() || 'pending',
                                createdAt: new Date(complaint.createdAt).toLocaleDateString()
                            }} 
                            index={index} 
                            onPress={() => {
                                setSelectedComplaint(complaint);
                                setIsModalVisible(true);
                            }}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <MessageSquare size={48} color={Colors.textLight} />
                        <Text style={styles.emptyText}>No complaints found</Text>
                    </View>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/student/new-complaint' as any);
                }}
                activeOpacity={0.85}
                testID="new-complaint-btn"
            >
                <Plus size={24} color={Colors.white} />
            </TouchableOpacity>

            {/* Detail Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Complaint Detail</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <View style={[styles.statusBadge, { backgroundColor: statusConfig[selectedComplaint?.status]?.bg }]}>
                                        <Text style={[styles.statusText, { color: statusConfig[selectedComplaint?.status]?.text }]}>
                                            {statusConfig[selectedComplaint?.status]?.label.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={[styles.typeBadge, { backgroundColor: priorityConfig[selectedComplaint?.priority]?.bg }]}>
                                        <Text style={[styles.typeText, { color: priorityConfig[selectedComplaint?.priority]?.text }]}>
                                            {selectedComplaint?.type}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.label}>Description</Text>
                                <Text style={styles.detailDescription}>{selectedComplaint?.description}</Text>

                                {selectedComplaint?.imageUrl && (
                                    <View style={styles.detailAttachment}>
                                        <Text style={styles.label}>Attachment</Text>
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
                                                <ExternalLink size={20} color={Colors.white} />
                                                <Text style={styles.overlayText}>Tap to View</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {selectedComplaint?.wardenRemark && (
                                    <View style={styles.wardenSection}>
                                        <Text style={styles.label}>Warden Remark</Text>
                                        <View style={styles.remarkBoxLarge}>
                                            <Text style={styles.remarkTextLarge}>{selectedComplaint.wardenRemark}</Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.detailFooter}>
                                    <Text style={styles.footerInfoText}>Filed on: {new Date(selectedComplaint?.createdAt).toLocaleString()}</Text>
                                    <Text style={styles.footerInfoText}>Room: {selectedComplaint?.roomNumber}</Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Full Screen Image Viewer */}
            <Modal
                visible={isViewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsViewerVisible(false)}
            >
                <View style={styles.viewerOverlay}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                    <TouchableOpacity style={styles.viewerClose} onPress={() => setIsViewerVisible(false)}>
                        <X size={32} color={Colors.white} />
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
        backgroundColor: Colors.background,
    },
    filterRow: {
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filterScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500' as const,
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: Colors.white,
    },
    listContent: {
        padding: 16,
    },
    complaintCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    complaintHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    complaintTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600' as const,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    priorityLabel: {
        fontSize: 11,
        fontWeight: '500' as const,
        textTransform: 'capitalize' as const,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600' as const,
    },
    complaintDesc: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
        marginBottom: 10,
    },
    remarkBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.primaryGhost,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    remarkText: {
        flex: 1,
        fontSize: 12,
        color: Colors.primaryDark,
        lineHeight: 17,
    },
    complaintFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        color: Colors.textLight,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textLight,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    cardInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    dateWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    attachmentMarker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryGhost,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    attachmentMarkerText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    closeBtn: {
        padding: 4,
    },
    modalScroll: {
        flex: 1,
    },
    detailSection: {
        padding: 24,
    },
    detailRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 10,
    },
    detailDescription: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.text,
        marginBottom: 24,
    },
    detailAttachment: {
        marginBottom: 24,
    },
    imagePreviewBox: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 200,
        marginTop: 8,
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
        color: Colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
    wardenSection: {
        marginBottom: 24,
    },
    remarkBoxLarge: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    remarkTextLarge: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.text,
    },
    detailFooter: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: 4,
    },
    footerInfoText: {
        fontSize: 12,
        color: Colors.textLight,
    },
    viewerOverlay: {
        flex: 1,
        backgroundColor: Colors.black,
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
