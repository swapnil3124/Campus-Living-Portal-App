import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    Modal,
    Alert,
} from 'react-native';
import {
    Plus,
    Clock,
    MapPin,
    CalendarDays,
    Download,
    CircleCheck as CheckCircle2,
    CircleX as XCircle,
    Timer,
    User,
    Home,
    Smartphone,
    X,
    ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useLeaveStore } from '@/store/leave-store';
import { mockStudent } from '@/mocks/data';
import { LeaveApplication } from '@/constants/types';

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    pending: { bg: Colors.warningLight, text: '#E65100', label: 'Pending', icon: <Timer size={14} color="#E65100" /> },
    approved: { bg: Colors.successLight, text: Colors.success, label: 'Approved', icon: <CheckCircle2 size={14} color={Colors.success} /> },
    rejected: { bg: Colors.errorLight, text: Colors.error, label: 'Rejected', icon: <XCircle size={14} color={Colors.error} /> },
};

function GatePassModal({ visible, onClose, leave }: { visible: boolean; onClose: () => void; leave: LeaveApplication | null }) {
    if (!leave) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.gatePassContainer}>
                    <View style={styles.gatePassHeader}>
                        <ShieldCheck size={24} color={Colors.white} />
                        <Text style={styles.gatePassHeaderTitle}>DIGITAL GATE PASS</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gatePassContent}>
                        <View style={[styles.qrPlaceholder, { height: 100, backgroundColor: Colors.background, marginBottom: 20 }]}>
                            <Text style={{ color: Colors.textLight }}>[ QR CODE ]</Text>
                        </View>

                        <View style={styles.passRow}>
                            <View style={styles.passCol}>
                                <Text style={styles.passLabel}>STUDENT NAME</Text>
                                <Text style={styles.passValue}>{mockStudent.name}</Text>
                            </View>
                            <View style={styles.passCol}>
                                <Text style={styles.passLabel}>ROOM NO</Text>
                                <Text style={styles.passValue}>{mockStudent.roomNo}</Text>
                            </View>
                        </View>

                        <View style={styles.passDivider} />

                        <View style={styles.passRow}>
                            <View style={styles.passCol}>
                                <Text style={styles.passLabel}>OUT TIME</Text>
                                <Text style={styles.passValue}>{leave.fromDate}</Text>
                            </View>
                            <View style={styles.passCol}>
                                <Text style={styles.passLabel}>IN TIME</Text>
                                <Text style={styles.passValue}>{leave.toDate}</Text>
                            </View>
                        </View>

                        <View style={styles.passDivider} />

                        <View style={styles.signatureSection}>
                            <Text style={styles.passLabel}>WARDEN SIGNATURE</Text>
                            <View style={styles.signatureWrap}>
                                <Text style={styles.signatureText}>Digitally Signed by Warden</Text>
                                <Text style={styles.signatureSubText}>Campus Living Portal Verified</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.downloadBtn} onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Success', 'Gate Pass downloaded to your gallery');
                        }}>
                            <Download size={18} color={Colors.white} />
                            <Text style={styles.downloadBtnText}>Save to Device</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function LeaveCard({ leave, index, onShowPass }: { leave: LeaveApplication; index: number, onShowPass: (l: LeaveApplication) => void }) {
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

    const status = statusConfig[leave.status];

    return (
        <Animated.View style={[styles.leaveCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                activeOpacity={0.95}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
            >
                <View style={styles.leaveHeader}>
                    <View style={styles.leaveTypeWrap}>
                        <CalendarDays size={16} color={Colors.primary} />
                        <Text style={styles.leaveType}>{leave.leaveType}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        {status.icon}
                        <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.leaveDates}>
                    <View style={styles.dateBlock}>
                        <Text style={styles.dateLabel}>From</Text>
                        <Text style={styles.dateValue}>{leave.fromDate}</Text>
                    </View>
                    <View style={styles.dateSeparator}>
                        <Text style={styles.dateSepText}>→</Text>
                    </View>
                    <View style={styles.dateBlock}>
                        <Text style={styles.dateLabel}>To</Text>
                        <Text style={styles.dateValue}>{leave.toDate}</Text>
                    </View>
                </View>

                <View style={styles.leaveDetails}>
                    <View style={styles.detailRow}>
                        <MapPin size={12} color={Colors.textLight} />
                        <Text style={styles.detailText}>{leave.destination}</Text>
                    </View>
                    <Text style={styles.leaveReason}>{leave.reason}</Text>

                    {leave.status === 'rejected' && leave.rejectionReason && (
                        <View style={styles.rejectionBox}>
                            <Text style={styles.rejectionTitle}>Reason for Rejection:</Text>
                            <Text style={styles.rejectionText}>{leave.rejectionReason}</Text>
                        </View>
                    )}
                </View>

                {leave.status === 'approved' && (
                    <TouchableOpacity
                        style={styles.gatePassBtn}
                        onPress={() => onShowPass(leave)}
                        activeOpacity={0.85}
                    >
                        <Download size={14} color={Colors.primary} />
                        <Text style={styles.gatePassText}>Download Gate Pass</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function LeaveScreen() {
    const router = useRouter();
    const { leaves, fetchLeaves } = useLeaveStore();
    const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
    const [passVisible, setPassVisible] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    // Filter leaves for the current student
    const studentLeaves = useMemo(() => {
        return leaves.filter(l => l.studentId === mockStudent.id);
    }, [leaves]);

    const totalLeaves = studentLeaves.filter(l => l.status === 'approved').length;
    const pendingLeaves = studentLeaves.filter(l => l.status === 'pending').length;

    const handleShowPass = (leave: LeaveApplication) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedLeave(leave);
        setPassVisible(true);
    };

    return (
        <View style={styles.container}>
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: Colors.primary + '10' }]}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.primary }]}>
                        <CalendarDays size={20} color={Colors.white} />
                    </View>
                    <View>
                        <Text style={styles.statValue}>{totalLeaves}</Text>
                        <Text style={styles.statLabel}>Total Leaves</Text>
                    </View>
                </View>
                <View style={[styles.statCard, { backgroundColor: Colors.warningLight }]}>
                    <View style={[styles.statIcon, { backgroundColor: '#E65100' }]}>
                        <Clock size={20} color={Colors.white} />
                    </View>
                    <View>
                        <Text style={styles.statValue}>{pendingLeaves}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Application History</Text>
                {studentLeaves.map((leave, index) => (
                    <LeaveCard key={leave.id} leave={leave} index={index} onShowPass={handleShowPass} />
                ))}
                {studentLeaves.length === 0 && (
                    <View style={styles.emptyState}>
                        <CalendarDays size={48} color={Colors.textLight} />
                        <Text style={styles.emptyText}>No leave applications</Text>
                    </View>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/student/new-leave' as any);
                }}
                activeOpacity={0.85}
                testID="new-leave-btn"
            >
                <Plus size={24} color={Colors.white} />
            </TouchableOpacity>

            <GatePassModal
                visible={passVisible}
                onClose={() => setPassVisible(false)}
                leave={selectedLeave}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: 16,
    },
    leaveCard: {
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
    leaveHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    leaveTypeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    leaveType: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600' as const,
    },
    leaveDates: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    dateBlock: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 10,
        color: Colors.textLight,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    dateSeparator: {
        paddingHorizontal: 12,
    },
    dateSepText: {
        fontSize: 16,
        color: Colors.textLight,
    },
    leaveDetails: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    leaveReason: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    gatePassBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primaryGhost,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 12,
    },
    gatePassText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.primary,
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
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    rejectionBox: {
        backgroundColor: Colors.errorLight,
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        borderLeftWidth: 3,
        borderLeftColor: Colors.error,
    },
    rejectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.error,
        marginBottom: 2,
    },
    rejectionText: {
        fontSize: 13,
        color: Colors.text,
        opacity: 0.8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    gatePassContainer: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        overflow: 'hidden',
    },
    gatePassHeader: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    gatePassHeaderTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    gatePassContent: {
        padding: 24,
    },
    qrPlaceholder: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
    },
    passRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    passCol: {
        flex: 1,
    },
    passLabel: {
        fontSize: 10,
        color: Colors.textLight,
        fontWeight: '600',
        marginBottom: 4,
    },
    passValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '700',
    },
    passDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 16,
    },
    signatureSection: {
        marginBottom: 24,
    },
    signatureWrap: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    signatureText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
        fontStyle: 'italic',
    },
    signatureSubText: {
        fontSize: 10,
        color: Colors.textLight,
        marginTop: 2,
    },
    downloadBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 12,
    },
    downloadBtnText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
});
