import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Dimensions,
    Platform,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    UtensilsCrossed,
    CreditCard,
    MessageSquare,
    Save,
    FileText,
    Upload,
    Star,
    X,
    Image as ImageIcon,
    Download,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants/config';

const { width } = Dimensions.get('window');

type TabType = 'menu' | 'fees' | 'feedback';

export default function MessManagementScreen() {
    const { watchmanId, subRole } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('menu');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Menu & Fees State
    const [menuFile, setMenuFile] = useState<any>(null);
    const [paymentQr, setPaymentQr] = useState<any>(null);
    const [fees, setFees] = useState('');
    
    // Existing URLs from server
    const [currentMenuUrl, setCurrentMenuUrl] = useState('');
    const [currentQrUrl, setCurrentQrUrl] = useState('');

    // Feedback State
    const [stats, setStats] = useState<any>(null);
    const [feedback, setFeedback] = useState<any[]>([]);

    // Viewer states
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string | null>(null);
    const [viewerType, setViewerType] = useState<'image' | 'pdf' | 'other'>('image');
    const [viewerName, setViewerName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setFetching(true);
            const hType = (subRole || 'boys').toLowerCase();
            const [menuRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/mess/menu?hostelType=${hType}`),
                fetch(`${API_URL}/mess/stats?hostelType=${hType}`)
            ]);
            
            const menuData = await menuRes.json();
            if (menuData) {
                setFees(menuData.fees || '');
                setCurrentMenuUrl(menuData.menuFileUrl || '');
                setCurrentQrUrl(menuData.paymentQrUrl || '');
            }

            const statsData = await statsRes.json();
            if (statsData) {
                setStats(statsData.stats);
                setFeedback(statsData.feedback || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleOpenViewer = (url: string, name: string) => {
        if (!url) return;
        const isPdf = url.toLowerCase().endsWith('.pdf');
        setViewerUri(url);
        setViewerName(name);
        setViewerType(isPdf ? 'pdf' : 'image');
        setViewerVisible(true);
    };

    const handleDownload = async () => {
        if (!viewerUri) return;
        try {
            const extension = viewerType === 'pdf' ? '.pdf' : '.jpg';
            const fileUri = FileSystem.cacheDirectory + `Mess_${viewerName.replace(/\s+/g, '_')}_${Date.now()}${extension}`;
            const downloadRes = await FileSystem.downloadAsync(viewerUri, fileUri);
            if (downloadRes.status === 200) {
                await Sharing.shareAsync(fileUri);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not download file');
        }
    };

    const handlePickMenu = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
            });
            if (!result.canceled) {
                setMenuFile(result.assets[0]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (err) {
            console.error('Document picking error:', err);
        }
    };

    const handlePickQr = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setPaymentQr(result.assets[0]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (err) {
            console.error('Image picking error:', err);
        }
    };

    const handleUpdate = async () => {
        if (!fees) {
            Alert.alert('Required', 'Please enter the monthly mess fees');
            return;
        }

        setLoading(true);
        try {
            const hType = (subRole || 'boys').toLowerCase();
            const formData = new FormData();
            formData.append('hostelType', hType);
            formData.append('fees', fees);
            formData.append('contractorId', watchmanId || '');

            if (menuFile) {
                formData.append('menuFile', {
                    uri: Platform.OS === 'android' ? menuFile.uri : menuFile.uri.replace('file://', ''),
                    name: menuFile.name || 'menu_file',
                    type: menuFile.mimeType || 'image/jpeg',
                } as any);
            }

            if (paymentQr) {
                formData.append('paymentQr', {
                    uri: Platform.OS === 'android' ? paymentQr.uri : paymentQr.uri.replace('file://', ''),
                    name: paymentQr.fileName || 'payment_qr.jpg',
                    type: paymentQr.mimeType || 'image/jpeg',
                } as any);
            }

            const response = await fetch(`${API_URL}/mess/menu/update`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Mess details updated successfully');
                setMenuFile(null);
                setPaymentQr(null);
                fetchData();
            } else {
                Alert.alert('Error', data.error || 'Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    const renderMenuTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <UtensilsCrossed size={20} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Mess Circular / Menu</Text>
                </View>
                <Text style={styles.cardSub}>Upload the physical menu photo or a official circular PDF</Text>
                
                <TouchableOpacity style={styles.uploadBox} onPress={handlePickMenu}>
                    {menuFile ? (
                        <View style={styles.selectedFile}>
                            <FileText size={40} color={Colors.primary} />
                            <Text style={styles.fileName} numberOfLines={1}>{menuFile.name}</Text>
                            <TouchableOpacity onPress={() => setMenuFile(null)} style={styles.removeFile}>
                                <X size={16} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Upload size={32} color={Colors.textLight} />
                            <Text style={styles.uploadText}>Tap to Select Menu File</Text>
                            <Text style={styles.uploadHint}>Supports Images & PDF</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {currentMenuUrl && !menuFile && (
                    <View style={styles.previewSection}>
                        <Text style={styles.previewTitle}>Currently Active Menu</Text>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => handleOpenViewer(currentMenuUrl, 'Current Menu')}>
                            <Image source={{ uri: currentMenuUrl }} style={styles.menuPreview} contentFit="contain" />
                            <Text style={styles.tapHint}>Tap to view full screen</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Publish Menu</Text>}
            </TouchableOpacity>
        </ScrollView>
    );

    const renderFeesTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <CreditCard size={20} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Payment Settings</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Monthly Mess Fees (₹)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 2500"
                        keyboardType="numeric"
                        value={fees}
                        onChangeText={setFees}
                    />
                </View>

                <Text style={styles.inputLabel}>Payment QR Image</Text>
                <TouchableOpacity 
                    style={[styles.uploadBox, { height: 180 }]} 
                    onPress={paymentQr || currentQrUrl ? () => handleOpenViewer(paymentQr?.uri || currentQrUrl, 'Payment QR') : handlePickQr}
                >
                    {paymentQr ? (
                        <Image source={{ uri: paymentQr.uri }} style={styles.fullPreview} contentFit="contain" />
                    ) : currentQrUrl ? (
                         <Image source={{ uri: currentQrUrl }} style={styles.fullPreview} contentFit="contain" />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <ImageIcon size={32} color={Colors.textLight} />
                            <Text style={styles.uploadText}>Select QR Image</Text>
                        </View>
                    )}
                </TouchableOpacity>
                {(paymentQr || currentQrUrl) && (
                    <TouchableOpacity onPress={handlePickQr} style={{ alignSelf: 'center', marginTop: 10 }}>
                        <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>Change Image</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Update Fees & QR</Text>}
            </TouchableOpacity>
        </ScrollView>
    );

    const renderFeedbackTab = () => (
        <ScrollView style={styles.tabContent}>
            {/* Overall Aggregate Stats */}
            {stats && (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Star size={20} color="#FBC02D" />
                        <Text style={styles.cardTitle}>Average Ratings</Text>
                    </View>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statVal}>{stats.breakfast.avg}</Text>
                            <Text style={styles.statLabel}>Breakfast</Text>
                        </View>
                        <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' }]}>
                            <Text style={styles.statVal}>{stats.lunch.avg}</Text>
                            <Text style={styles.statLabel}>Lunch</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statVal}>{stats.dinner.avg}</Text>
                            <Text style={styles.statLabel}>Dinner</Text>
                        </View>
                    </View>
                </View>
            )}

            <Text style={styles.sectionHeading}>Detailed Reviews</Text>
            {feedback.length > 0 ? feedback.map((f, i) => (
                <View key={i} style={styles.feedbackCard}>
                    <View style={styles.feedbackHead}>
                        <View>
                            <Text style={styles.feedbackName}>{f.studentName}</Text>
                            <Text style={styles.feedbackMeal}>{f.mealType.toUpperCase()}</Text>
                        </View>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={12} color={s <= f.rating ? '#FBC02D' : '#ddd'} fill={s <= f.rating ? '#FBC02D' : 'transparent'} />
                            ))}
                        </View>
                    </View>
                    {f.comment && <Text style={styles.feedbackComment}>{f.comment}</Text>}
                    <Text style={styles.feedbackDate}>{new Date(f.createdAt).toLocaleDateString()}</Text>
                </View>
            )) : <Text style={styles.emptyText}>No reviews to show</Text>}
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Mess Dashboard</Text>
                        <Text style={styles.headerSub}>{subRole?.toUpperCase()} HOSTEL CONTRACTOR</Text>
                    </View>
                    <View style={styles.headerIconWrap}>
                        <UtensilsCrossed size={24} color="#fff" />
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.tabContainer}>
                {(['menu', 'fees', 'feedback'] as const).map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tab, activeTab === t && styles.activeTab]}
                        onPress={() => { setActiveTab(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                        <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                        {activeTab === t && <View style={styles.activeLine} />}
                    </TouchableOpacity>
                ))}
            </View>

            {fetching ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <>
                    {activeTab === 'menu' && renderMenuTab()}
                    {activeTab === 'fees' && renderFeesTab()}
                    {activeTab === 'feedback' && renderFeedbackTab()}
                </>
            )}

            {/* In-App File Viewer */}
            <Modal visible={viewerVisible} transparent={true} animationType="fade">
                <View style={styles.viewerOverlay}>
                    <View style={styles.viewerHeader}>
                        <Text style={styles.viewerTitle}>{viewerName}</Text>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <TouchableOpacity onPress={handleDownload}>
                                <Download size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setViewerVisible(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.viewerContent}>
                        {viewerType === 'image' ? (
                            <Image source={{ uri: viewerUri || '' }} style={styles.fullImage} contentFit="contain" />
                        ) : (
                            <WebView source={{ uri: viewerUri || '' }} style={{ flex: 1 }} />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { padding: 24, paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: '800' as const, color: '#fff' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: 1.2 },
    headerIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -20 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 4, elevation: 2 },
    activeTab: { backgroundColor: '#fff' },
    tabText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textLight },
    activeTabText: { color: Colors.primary, fontWeight: '700' as const },
    activeLine: { position: 'absolute', bottom: 10, width: 20, height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
    tabContent: { flex: 1, padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    cardTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
    cardSub: { fontSize: 13, color: Colors.textLight, marginBottom: 20 },
    uploadBox: { height: 160, borderRadius: 20, borderWidth: 2, borderColor: '#E9ECEF', borderStyle: 'dashed', backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
    uploadHint: { fontSize: 12, color: Colors.textLight },
    selectedFile: { alignItems: 'center', gap: 10 },
    fileName: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary, paddingHorizontal: 40, textAlign: 'center' },
    removeFile: { position: 'absolute', top: -10, right: -40, padding: 8, backgroundColor: '#FFE3E3', borderRadius: 20 },
    previewSection: { marginTop: 24 },
    previewTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
    menuPreview: { width: '100%', height: 250, borderRadius: 16 },
    fullPreview: { width: '100%', height: '100%' },
    tapHint: { textAlign: 'center', fontSize: 11, color: Colors.textLight, marginTop: 10 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.textSecondary, marginBottom: 10 },
    input: { backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#DEE2E6', color: Colors.text },
    primaryBtn: { backgroundColor: Colors.primary, borderRadius: 20, padding: 18, alignItems: 'center', marginBottom: 30, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    primaryBtnText: { color: '#fff', fontWeight: '800' as const, fontSize: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sectionHeading: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 16, marginLeft: 4 },
    statsGrid: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 10, marginTop: 10 },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
    statVal: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
    statLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '600' as const, marginTop: 4 },
    feedbackCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12 },
    feedbackHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    feedbackName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
    feedbackMeal: { fontSize: 11, fontWeight: '700' as const, color: Colors.primary, marginTop: 2 },
    ratingRow: { flexDirection: 'row', gap: 2 },
    feedbackComment: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic' as const, lineHeight: 20 },
    feedbackDate: { fontSize: 10, color: Colors.textLight, textAlign: 'right', marginTop: 10 },
    emptyText: { textAlign: 'center', marginTop: 40, color: Colors.textLight, fontSize: 14 },
    
    // Viewer Styles
    viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
    viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
    viewerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' as const },
    viewerContent: { flex: 1, padding: 10 },
    fullImage: { width: '100%', height: '100%' },
});
