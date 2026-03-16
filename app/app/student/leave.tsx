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
    Image,
    ActivityIndicator,
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
    FileText,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import Colors from '@/constants/colors';
import { useLeaveStore } from '@/store/leave-store';
import { useAuth } from '@/contexts/AuthContext';
import { LeaveApplication } from '@/constants/types';

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    pending: { bg: Colors.warningLight, text: '#E65100', label: 'Pending', icon: <Timer size={14} color="#E65100" /> },
    approved: { bg: Colors.successLight, text: Colors.success, label: 'Approved', icon: <CheckCircle2 size={14} color={Colors.success} /> },
    rejected: { bg: Colors.errorLight, text: Colors.error, label: 'Rejected', icon: <XCircle size={14} color={Colors.error} /> },
};

function GatePassModal({ visible, onClose, leave }: { visible: boolean; onClose: () => void; leave: LeaveApplication | null }) {
    const { student } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);

    if (!leave || !student) return null;

    const qrData = leave.qrCodeToken || leave.id;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    const formatDate = (d: string) => {
        if (!d) return '---';
        try {
            return new Date(d).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return d;
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setIsGenerating(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Load signature image as base64
            let signatureBase64 = '';
            try {
                const asset = Asset.fromModule(require('@/assets/images/signature.png'));
                await asset.downloadAsync();
                if (asset.localUri) {
                    signatureBase64 = await FileSystem.readAsStringAsync(asset.localUri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    signatureBase64 = `data:image/png;base64,${signatureBase64}`;
                }
            } catch (e) {
                console.warn('Could not load signature:', e);
            }

            // Fetch QR code as base64
            let qrBase64 = '';
            try {
                const qrResp = await fetch(qrUrl);
                const qrBlob = await qrResp.blob();
                const reader: any = new FileReader();
                qrBase64 = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(qrBlob);
                });
            } catch (e) {
                console.warn('Could not fetch QR:', e);
                qrBase64 = qrUrl; // fallback to URL
            }

            const issuedDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

            const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
  .pass {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    max-width: 680px;
    margin: 0 auto;
  }
  .header {
    background: linear-gradient(135deg, #00443D, #00897B);
    color: white;
    padding: 24px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-left h1 { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
  .header-left p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
  .badge {
    background: rgba(255,255,255,0.2);
    border: 1.5px solid rgba(255,255,255,0.5);
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .body { padding: 28px; }
  .top-section { display: flex; gap: 24px; align-items: flex-start; margin-bottom: 24px; }
  .qr-box {
    border: 2px solid #E0F2F1;
    border-radius: 12px;
    padding: 8px;
    background: #F9FFFE;
    flex-shrink: 0;
  }
  .qr-box img { width: 120px; height: 120px; display: block; }
  .qr-label { text-align: center; font-size: 9px; color: #00897B; font-weight: 700; margin-top: 6px; letter-spacing: 1px; }
  .student-info { flex: 1; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .info-item label { font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; }
  .info-item span { font-size: 15px; font-weight: 700; color: #1a1a1a; display: block; margin-top: 3px; }
  .divider { height: 1px; background: #E8F5E9; margin: 20px 0; }
  .dates-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .date-box { background: #F5FFFE; border: 1px solid #B2DFDB; border-radius: 12px; padding: 14px; }
  .date-box label { font-size: 10px; color: #00897B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; }
  .date-box span { font-size: 14px; font-weight: 700; color: #1a1a1a; display: block; margin-top: 5px; }
  .details-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  .detail-item label { font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; }
  .detail-item span { font-size: 13px; color: #333; display: block; margin-top: 3px; }
  .reason-box { background: #FFF8E1; border-left: 4px solid #FFC107; border-radius: 8px; padding: 14px; margin-bottom: 24px; }
  .reason-box label { font-size: 10px; color: #F57F17; font-weight: 700; text-transform: uppercase; }
  .reason-box p { font-size: 13px; color: #333; margin-top: 4px; line-height: 1.5; }
  .sig-section { display: flex; justify-content: flex-end; border-top: 1px dashed #ddd; padding-top: 20px; }
  .sig-block { text-align: center; }
  .sig-img { max-height: 60px; max-width: 180px; object-fit: contain; margin-bottom: 6px; }
  .sig-name { font-size: 12px; font-weight: 700; color: #1a1a1a; }
  .sig-title { font-size: 10px; color: #888; }
  .footer {
    background: #F5FFFE;
    border-top: 1px solid #E0F2F1;
    padding: 14px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left { font-size: 11px; color: #888; }
  .footer-left strong { color: #00897B; }
  .verified-badge {
    background: #E8F5E9;
    border: 1px solid #A5D6A7;
    color: #2E7D32;
    font-size: 11px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 20px;
  }
</style>
</head>
<body>
<div class="pass">
  <div class="header">
    <div class="header-left">
      <h1>🎓 GATE PASS</h1>
      <p>Government Polytechnic Awasari (Kh.) • Campus Living Portal</p>
    </div>
    <div class="badge">APPROVED</div>
  </div>

  <div class="body">
    <div class="top-section">
      <div class="qr-box">
        <img src="${qrBase64}" />
        <div class="qr-label">SCAN TO VERIFY</div>
      </div>
      <div class="student-info">
        <div class="info-grid">
          <div class="info-item"><label>Student Name</label><span>${student.name}</span></div>
          <div class="info-item"><label>Enrollment No</label><span>${student.enrollmentNo}</span></div>
          <div class="info-item"><label>Department</label><span>${student.department || 'N/A'}</span></div>
          <div class="info-item"><label>Year</label><span>${student.year || 'N/A'}</span></div>
          <div class="info-item"><label>Hostel</label><span>${student.hostelName}</span></div>
          <div class="info-item"><label>Room No</label><span>${student.roomNo}</span></div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="dates-section">
      <div class="date-box">
        <label>📅 Departure Date &amp; Time</label>
        <span>${formatDate(leave.fromDate)}</span>
      </div>
      <div class="date-box">
        <label>📅 Return Date &amp; Time</label>
        <span>${formatDate(leave.toDate)}</span>
      </div>
    </div>

    <div class="details-row">
      <div class="detail-item"><label>Leave Type</label><span>${leave.leaveType}</span></div>
      <div class="detail-item"><label>Destination</label><span>${leave.destination}</span></div>
      <div class="detail-item"><label>Parent Contact</label><span>${leave.parentContact}</span></div>
      <div class="detail-item"><label>Pass Token</label><span>${qrData}</span></div>
    </div>

    <div class="reason-box">
      <label>Reason for Leave</label>
      <p>${leave.reason}</p>
    </div>

    <div class="sig-section">
      <div class="sig-block">
        ${signatureBase64 ? `<img class="sig-img" src="${signatureBase64}" />` : '<div style="height:50px;border-bottom:2px solid #333;width:160px;"></div>'}
        <div class="sig-name">Hostel Warden</div>
        <div class="sig-title">Government Polytechnic Awasari (Kh.)</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-left">Issued on: <strong>${issuedDate}</strong> &nbsp;|&nbsp; Valid for one-time use only</div>
    <div class="verified-badge">✅ Digitally Verified</div>
  </div>
</div>
</body>
</html>`;

            const { uri } = await Print.printToFileAsync({ html, base64: false });

            const fileName = `GatePass_${student.enrollmentNo}_${Date.now()}.pdf`;
            const destPath = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.moveAsync({ from: uri, to: destPath });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(destPath, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Save Gate Pass',
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('Saved', `Gate Pass saved to:\n${destPath}`);
            }
        } catch (err: any) {
            console.error('PDF generation error:', err);
            Alert.alert('Error', 'Could not generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

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
                        <View style={[styles.qrPlaceholder, { height: 150, backgroundColor: Colors.background, marginBottom: 20, borderWidth: 0 }]}>
                            <Image
                                source={{ uri: qrUrl }}
                                style={{ width: 140, height: 140 }}
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.passRow}>
                            <View style={styles.passCol}>
                                <Text style={styles.passLabel}>STUDENT NAME</Text>
                                <Text style={styles.passValue}>{student.name}</Text>
                            </View>
                            <View style={styles.passCol}>
                                <Text style={styles.passLabel}>ROOM NO</Text>
                                <Text style={styles.passValue}>{student.roomNo}</Text>
                            </View>
                        </View>

                        <View style={styles.passDivider} />

                        <View style={styles.passRow}>
                            <View style={styles.passCol}>
                                <Text style={styles.passLabel}>DEPARTURE</Text>
                                <Text style={styles.passValue}>{formatDate(leave.fromDate)}</Text>
                            </View>
                            <View style={styles.passCol}>
                                <Text style={styles.passLabel}>RETURN</Text>
                                <Text style={styles.passValue}>{formatDate(leave.toDate)}</Text>
                            </View>
                        </View>

                        <View style={styles.passDivider} />

                        <View style={styles.signatureSection}>
                            <Text style={styles.passLabel}>WARDEN SIGNATURE</Text>
                            <View style={styles.signatureWrap}>
                                <Image
                                    source={require('@/assets/images/signature.png')}
                                    style={{ height: 44, width: 180, resizeMode: 'contain' }}
                                />
                                <Text style={styles.signatureSubText}>Campus Living Portal Verified</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.downloadBtn, isGenerating && { opacity: 0.7 }]}
                            onPress={handleDownloadPDF}
                            disabled={isGenerating}
                            activeOpacity={0.85}
                        >
                            {isGenerating ? (
                                <ActivityIndicator color={Colors.white} size="small" />
                            ) : (
                                <FileText size={18} color={Colors.white} />
                            )}
                            <Text style={styles.downloadBtnText}>
                                {isGenerating ? 'Generating PDF...' : 'Download Gate Pass (PDF)'}
                            </Text>
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

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '---';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return dateStr;
        }
    };

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
                        <View>
                            <Text style={styles.leaveType}>{leave.leaveType}</Text>
                            <Text style={styles.leaveCountSub}>Leave Count: {leave.leaveCount || 0}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status?.bg || Colors.border }]}>
                        {status?.icon}
                        <Text style={[styles.statusText, { color: status?.text || Colors.textSecondary }]}>{status?.label || leave.status}</Text>
                    </View>
                </View>

                <View style={styles.leaveDates}>
                    <View style={styles.dateBlock}>
                        <Text style={styles.dateLabel}>From</Text>
                        <Text style={styles.dateValue}>{formatDateTime(leave.fromDate)}</Text>
                    </View>
                    <View style={styles.dateSeparator}>
                        <Text style={styles.dateSepText}>→</Text>
                    </View>
                    <View style={styles.dateBlock}>
                        <Text style={styles.dateLabel}>To</Text>
                        <Text style={styles.dateValue}>{formatDateTime(leave.toDate)}</Text>
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
    const { leaves, fetchStudentLeaves } = useLeaveStore();
    const { student } = useAuth();
    const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
    const [passVisible, setPassVisible] = useState(false);

    useEffect(() => {
        if (student?.id) {
            fetchStudentLeaves(student.id);
        }
    }, [student?.id]);

    // Leaves from store are already for this student, but filtering just in case
    const studentLeaves = useMemo(() => {
        return leaves.filter(l => l.studentId === student?.id);
    }, [leaves, student?.id]);

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
    leaveCountSub: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '500',
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
