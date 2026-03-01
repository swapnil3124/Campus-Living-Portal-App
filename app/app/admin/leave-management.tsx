import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Search,
    User,
    Clock,
    CheckCircle,
    XCircle,
    MapPin,
    Calendar,
    Phone,
    Filter,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useLeaveStore } from '@/store/leave-store';
import { LeaveApplication } from '@/constants/types';
import { useAuth } from '@/contexts/AuthContext';

export default function LeaveManagementScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { hostelName } = useAuth();
    const { leaves, fetchLeaves, updateLeaveStatus, isLoading } = useLeaveStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchLeaves();
        setIsRefreshing(false);
    };

    const filteredLeaves = useMemo(() => {
        if (!leaves) return [];

        let result = leaves.filter(l => {
            const name = l.studentName?.toLowerCase() || '';
            const id = l.studentId?.toLowerCase() || '';
            const query = searchQuery?.toLowerCase() || '';
            return name.includes(query) || id.includes(query);
        });

        // Apply Warden/Hostel routing rules only if hostelName is provided
        if (hostelName) {
            const hName = hostelName.toLowerCase();

            if (hName === 'shivneri') {
                result = result.filter(l => {
                    const year = l.studentYear?.toLowerCase() || '';
                    return year.includes('first') || year.includes('1st');
                });
            } else if (hName === 'lenyadri') {
                result = result.filter(l => {
                    const year = l.studentYear?.toLowerCase() || '';
                    return year.includes('second') || year.includes('2nd');
                });
            } else if (hName === 'bhimashankar') {
                result = result.filter(l => {
                    const year = l.studentYear?.toLowerCase() || '';
                    return year.includes('third') || year.includes('3rd');
                });
            } else if (['saraswati', 'shwetamber', 'shwetambara'].includes(hName)) {
                result = result.filter(l => l.hostelName?.toLowerCase() === hName);
            } else if (hName === 'girls') {
                result = result.filter(l => ['saraswati', 'shwetamber', 'shwetambara'].includes(l.hostelName?.toLowerCase() || ''));
            } else if (hName === 'boys') {
                result = result.filter(l => ['shivneri', 'lenyadri', 'bhimashankar'].includes(l.hostelName?.toLowerCase() || ''));
            }
        }

        return result;
    }, [leaves, searchQuery, hostelName]);

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!selectedLeave) return;

        if (status === 'rejected' && !rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for rejection');
            return;
        }

        try {
            await updateLeaveStatus(selectedLeave.id, status, status === 'rejected' ? rejectionReason : undefined);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsActionModalVisible(false);
            setRejectionReason('');
            setSelectedLeave(null);
            Alert.alert('Success', `Leave application ${status} successfully!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: (insets?.top || 0) + 10 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leave Management</Text>
            </View>

            <View style={styles.searchBarWrap}>
                <View style={styles.searchBar}>
                    <Search size={20} color={Colors.textLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by student name..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                {isLoading && leaves.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Loading applications...</Text>
                    </View>
                ) : filteredLeaves.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No pending applications found</Text>
                    </View>
                ) : filteredLeaves.map((leave) => {
                    if (!leave) return null;
                    const status = leave.status || 'pending';

                    return (
                        <TouchableOpacity
                            key={leave.id}
                            style={styles.card}
                            onPress={() => {
                                setSelectedLeave(leave);
                                setIsActionModalVisible(true);
                            }}
                        >
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.studentName}>{leave.studentName || 'Unknown Student'}</Text>
                                    <Text style={styles.studentSub}>
                                        {(leave.studentYear || 'N/A')} • Room {leave.roomNo || 'N/A'}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: status === 'pending' ? Colors.warningLight : status === 'approved' ? Colors.successLight : Colors.errorLight }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: status === 'pending' ? '#E65100' : status === 'approved' ? Colors.success : Colors.error }
                                    ]}>
                                        {status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <Calendar size={14} color={Colors.textLight} />
                                <Text style={styles.infoValue}>{leave.fromDate || '---'} → {leave.toDate || '---'}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <MapPin size={14} color={Colors.textLight} />
                                <Text style={styles.infoValue}>{leave.destination || 'Not Specified'}</Text>
                            </View>

                            <View style={styles.reasonBox}>
                                <Text style={styles.reasonLabel}>Reason:</Text>
                                <Text style={styles.reasonText} numberOfLines={2}>{leave.reason || 'No reason provided'}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Action Modal */}
            <Modal
                visible={isActionModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsActionModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Review Leave</Text>
                            <TouchableOpacity onPress={() => setIsActionModalVisible(false)}>
                                <XCircle size={24} color={Colors.textLight} />
                            </TouchableOpacity>
                        </View>

                        {selectedLeave && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailCard}>
                                    <View style={styles.detailRow}>
                                        <User size={16} color={Colors.primary} />
                                        <Text style={styles.detailText}>{selectedLeave.studentName} ({selectedLeave.studentId})</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Phone size={16} color={Colors.primary} />
                                        <Text style={styles.detailText}>Parent: {selectedLeave.parentContact}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Calendar size={16} color={Colors.primary} />
                                        <Text style={styles.detailText}>{selectedLeave.fromDate} to {selectedLeave.toDate}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <MapPin size={16} color={Colors.primary} />
                                        <Text style={styles.detailText}>{selectedLeave.destination}</Text>
                                    </View>
                                </View>

                                <Text style={styles.sectionTitle}>Reason for Leave</Text>
                                <View style={styles.reasonDetailBox}>
                                    <Text style={styles.reasonDetailText}>{selectedLeave.reason}</Text>
                                </View>

                                {selectedLeave.status === 'pending' ? (
                                    <>
                                        <Text style={styles.sectionTitle}>Remarks (If Rejecting)</Text>
                                        <TextInput
                                            style={styles.remarkInput}
                                            placeholder="Enter rejection reason..."
                                            value={rejectionReason}
                                            onChangeText={setRejectionReason}
                                            multiline
                                        />

                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.rejectBtn]}
                                                onPress={() => handleAction('rejected')}
                                            >
                                                <XCircle size={20} color={Colors.white} />
                                                <Text style={styles.actionBtnText}>Reject</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.approveBtn]}
                                                onPress={() => handleAction('approved')}
                                            >
                                                <CheckCircle size={20} color={Colors.white} />
                                                <Text style={styles.actionBtnText}>Approve</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.statusInfoBox}>
                                        <Text style={styles.statusInfoLabel}>Status: {selectedLeave.status.toUpperCase()}</Text>
                                        {selectedLeave.rejectionReason && (
                                            <Text style={styles.rejectionText}>Reason: {selectedLeave.rejectionReason}</Text>
                                        )}
                                    </View>
                                )}
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: Colors.white,
    },
    backBtn: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    searchBarWrap: {
        padding: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 14,
        paddingHorizontal: 12,
        gap: 8,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    studentName: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
    },
    studentSub: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    infoValue: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: '500',
    },
    reasonBox: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
    },
    reasonLabel: {
        fontSize: 11,
        color: Colors.textLight,
        fontWeight: '600',
        marginBottom: 2,
    },
    reasonText: {
        fontSize: 13,
        color: Colors.text,
        lineHeight: 18,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textSecondary,
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
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    detailCard: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailText: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.textSecondary,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reasonDetailBox: {
        backgroundColor: 'rgba(0, 137, 123, 0.05)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 137, 123, 0.1)',
        marginBottom: 20,
    },
    reasonDetailText: {
        fontSize: 15,
        color: Colors.text,
        lineHeight: 22,
    },
    remarkInput: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 15,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        marginBottom: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    rejectBtn: {
        backgroundColor: Colors.error,
    },
    approveBtn: {
        backgroundColor: Colors.success,
    },
    actionBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    statusInfoBox: {
        padding: 16,
        backgroundColor: '#F1F3F5',
        borderRadius: 12,
    },
    statusInfoLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    rejectionText: {
        fontSize: 14,
        color: Colors.error,
        marginTop: 4,
    }
});
