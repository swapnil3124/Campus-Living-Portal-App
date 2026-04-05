import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, Modal, ScrollView, TextInput, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, ChevronLeft, CalendarDays, CheckCircle, XCircle, Search, ClipboardList, LogOut, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useExitStore } from '@/store/exit-store';
import { API_URL } from '@/constants/config';
import { HostelExit } from '@/constants/types';

export default function WardenHostelExitScreen() {
    const { subRole } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { exits, isLoading, fetchWardenExits, updateExitStatus } = useExitStore();
    
    const [selectedExit, setSelectedExit] = useState<HostelExit | null>(null);
    const [wardenRemark, setWardenRemark] = useState('');
    const [updating, setUpdating] = useState(false);
    const [originalAssets, setOriginalAssets] = useState<any>(null);
    const [fetchingAssets, setFetchingAssets] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (typeof subRole === 'string') {
                fetchWardenExits(subRole);
            }
        }, [subRole])
    );

    const handleSelectExit = async (exit: HostelExit) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedExit(exit);
        setWardenRemark(exit.wardenRemark || '');

        setFetchingAssets(true);
        try {
            const resp = await fetch(`${API_URL}/rooms/assets?roomNumber=${exit.roomNo}&hostelName=${encodeURIComponent(exit.hostelName)}`);
            if (resp.ok) {
                const data = await resp.json();
                setOriginalAssets(data?.items || []);
            } else {
                setOriginalAssets([]);
            }
        } catch (error) {
            console.error('Fetch original assets err:', error);
            setOriginalAssets([]);
        } finally {
            setFetchingAssets(false);
        }
    };

    const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
        if (!selectedExit) return;

        if (status === 'rejected' && (!wardenRemark || wardenRemark.trim() === '')) {
            Alert.alert('Remark Required', 'Please provide a remark for why the exit is being rejected.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        if (status === 'approved' && selectedExit.status === 'rejected' && (!wardenRemark || wardenRemark.trim() === '')) {
            Alert.alert('Remark Required', 'Please provide a remark stating the issue was resolved (e.g. fine paid) before approving.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        Alert.alert(
            `Confirm ${status.toUpperCase()}`,
            `Are you sure you want to mark this exit request as ${status}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: status === 'rejected' ? 'destructive' : 'default',
                    onPress: async () => {
                        setUpdating(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const success = await updateExitStatus(selectedExit._id, status, wardenRemark);
                        setUpdating(false);
                        
                        if (success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setSelectedExit(null);
                        } else {
                            Alert.alert('Error', 'Could not update status');
                        }
                    }
                }
            ]
        );
    };

    const renderExitItem = ({ item }: { item: HostelExit }) => (
        <TouchableOpacity 
            style={[styles.card, item.status === 'pending' && { borderLeftWidth: 4, borderLeftColor: Colors.warning }]} 
            onPress={() => handleSelectExit(item)}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.studentName}>{item.studentName}</Text>
                    <Text style={styles.enrollment}>{item.enrollmentNo}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'approved' ? '#E8F5E9' : item.status === 'rejected' ? '#FFEBEE' : '#FFF8E1' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'approved' ? Colors.success : item.status === 'rejected' ? Colors.error : Colors.warning }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardInfoRow}>
                <Text style={styles.roomNo}>Room {item.roomNo} - Bed {item.bedNumber}</Text>
                <Text style={styles.exitDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hostel Exit Requests</Text>
            </LinearGradient>

            {isLoading && exits.length === 0 ? (
                <View style={[styles.center, { flex: 1 }]}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={exits}
                    keyExtractor={item => item._id}
                    renderItem={renderExitItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={() => subRole ? fetchWardenExits(subRole as string) : null} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <ClipboardList size={40} color={Colors.textLight} />
                            <Text style={styles.emptyText}>No exit requests found for this hostel.</Text>
                        </View>
                    }
                />
            )}

            {/* Verification Modal */}
            <Modal visible={!!selectedExit} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Exit Verification</Text>
                            <TouchableOpacity onPress={() => setSelectedExit(null)}><XCircle size={24} color={Colors.textLight} /></TouchableOpacity>
                        </View>

                        {selectedExit && (
                            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Student Details</Text>
                                    <Text style={styles.detailText}><Text style={styles.bold}>Name:</Text> {selectedExit.studentName}</Text>
                                    <Text style={styles.detailText}><Text style={styles.bold}>Enrollment:</Text> {selectedExit.enrollmentNo}</Text>
                                    <Text style={styles.detailText}><Text style={styles.bold}>Room & Bed:</Text> {selectedExit.roomNo} - {selectedExit.bedNumber}</Text>
                                    <Text style={styles.detailText}><Text style={styles.bold}>Reason:</Text> {selectedExit.reason}</Text>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Asset Verification</Text>
                                    {fetchingAssets ? (
                                        <ActivityIndicator color={Colors.primary} />
                                    ) : (
                                        <View style={styles.assetTable}>
                                            <View style={styles.assetRowHeader}>
                                                <Text style={styles.assetCol}>Item</Text>
                                                <Text style={styles.assetCol}>Original</Text>
                                                <Text style={styles.assetCol}>Exit Condition</Text>
                                            </View>
                                            {selectedExit.exitAssets.map((asset, i) => {
                                                const original = originalAssets?.find((o: any) => o.name === asset.name);
                                                const originalText = original ? `Total: ${original.count}\nDmg: ${original.damagedCount}` : 'N/A';
                                                
                                                return (
                                                    <View key={i} style={styles.assetRow}>
                                                        <Text style={[styles.assetColText, {flex: 1.2, fontWeight: '700'}]}>{asset.name}</Text>
                                                        <Text style={[styles.assetColText, { color: Colors.textSecondary }]}>{originalText}</Text>
                                                        <View style={{flex: 1}}>
                                                            <Text style={{fontSize: 12, color: asset.condition === 'WORKING' ? Colors.success : Colors.error, fontWeight: 'bold'}}>
                                                                {asset.condition}
                                                            </Text>
                                                            <Text style={{fontSize: 11, color: Colors.textSecondary}}>
                                                                Total: {asset.count} {"\n"}Dmg: <Text style={{color: asset.damagedCount > 0 ? Colors.error : Colors.text}}>{asset.damagedCount}</Text>
                                                            </Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>

                                {selectedExit.status !== 'approved' && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Warden Remark <Text style={{color: Colors.error}}>*</Text></Text>
                                        <TextInput
                                            style={styles.remarkInput}
                                            placeholder="Add remarks about deductions, damages or clearances..."
                                            value={wardenRemark}
                                            onChangeText={setWardenRemark}
                                            multiline
                                        />
                                    </View>
                                )}

                                {selectedExit.status === 'pending' ? (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleUpdateStatus('rejected')} disabled={updating}>
                                            <Text style={styles.rejectBtnText}>Reject Exit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleUpdateStatus('approved')} disabled={updating}>
                                            <Text style={styles.approveBtnText}>Approve & Clear</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : selectedExit.status === 'rejected' ? (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn, { backgroundColor: Colors.warning }]} onPress={() => handleUpdateStatus('approved')} disabled={updating}>
                                            <Text style={styles.approveBtnText}>Issue Clear & Approve</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.completedBox}>
                                        <CheckCircle2 size={24} color={selectedExit.status === 'approved' ? Colors.success : Colors.error} />
                                        <Text style={{color: Colors.text, fontWeight: 'bold', marginLeft: 10}}>This request has been {selectedExit.status.toUpperCase()}!</Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingBottom: 25, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginLeft: 15 },
    listContent: { padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    studentName: { fontSize: 16, fontWeight: '800', color: Colors.text },
    enrollment: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '800' },
    cardInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    roomNo: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
    exitDate: { fontSize: 12, color: Colors.textLight },
    reasonText: { fontSize: 13, color: Colors.textSecondary },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textLight, marginTop: 10 },
    
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    modalScroll: { padding: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', marginBottom: 10 },
    detailText: { fontSize: 14, color: Colors.text, marginBottom: 6, lineHeight: 22 },
    bold: { fontWeight: '700' },
    
    assetTable: { backgroundColor: '#F8FAFC', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
    assetRowHeader: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    assetRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' },
    assetCol: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
    assetColText: { flex: 1, fontSize: 12, color: Colors.text },
    
    remarkInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 15, minHeight: 100, textAlignVertical: 'top' },
    
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
    actionBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rejectBtn: { backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.error },
    approveBtn: { backgroundColor: Colors.success },
    rejectBtnText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
    approveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    completedBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 40 }
});
