import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    BedDouble,
    Users,
    Package,
    CircleCheck as CheckCircle2,
    AlertTriangle,
    CircleX as XCircle,
    Plus,
    Save,
    X,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

import { API_URL } from '@/constants/config';

const assetTypes = [
    "Total Tube Lights",
    "Total Fans",
    "Total Chairs",
    "Total Study Tables",
    "Total Electric Boards",
    "Window Glass Condition",
    "Cupboard Condition",
    "Room Door Condition",
    "Bed Details"
];

const assetStatusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    WORKING: { icon: <CheckCircle2 size={14} color={Colors.success} />, color: Colors.success, bg: Colors.successLight },
    DAMAGED: { icon: <AlertTriangle size={14} color={Colors.warning} />, color: '#E65100', bg: Colors.warningLight },
};


export default function RoomScreen() {
    const { student } = useAuth();
    const [isModalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [assetReport, setAssetReport] = useState<any>(null);
    const [roommates, setRoommates] = useState<any[]>([]);
    const [formData, setFormData] = useState(
        assetTypes.map(name => ({ name, count: '1', damagedCount: '0', condition: 'WORKING' }))
    );

    const cardAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

    const fetchAssets = useCallback(async () => {
        if (!student?.roomNo || !student?.id || !student?.hostelName) return;
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/rooms/assets?roomNumber=${student.roomNo}&studentId=${student.id}&hostelName=${encodeURIComponent(student.hostelName)}`);
            const data = await response.json();
            if (data && data.items) {
                setAssetReport(data);
                // Pre-fill form with existing data if needed
                const syncedForm = assetTypes.map(name => {
                    const existing = data.items.find((i: any) => i.name === name);
                    return {
                        name,
                        count: existing ? String(existing.count) : '1',
                        damagedCount: existing ? String(existing.damagedCount || 0) : '0',
                        condition: existing ? existing.condition : 'WORKING'
                    };
                });
                setFormData(syncedForm);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    }, [student]);

    const fetchRoommates = useCallback(async () => {
        if (!student?.roomNo || !student?.id || !student?.hostelName) return;
        try {
            const response = await fetch(`${API_URL}/rooms/roommates?roomNumber=${student.roomNo}&studentId=${student.id}&hostelName=${encodeURIComponent(student.hostelName)}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setRoommates(data);
            }
        } catch (error) {
            console.error('Error fetching roommates:', error);
        }
    }, [student]);

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchAssets(), fetchRoommates()]);
            setLoading(false);
        };
        loadAllData();
        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 450,
                delay: 100 + i * 120,
                useNativeDriver: true,
            }).start();
        });
    }, [fetchAssets]);

    const handleSubmit = async () => {
        if (!student?.roomNo || !student?.id || !student?.hostelName) return;
        
        try {
            setSubmitting(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            const payload = {
                roomNumber: student.roomNo,
                studentId: student.id,
                hostelName: student.hostelName,
                items: formData.map(item => ({
                    ...item,
                    count: parseInt(item.count) || 0,
                    damagedCount: item.condition === 'DAMAGED' ? (parseInt(item.damagedCount) || 0) : 0
                }))
            };

            const response = await fetch(`${API_URL}/rooms/assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                setAssetReport(data.report);
                setModalVisible(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Asset details submitted successfully.');
            } else {
                Alert.alert('Error', 'Failed to submit details.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateField = (index: number, key: string, value: any) => {
        const newData = [...formData];
        if (key === 'condition' && value === 'WORKING') {
            newData[index] = { ...newData[index], [key]: value, damagedCount: '0' };
        } else {
            newData[index] = { ...newData[index], [key]: value };
        }
        setFormData(newData);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Room Details Card */}
            <Animated.View style={[styles.card, { opacity: cardAnims[0], transform: [{ translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <BedDouble size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Room Details</Text>
                </View>
                <LinearGradient colors={[Colors.primaryGhost, '#F5F5F5']} style={styles.roomInfo}>
                    <View style={styles.roomGrid}>
                        <View style={styles.roomStat}>
                            <Text style={styles.roomStatLabel}>Hostel</Text>
                            <Text style={styles.roomStatValue}>{student?.hostelName ?? '-'}</Text>
                        </View>
                        <View style={styles.roomStat}>
                            <Text style={styles.roomStatLabel}>Room No</Text>
                            <Text style={styles.roomStatValue}>{student?.roomNo ?? '-'}</Text>
                        </View>
                        <View style={styles.roomStat}>
                            <Text style={styles.roomStatLabel}>Floor</Text>
                            <Text style={styles.roomStatValue}>{student?.floor ?? '-'}</Text>
                        </View>
                        <View style={styles.roomStat}>
                            <Text style={styles.roomStatLabel}>Bed</Text>
                            <Text style={styles.roomStatValue}>{student?.bedNumber ?? '-'}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Roommates Card */}
            <Animated.View style={[styles.card, { opacity: cardAnims[1], transform: [{ translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <Users size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Roommates</Text>
                </View>
                {roommates.length > 0 ? (
                    roommates.map((mate, index) => (
                        <View key={index} style={[styles.mateRow, index < roommates.length - 1 && styles.mateBorder]}>
                            <View style={styles.mateAvatar}>
                                <Text style={styles.mateInitial}>{mate.name ? mate.name[0] : 'U'}</Text>
                            </View>
                            <View style={styles.mateInfo}>
                                <Text style={styles.mateName}>{mate.name}</Text>
                                <Text style={styles.mateBranch}>{mate.branch} • {mate.year}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyMates}>
                        <Users size={24} color={Colors.textLight} />
                        <Text style={styles.emptyMatesText}>No roommates found</Text>
                    </View>
                )}
            </Animated.View>

            {/* Room Assets Card */}
            <Animated.View style={[styles.card, { opacity: cardAnims[2], transform: [{ translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.cardHeader}>
                    <Package size={18} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Room Assets</Text>
                </View>
                
                {assetReport ? (
                    <>
                        {assetReport.items.map((asset: any, index: number) => {
                            const config = assetStatusConfig[asset.condition];
                            return (
                                <View key={index} style={[styles.assetRow, index < assetReport.items.length - 1 && styles.assetBorder]}>
                                    <View>
                                        <Text style={styles.assetName}>{asset.name}</Text>
                                        <Text style={styles.assetCount}>
                                            Total: {asset.count} {asset.damagedCount > 0 && `(Damaged: ${asset.damagedCount})`}
                                        </Text>
                                    </View>
                                    <View style={[styles.assetStatus, { backgroundColor: config?.bg || Colors.border }]}>
                                        {config?.icon}
                                        <Text style={[styles.assetStatusText, { color: config?.color || Colors.textSecondary }]}>
                                            {asset.condition}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                        <TouchableOpacity style={styles.editBtn} onPress={() => setModalVisible(true)}>
                            <Plus size={16} color={Colors.primary} />
                            <Text style={styles.editBtnText}>Update Asset Details</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <Package size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>No asset details filled yet</Text>
                        <TouchableOpacity style={styles.fillBtn} onPress={() => setModalVisible(true)}>
                            <Plus size={18} color={Colors.white} />
                            <Text style={styles.fillBtnText}>Fill the asset details</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            {/* Asset Detail Form Modal */}
            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Room Assets Declaration</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                            {formData.map((item, index) => (
                                <View key={index} style={styles.formItem}>
                                    <Text style={styles.fieldLabel}>{item.name}</Text>
                                    <View style={styles.fieldRow}>
                                        <View style={styles.inputStack}>
                                            <Text style={styles.stackLabel}>TOTAL</Text>
                                            <TextInput
                                                style={styles.countInput}
                                                value={item.count}
                                                onChangeText={(val) => updateField(index, 'count', val)}
                                                keyboardType="numeric"
                                                placeholder="0"
                                            />
                                        </View>

                                        <View style={styles.toggleStack}>
                                            <Text style={styles.stackLabel}>CONDITION</Text>
                                            <View style={styles.conditionToggle}>
                                                <TouchableOpacity 
                                                    style={[styles.toggleBtn, item.condition === 'WORKING' && styles.workingActive]}
                                                    onPress={() => updateField(index, 'condition', 'WORKING')}
                                                >
                                                    <Text style={[styles.toggleText, item.condition === 'WORKING' && styles.activeText]}>WORKING</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    style={[styles.toggleBtn, item.condition === 'DAMAGED' && styles.damagedActive]}
                                                    onPress={() => updateField(index, 'condition', 'DAMAGED')}
                                                >
                                                    <Text style={[styles.toggleText, item.condition === 'DAMAGED' && styles.activeText]}>DAMAGED</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.inputStack}>
                                            <Text style={styles.stackLabel}>DAMAGED</Text>
                                            <TextInput
                                                style={[
                                                    styles.countInput, 
                                                    item.condition === 'WORKING' && styles.disabledInput
                                                ]}
                                                value={item.damagedCount}
                                                onChangeText={(val) => updateField(index, 'damagedCount', val)}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                editable={item.condition === 'DAMAGED'}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity 
                            style={[styles.saveBtn, submitting && styles.disabledBtn]} 
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <>
                                    <Save size={18} color={Colors.white} />
                                    <Text style={styles.saveBtnText}>Save Details</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 16,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    roomInfo: {
        borderRadius: 14,
        padding: 16,
    },
    roomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    roomStat: {
        width: '46%' as any,
        flexGrow: 1,
    },
    roomStatLabel: {
        fontSize: 11,
        color: Colors.textLight,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    roomStatValue: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.primaryDark,
    },
    mateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    mateBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    mateAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    mateInitial: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.primaryDark,
    },
    mateInfo: {
        flex: 1,
    },
    mateName: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    mateBranch: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    assetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    assetBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    assetName: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    assetCount: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    assetStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    assetStatusText: {
        fontSize: 11,
        fontWeight: '700' as const,
        textTransform: 'uppercase' as const,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
        marginBottom: 20,
    },
    fillBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    fillBtnText: {
        color: Colors.white,
        fontWeight: '700' as const,
        fontSize: 15,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
        gap: 6,
    },
    editBtnText: {
        color: Colors.primary,
        fontWeight: '600' as const,
        fontSize: 13,
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
        height: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800' as const,
        color: Colors.text,
    },
    formScroll: {
        flex: 1,
    },
    formItem: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    fieldRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    countInput: {
        width: 60,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        paddingHorizontal: 8,
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        textAlign: 'center',
    },
    disabledInput: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
        color: '#CBD5E1',
        opacity: 0.5,
    },
    inputStack: {
        alignItems: 'center',
        gap: 6,
    },
    toggleStack: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    stackLabel: {
        fontSize: 9,
        fontWeight: '800' as const,
        color: Colors.textLight,
        letterSpacing: 0.5,
    },
    conditionToggle: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 7,
    },
    workingActive: {
        backgroundColor: Colors.successLight,
    },
    damagedActive: {
        backgroundColor: Colors.warningLight,
    },
    toggleText: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.textLight,
    },
    activeText: {
        color: Colors.text,
    },
    emptyMates: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyMatesText: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500' as const,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
        marginTop: 20,
    },
    saveBtnText: {
        color: Colors.white,
        fontWeight: '700' as const,
        fontSize: 16,
    },
    disabledBtn: {
        opacity: 0.6,
    }
});

