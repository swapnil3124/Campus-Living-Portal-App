import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, CheckCircle, Clock, FileText, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useExitStore } from '@/store/exit-store';
import { Asset } from 'expo-asset';

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

export default function StudentHostelExitScreen() {
    const { student } = useAuth();
    const { exits, isLoading, fetchStudentExits, submitExit } = useExitStore();
    
    const [submitting, setSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [reason, setReason] = useState('');

    const [formData, setFormData] = useState(
        assetTypes.map(name => ({ name, count: '1', damagedCount: '0', condition: 'WORKING' }))
    );

    useEffect(() => {
        if (student?.id) {
            fetchStudentExits(student.id);
        }
    }, [student?.id]);

    const updateField = (index: number, key: string, value: any) => {
        const newData = [...formData];
        if (key === 'condition' && value === 'WORKING') {
            newData[index] = { ...newData[index], [key]: value, damagedCount: '0' };
        } else {
            newData[index] = { ...newData[index], [key]: value };
        }
        setFormData(newData);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Incomplete', 'Please provide a reason for exiting the hostel.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Alert.alert(
            'Confirm Exit Request',
            'Are you sure you want to submit your final hostel exit request? This action cannot be revoked without admin assistance.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit', style: 'destructive', onPress: performSubmit }
            ]
        );
    };

    const performSubmit = async () => {
        if (!student) return;
        setSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const success = await submitExit({
            studentId: student.id,
            studentName: student.name,
            enrollmentNo: student.enrollmentNo,
            hostelName: student.hostelName,
            roomNo: student.roomNo,
            bedNumber: student.bedNumber,
            exitDate: new Date().toISOString(),
            reason,
            exitAssets: formData.map(item => ({
                name: item.name,
                count: parseInt(item.count) || 0,
                damagedCount: item.condition === 'DAMAGED' ? (parseInt(item.damagedCount) || 0) : 0,
                condition: item.condition
            })),
            status: 'pending'
        });

        setSubmitting(false);

        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowForm(false);
            Alert.alert('Success', 'Your Hostel Exit request has been submitted to the Warden.');
            if (student.id) fetchStudentExits(student.id);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to submit exit request.');
        }
    };

    const generateExitPDF = async (exitReq: any) => {
        try {
            setIsGenerating(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

            const issuedDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

            const assetRows = exitReq.exitAssets?.map((a: any) => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #E0F2F1;">${a.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #E0F2F1;">${a.count}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #E0F2F1;">
                        <span style="color: ${a.condition === 'WORKING' ? '#2E7D32' : '#C62828'}; font-weight: bold;">
                            ${a.condition}
                        </span>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #E0F2F1;">
                        <span style="color: ${a.damagedCount > 0 ? '#C62828' : '#888'};">
                            ${a.damagedCount}
                        </span>
                    </td>
                </tr>
            `).join('') || '';

            const html = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8"/>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00897B; padding-bottom: 20px; }
              .header h1 { color: #00897B; letter-spacing: 2px; margin: 0; }
              .header p { fontSize: 13px; color: #666; margin-top: 5px; }
              .title { text-align: center; font-size: 20px; font-weight: bold; background: #E0F2F1; padding: 10px; margin-bottom: 30px; border-radius: 8px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info-item label { color: #888; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px; }
              .info-item span { font-size: 15px; font-weight: bold; color: #111; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #E0F2F1; }
              .table th { background: #F5FFFE; color: #00897B; text-align: left; padding: 12px; font-size: 12px; }
              .remark-box { background: #F9FAFB; border-left: 4px solid #F59E0B; padding: 15px; margin-bottom: 40px; }
              .sig-section { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; border-top: 1px dashed #ccc; }
              .sig-box { text-align: center; width: 200px; }
              .verified { color: #2E7D32; font-weight: bold; }
            </style>
            </head>
            <body>
                <div class="header">
                    <h1>GOVERNMENT POLYTECHNIC AWASARI (KH)</h1>
                    <p>Official Campus Living Portal • Hostel Exit Document</p>
                </div>

                <div class="title">HOSTEL CLEARANCE & EXIT CERTIFICATE</div>

                <div class="info-grid">
                    <div class="info-item"><label>Student Name</label><span>${exitReq.studentName}</span></div>
                    <div class="info-item"><label>Enrollment No</label><span>${exitReq.enrollmentNo}</span></div>
                    <div class="info-item"><label>Hostel Allocated</label><span>${exitReq.hostelName}</span></div>
                    <div class="info-item"><label>Room & Bed</label><span>Room ${exitReq.roomNo} - Bed ${exitReq.bedNumber}</span></div>
                    <div class="info-item"><label>Exit Approved Date</label><span>${new Date(exitReq.exitDate).toLocaleDateString()}</span></div>
                    <div class="info-item"><label>Status</label><span class="verified">✅ OFFICIAL APPROVED</span></div>
                </div>

                <h3 style="color:#00897B; font-size: 14px; text-transform: uppercase; margin-bottom: 10px;">Submitted Assets Condition</h3>
                <table class="table">
                    <thead><tr><th>ASSET NAME</th><th>TOTAL QTY</th><th>CONDITION</th><th>DAMAGED QTY</th></tr></thead>
                    <tbody>${assetRows}</tbody>
                </table>

                <div class="remark-box">
                    <label style="color:#F59E0B; font-size: 11px; font-weight:bold;">WARDEN FINAL REMARK:</label>
                    <p style="margin-top: 5px; font-size: 14px;">${exitReq.wardenRemark || 'Clearance accepted without additional remarks.'}</p>
                </div>

                <div class="sig-section">
                    <div class="sig-box">
                        <div style="height: 60px;"></div>
                        <p style="font-weight: bold; margin: 0;">Student Signature</p>
                        <p style="font-size: 12px; color: #888;">${exitReq.studentName}</p>
                    </div>
                    <div class="sig-box">
                        ${signatureBase64 ? `<img src="${signatureBase64}" style="height: 50px; object-fit: contain;"/>` : '<div style="height:50px;"></div>'}
                        <p style="font-weight: bold; margin: 0;">Warden Authorised</p>
                        <p style="font-size: 12px; color: #888;">Digital Signature Verified</p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #aaa;">
                    Document generated on ${issuedDate}. This is a system-generated document and is valid for final hostel clearance.
                </div>
            </body>
            </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            
            const fileName = `HostelExit_${exitReq.enrollmentNo}.pdf`;
            const destPath = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.moveAsync({ from: uri, to: destPath });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(destPath, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Save Hostel Exit Doc',
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('Saved', `Document saved to:\n${destPath}`);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not generate document.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading && exits.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const latestExit = exits.length > 0 ? exits[0] : null;

    if (!showForm && latestExit) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
                    <LogOut size={32} color={Colors.white} />
                    <Text style={styles.headerTitle}>Hostel Exit Status</Text>
                </LinearGradient>
                
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.statusRow}>
                            <View>
                                <Text style={styles.statusLabel}>Current Status</Text>
                                <Text style={[
                                    styles.statusValue, 
                                    { color: latestExit.status === 'approved' ? Colors.success : latestExit.status === 'rejected' ? Colors.error : Colors.warning }
                                ]}>
                                    {latestExit.status.toUpperCase()}
                                </Text>
                            </View>
                            {latestExit.status === 'approved' && <CheckCircle size={32} color={Colors.success} />}
                            {latestExit.status === 'pending' && <Clock size={32} color={Colors.warning} />}
                            {latestExit.status === 'rejected' && <X size={32} color={Colors.error} />}
                        </View>

                        <View style={styles.divider} />
                        
                        <View style={styles.infoRow}><Text style={styles.infoLabel}>Applied On:</Text><Text style={styles.infoVal}>{new Date(latestExit.createdAt).toLocaleDateString()}</Text></View>
                        <View style={styles.infoRow}><Text style={styles.infoLabel}>Reason:</Text><Text style={styles.infoVal}>{latestExit.reason}</Text></View>
                        {latestExit.wardenRemark ? (
                            <View style={styles.remarkBox}>
                                <Text style={styles.remarkLabel}>Warden Remark:</Text>
                                <Text style={styles.remarkText}>{latestExit.wardenRemark}</Text>
                            </View>
                        ) : null}

                        {latestExit.status === 'approved' && (
                            <TouchableOpacity style={styles.downloadBtn} onPress={() => generateExitPDF(latestExit)} disabled={isGenerating}>
                                {isGenerating ? <ActivityIndicator color={Colors.white} /> : <FileText color={Colors.white} size={20} />}
                                <Text style={styles.downloadText}>{isGenerating ? 'Generating...' : 'Download Exit Document'}</Text>
                            </TouchableOpacity>
                        )}

                        {latestExit.status === 'rejected' && (
                            <TouchableOpacity style={styles.reapplyBtn} onPress={() => setShowForm(true)}>
                                <Text style={styles.reapplyText}>Submit New Request</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
                <LogOut size={32} color={Colors.white} />
                <Text style={styles.headerTitle}>Hostel Exit Request</Text>
                <Text style={styles.headerSub}>Final Asset Clearance Process</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Asset Handover Condition</Text>
                    <Text style={styles.sectionSub}>Please rate the condition of the items in your room upon departure. The warden will verify these.</Text>
                    
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
                                        placeholderTextColor={Colors.textLight}
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
                                        placeholderTextColor={Colors.textLight}
                                        placeholder="0"
                                        editable={item.condition === 'DAMAGED'}
                                    />
                                </View>
                            </View>
                        </View>
                    ))}

                    <View style={[styles.divider, {marginTop: 10}]} />

                    <Text style={styles.sectionTitle}>Reason for Exit</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Why are you leaving the hostel? e.g. Course completed, Shifted to PG etc."
                        placeholderTextColor={Colors.textLight}
                        multiline
                        numberOfLines={3}
                        value={reason}
                        onChangeText={setReason}
                    />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <LogOut size={20} color="#FFF" />
                                <Text style={styles.submitText}>Submit Exit Request</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {exits.length > 0 && (
                        <TouchableOpacity style={{marginTop: 16, alignItems: 'center'}} onPress={() => setShowForm(false)}>
                            <Text style={{color: Colors.textSecondary, fontWeight: 'bold'}}>Cancel & View Status</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={{height:30}}/>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { padding: 30, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 10 },
    headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
    content: { padding: 16, marginTop: -30 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width:0, height:4 }, elevation: 5 },
    
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusLabel: { fontSize: 13, color: Colors.textLight, textTransform: 'uppercase', fontWeight: 'bold' },
    statusValue: { fontSize: 26, fontWeight: '900', marginTop: 4 },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    infoLabel: { color: Colors.textSecondary, fontWeight: '600' },
    infoVal: { color: Colors.text, fontWeight: '800' },
    remarkBox: { backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#F59E0B', padding: 12, borderRadius: 8, marginTop: 10 },
    remarkLabel: { fontSize: 11, color: '#F59E0B', fontWeight: 'bold', textTransform: 'uppercase' },
    remarkText: { color: '#333', marginTop: 4, fontWeight: '500' },
    downloadBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 24, gap: 10 },
    downloadText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    reapplyBtn: { borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 24 },
    reapplyText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
    
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    sectionSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16, lineHeight: 18 },
    
    formItem: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    fieldLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12 },
    fieldRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    countInput: { width: 60, height: 40, backgroundColor: '#F8FAFC', color: Colors.text, borderRadius: 8, paddingHorizontal: 8, fontSize: 14, fontWeight: '600', borderWidth: 1, borderColor: '#E2E8F0', textAlign: 'center' },
    disabledInput: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', color: '#CBD5E1', opacity: 0.5 },
    inputStack: { alignItems: 'center', gap: 6 },
    toggleStack: { flex: 1, alignItems: 'center', gap: 6 },
    stackLabel: { fontSize: 9, fontWeight: '800', color: Colors.textLight, letterSpacing: 0.5 },
    conditionToggle: { width: '100%', flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#E2E8F0' },
    toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7 },
    workingActive: { backgroundColor: Colors.successLight },
    damagedActive: { backgroundColor: Colors.warningLight },
    toggleText: { fontSize: 11, fontWeight: '700', color: Colors.textLight },
    activeText: { color: Colors.text },

    textArea: { backgroundColor: '#F8FAFC', color: Colors.text, borderRadius: 12, padding: 16, minHeight: 80, textAlignVertical: 'top', borderWidth: 1.5, borderColor: '#E2E8F0', fontSize: 15, marginBottom: 16 },
    
    submitBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10, marginTop: 10 },
    submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
