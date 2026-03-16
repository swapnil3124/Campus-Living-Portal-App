import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { 
    UtensilsCrossed, 
    CreditCard, 
    Star, 
    CheckCircle2, 
    Download,
    FileText,
    X,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants/config';
import * as Haptics from 'expo-haptics';

export default function MessScreen() {
    const { student } = useAuth();
    const [menu, setMenu] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Feedback state
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');

    // Viewer states
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string | null>(null);
    const [viewerType, setViewerType] = useState<'image' | 'pdf' | 'other'>('image');
    const [viewerName, setViewerName] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const hType = student?.gender === 'Female' ? 'girls' : 'boys';
            const response = await fetch(`${API_URL}/mess/menu?hostelType=${hType}`);
            const menuData = await response.json();
            setMenu(menuData);
        } catch (error) {
            console.error('Error fetching mess data:', error);
        } finally {
            setLoading(false);
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
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

    const handleSubmitFeedback = async () => {
        if (rating === 0) {
            Alert.alert('Selection Required', 'Please tap on stars to rate the meal.');
            return;
        }

        setSubmittingFeedback(true);
        try {
            const hType = student?.gender === 'Female' ? 'girls' : 'boys';
            const response = await fetch(`${API_URL}/mess/feedback/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: student?._id,
                    rating,
                    comment,
                    mealType,
                    hostelType: hType
                }),
            });

            const data = await response.json();
            if (data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Thank You!', 'Your feedback helps improve our mess quality.');
                setRating(0);
                setComment('');
                fetchData();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.topSection}>
                    {/* 1. Mess Fees & Payment */}
                    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                        <View style={styles.cardHeader}>
                            <CreditCard size={18} color={Colors.primary} />
                            <Text style={styles.cardTitle}>Mess Fees & Payment</Text>
                        </View>
                        
                        <View style={styles.feeHighlight}>
                            <Text style={styles.feeVal}>₹{menu?.fees || '0'}</Text>
                            <Text style={styles.feeLab}>Monthly Fee</Text>
                        </View>

                        {menu?.paymentQrUrl ? (
                            <TouchableOpacity 
                                style={styles.qrContainer} 
                                activeOpacity={0.9}
                                onPress={() => handleOpenViewer(menu.paymentQrUrl, 'Payment QR')}
                            >
                                <Text style={styles.qrLabel}>SCAN TO PAY</Text>
                                <Image source={{ uri: menu.paymentQrUrl }} style={styles.paymentQr} contentFit="contain" />
                                <Text style={styles.qrSub}>Use any UPI app to make payment</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.infoBox}>
                                <CheckCircle2 size={16} color={Colors.success} />
                                <Text style={styles.infoText}>Consult contractor for payment details</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* 2. Mess Menu Image/File */}
                    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                        <View style={styles.cardHeader}>
                            <UtensilsCrossed size={18} color={Colors.primary} />
                            <Text style={styles.cardTitle}>Weekly Mess Menu</Text>
                        </View>

                        {menu?.menuFileUrl ? (
                            <TouchableOpacity activeOpacity={0.9} onPress={() => handleOpenViewer(menu.menuFileUrl, 'Weekly Menu')}>
                                {menu.menuFileUrl.toLowerCase().endsWith('.pdf') ? (
                                    <View style={styles.pdfPlaceholder}>
                                        <FileText size={48} color={Colors.textLight} />
                                        <Text style={styles.pdfText}>Weekly Menu Circular (PDF)</Text>
                                        <Text style={styles.pdfSub}>Tap to Open / View</Text>
                                    </View>
                                ) : (
                                    <View>
                                        <Image source={{ uri: menu.menuFileUrl }} style={styles.menuImage} contentFit="contain" />
                                        <Text style={styles.tapHint}>Tap to view full screen</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.emptyWrap}>
                                <UtensilsCrossed size={40} color={Colors.border} />
                                <Text style={styles.emptyText}>Menu not uploaded yet</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* 3. Feedback Section */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Star size={18} color={Colors.primary} />
                            <Text style={styles.cardTitle}>Meal Feedback</Text>
                        </View>
                        
                        <View style={styles.mealChips}>
                            {(['breakfast', 'lunch', 'dinner'] as const).map(m => (
                                <TouchableOpacity 
                                    key={m} 
                                    style={[styles.mealChip, mealType === m && styles.mealChipActive]}
                                    onPress={() => setMealType(m)}
                                >
                                    <Text style={[styles.mealChipText, mealType === m && styles.mealChipTextActive]}>{m.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.starsWrap}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <TouchableOpacity key={s} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRating(s); }}>
                                    <Star 
                                        size={30} 
                                        color={s <= rating ? '#FBC02D' : '#E2E8F0'} 
                                        fill={s <= rating ? '#FBC02D' : 'transparent'} 
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.commentInput}
                            placeholder="Any comments or suggestions?"
                            multiline
                            value={comment}
                            onChangeText={setComment}
                        />

                        <TouchableOpacity 
                            style={styles.submitBtn} 
                            onPress={handleSubmitFeedback}
                            disabled={submittingFeedback}
                        >
                            {submittingFeedback ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Rating</Text>}
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* In-App File Viewer */}
            <Modal visible={viewerVisible} transparent={true} animationType="slide">
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
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topSection: { padding: 16, paddingTop: 10 },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    cardTitle: { flex: 1, fontSize: 16, fontWeight: '700' as const, color: Colors.text },
    feeHighlight: { backgroundColor: Colors.primaryGhost, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
    feeVal: { fontSize: 28, fontWeight: '800' as const, color: Colors.primaryDark },
    feeLab: { fontSize: 13, color: Colors.primary, fontWeight: '600' as const, marginTop: 2 },
    qrContainer: { alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20 },
    qrLabel: { fontSize: 10, fontWeight: '800' as const, color: Colors.textLight, letterSpacing: 2, marginBottom: 15 },
    paymentQr: { width: 180, height: 180, borderRadius: 12 },
    qrSub: { fontSize: 11, color: Colors.textLight, marginTop: 15 },
    infoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
    infoText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
    menuImage: { width: '100%', height: 350, borderRadius: 16 },
    tapHint: { textAlign: 'center', fontSize: 11, color: Colors.textLight, marginTop: 10 },
    pdfPlaceholder: { height: 200, backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
    pdfText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
    pdfSub: { fontSize: 12, color: Colors.textLight },
    emptyWrap: { paddingVertical: 40, alignItems: 'center', gap: 10 },
    emptyText: { color: Colors.textLight, fontSize: 14 },
    mealChips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    mealChip: { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
    mealChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    mealChipText: { fontSize: 10, fontWeight: '700' as const, color: Colors.textSecondary },
    mealChipTextActive: { color: '#fff' },
    starsWrap: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    commentInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, height: 80, fontSize: 14, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' },
    submitBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 16 },
    submitBtnText: { color: '#fff', fontWeight: '700' as const, fontSize: 15 },
    
    // Viewer Styles
    viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
    viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
    viewerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' as const },
    viewerContent: { flex: 1, padding: 10 },
    fullImage: { width: '100%', height: '100%' },
});
