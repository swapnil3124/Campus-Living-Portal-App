import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
    TextInput,
    Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
    Scan,
    LogOut,
    LogIn,
    X,
    History,
    ChevronRight,
    User,
    Clock,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants/config';

const { width } = Dimensions.get('window');

interface LeaveLog {
    _id: string;
    studentName: string;
    studentEnrollment: string;
    hostelName: string;
    roomNo: string;
    branch: string;
    leaveType: string;
    reason: string;
    destination: string;
    outgoingTime: string;
    incomingTime?: string;
    status: 'away' | 'returned';
}

const LeaveEntryScreen = () => {
    const insets = useSafeAreaInsets();
    const { token, watchmanId, subRole } = useAuth() as any;
    
    const [permission, requestPermission] = useCameraPermissions();
    const [scannerVisible, setScannerVisible] = useState(false);
    const [scanMode, setScanMode] = useState<'outgoing' | 'incoming' | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<LeaveLog[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('');
    const [hostelFilter, setHostelFilter] = useState('All');
    const [selectedLog, setSelectedLog] = useState<LeaveLog | null>(null);

    const availableHostels = useMemo(() => {
        const hostels = new Set(logs.map(log => log.hostelName));
        return ['All', ...Array.from(hostels)];
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = 
                log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.studentEnrollment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.roomNo.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesHostel = hostelFilter === 'All' || log.hostelName === hostelFilter;
            
            return matchesSearch && matchesHostel;
        });
    }, [logs, searchQuery, hostelFilter]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        if (!watchmanId) return;
        setRefreshing(true);
        try {
            const response = await fetch(`${API_URL}/leave-entry/logs?watchmanId=${watchmanId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setLogs(data);
            }
        } catch (error) {
            console.error('Fetch logs error:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleBarCodeScanned = async (event: { data: string }) => {
        const { data } = event;
        if (scanned || !data) return;
        
        console.log('Scanned data:', data);
        if (!watchmanId) {
            Alert.alert('Error', 'Watchman session not found. Please relogin.');
            return;
        }

        setScanned(true);
        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        try {
            const endpoint = scanMode === 'outgoing' ? 'scan-outgoing' : 'scan-incoming';
            const response = await fetch(`${API_URL}/leave-entry/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    qrCodeToken: data,
                    watchmanId: watchmanId
                })
            });

            const result = await response.json();

            if (response.ok) {
                Alert.alert(
                    'Success',
                    `${scanMode === 'outgoing' ? 'Outgoing' : 'Incoming'} entry recorded for ${result.record.studentName}`,
                    [{ text: 'OK', onPress: () => {
                        setScannerVisible(false);
                        fetchLogs();
                    }}]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to process scan');
                setScanned(false);
            }
        } catch (error) {
            Alert.alert('Error', 'Connection error. Please check your network.');
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    const openScanner = async (mode: 'outgoing' | 'incoming') => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert('Permission denied', 'Camera access is required.');
                return;
            }
        }
        setScanMode(mode);
        setScannerVisible(true);
        setScanned(false);
    };

    const formatDateTime = (dateStr?: string) => {
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
        <View style={styles.container}>
            <LinearGradient
                colors={['#004d40', Colors.primary]}
                style={[styles.header, { paddingTop: insets.top + 20 }]}
            >
                <Text style={styles.headerTitle}>Leave Entry</Text>
                <Text style={styles.headerSub}>Manage Student Outgoing/Incoming</Text>
            </LinearGradient>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#E65100' }]}
                    onPress={() => openScanner('outgoing')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                        <LogOut size={24} color="#E65100" />
                    </View>
                    <Text style={styles.actionLabel}>Outgoing</Text>
                    <Text style={styles.actionSub}>Scan to Exit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#2E7D32' }]}
                    onPress={() => openScanner('incoming')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                        <LogIn size={24} color="#2E7D32" />
                    </View>
                    <Text style={styles.actionLabel}>Incoming</Text>
                    <Text style={styles.actionSub}>Scan to Enter</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search size={20} color={Colors.textLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Name, Enrollment, Room..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterContent}
                >
                    <Filter size={18} color={Colors.textLight} style={{ marginRight: 8 }} />
                    {availableHostels.map((hostel) => (
                        <TouchableOpacity
                            key={hostel}
                            onPress={() => setHostelFilter(hostel)}
                            style={[
                                styles.filterChip,
                                hostelFilter === hostel && styles.filterChipActive
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                hostelFilter === hostel && styles.filterTextActive
                            ]}>
                                {hostel}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.logsSection}>
                <View style={styles.sectionHeader}>
                    <History size={20} color={Colors.text} />
                    <Text style={styles.sectionTitle}>Entry Logs</Text>
                    <TouchableOpacity onPress={fetchLogs} disabled={refreshing}>
                        <Text style={styles.refreshText}>{refreshing ? '...' : 'Refresh'}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.logsScroll}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {filteredLogs.length === 0 ? (
                        <View style={styles.emptyState}>
                            <AlertCircle size={48} color={Colors.textLight} />
                            <Text style={styles.emptyText}>No matching logs found</Text>
                        </View>
                    ) : (
                        filteredLogs.map((log) => (
                            <TouchableOpacity 
                                key={log._id} 
                                style={styles.logCard} 
                                onPress={() => setSelectedLog(log)}
                            >
                                <View style={styles.logHeader}>
                                    <View>
                                        <Text style={styles.studentName}>{log.studentName}</Text>
                                        <Text style={styles.studentInfo}>{log.studentEnrollment} • {log.hostelName}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: log.status === 'away' ? '#FFF3E0' : '#E8F5E9' }]}>
                                        <Text style={[styles.statusText, { color: log.status === 'away' ? '#E65100' : '#2E7D32' }]}>
                                            {log.status === 'away' ? 'Away' : 'Returned'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.logDetails}>
                                    <View style={styles.detailItem}>
                                        <Clock size={14} color={Colors.textLight} />
                                        <Text style={styles.detailText}>
                                            Out: {formatDateTime(log.outgoingTime)}
                                        </Text>
                                    </View>
                                    {log.incomingTime && (
                                        <View style={styles.detailItem}>
                                            <CheckCircle2 size={14} color="#2E7D32" />
                                            <Text style={styles.detailText}>
                                                In: {formatDateTime(log.incomingTime)}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.detailItem}>
                                        <MapPin size={14} color={Colors.textLight} />
                                        <Text style={styles.detailText} numberOfLines={1}>{log.destination}</Text>
                                    </View>
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.viewDetailText}>Click to view Details</Text>
                                    <ChevronRight size={16} color={Colors.primary} />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* Scan Modal */}
            <Modal visible={scannerVisible} animationType="slide">
                <View style={styles.scannerContainer}>
                    <CameraView
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.scannerOverlay}>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setScannerVisible(false)}
                        >
                            <X size={24} color="white" />
                        </TouchableOpacity>
                        <View style={styles.scanTarget}>
                            <Scan size={60} color="white" strokeWidth={1} />
                        </View>
                        <View style={styles.scanInfo}>
                            <Text style={styles.scanModeText}>
                                {scanMode === 'outgoing' ? 'OUTGOING SCAN' : 'INCOMING SCAN'}
                            </Text>
                            <Text style={styles.scanSubText}>Align student QR code in the frame</Text>
                        </View>
                    </View>
                    {loading && (
                        <View style={styles.scanningLoader}>
                            <ActivityIndicator size="large" color="white" />
                            <Text style={styles.loaderText}>Processing Scan...</Text>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Detail View Modal */}
            <Modal visible={!!selectedLog} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.detailCard}>
                        <View style={styles.detailHeader}>
                            <Text style={styles.detailHeaderTitle}>Entry Details</Text>
                            <TouchableOpacity onPress={() => setSelectedLog(null)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedLog && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Student Information</Text>
                                    <View style={styles.infoRow}>
                                        <User size={18} color={Colors.primary} />
                                        <Text style={styles.infoText}>{selectedLog.studentName}</Text>
                                    </View>
                                    <Text style={styles.infoSubText}>Enrollment: {selectedLog.studentEnrollment}</Text>
                                    <Text style={styles.infoSubText}>Hostel: {selectedLog.hostelName} | Room: {selectedLog.roomNo}</Text>
                                    <Text style={styles.infoSubText}>Branch: {selectedLog.branch}</Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Leave Information</Text>
                                    <View style={styles.badgeRow}>
                                        <View style={styles.typeBadge}>
                                            <Text style={styles.typeBadgeText}>{selectedLog.leaveType}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: selectedLog.status === 'away' ? '#FFF3E0' : '#E8F5E9' }]}>
                                            <Text style={[styles.statusText, { color: selectedLog.status === 'away' ? '#E65100' : '#2E7D32' }]}>
                                                {selectedLog.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.reasonBox}>
                                        <Text style={styles.reasonLabel}>Reason:</Text>
                                        <Text style={styles.reasonText}>{selectedLog.reason}</Text>
                                    </View>

                                    <View style={styles.reasonBox}>
                                        <Text style={styles.reasonLabel}>Destination:</Text>
                                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                            <MapPin size={16} color={Colors.textSecondary} />
                                            <Text style={styles.reasonText}>{selectedLog.destination}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={[styles.detailSection, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.detailLabel}>Timestamps</Text>
                                    <View style={styles.timeRow}>
                                        <LogOut size={18} color="#E65100" />
                                        <View>
                                            <Text style={styles.timeTitle}>Outgoing</Text>
                                            <Text style={styles.timeValue}>{formatDateTime(selectedLog.outgoingTime)}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.timeRow, { marginTop: 12 }]}>
                                        <LogIn size={18} color="#2E7D32" />
                                        <View>
                                            <Text style={styles.timeTitle}>Incoming</Text>
                                            <Text style={styles.timeValue}>
                                                {selectedLog.incomingTime 
                                                    ? formatDateTime(selectedLog.incomingTime)
                                                    : 'Not returned yet'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                        
                        <TouchableOpacity 
                            style={styles.closeBtnLarge} 
                            onPress={() => setSelectedLog(null)}
                        >
                            <Text style={styles.closeBtnText}>Close Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default LeaveEntryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
    },
    headerSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 16,
        marginTop: -30,
        marginBottom: 20,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        borderWidth: 1,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    actionSub: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    searchSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchBar: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 12,
        height: 50,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: Colors.text,
    },
    filterScroll: {
        marginTop: 12,
    },
    filterContent: {
        alignItems: 'center',
        paddingRight: 20,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E9ECEF',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: 'white',
    },
    logsSection: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        flex: 1,
    },
    refreshText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    logsScroll: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyText: {
        marginTop: 12,
        color: Colors.textLight,
        fontSize: 16,
        fontWeight: '600',
    },
    logCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#F1F3F5',
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    studentName: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
    },
    studentInfo: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    logDetails: {
        gap: 10,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailText: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    scannerContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    scannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 60,
        right: 25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanTarget: {
        width: 260,
        height: 260,
        borderWidth: 3,
        borderColor: 'white',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanInfo: {
        marginTop: 50,
        alignItems: 'center',
    },
    scanModeText: {
        color: 'white',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 2,
    },
    scanSubText: {
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
        fontSize: 15,
        fontWeight: '600',
    },
    scanningLoader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderText: {
        color: 'white',
        marginTop: 20,
        fontSize: 18,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    detailCard: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: '85%',
        elevation: 20,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F5',
    },
    detailHeaderTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
    },
    detailSection: {
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F5',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    infoSubText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    typeBadge: {
        backgroundColor: '#E7F5FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    typeBadgeText: {
        color: '#1971C2',
        fontSize: 12,
        fontWeight: '800',
    },
    reasonBox: {
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textLight,
        marginBottom: 6,
    },
    reasonText: {
        fontSize: 15,
        color: Colors.text,
        lineHeight: 22,
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    timeTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textLight,
        textTransform: 'uppercase',
    },
    timeValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 2,
    },
    closeBtnLarge: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    closeBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
});

