import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    Dimensions,
    Platform,
    ImageBackground,
    Modal,
    Easing,
    Linking,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import {
    Building2,
    Users,
    ChevronRight,
    ClipboardList,
    BellRing,
    X,
    Download,
    Paperclip,
    FileText,
    Calendar,
    AlertCircle,
    Info,
    AlertTriangle,
    User as UserIcon,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { hostels } from '@/mocks/data';
import { Notice } from '@/constants/types';

const buildPdfHtml = (base64: string) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; min-height: 100%; background: #1e1e2e; overflow-x: hidden; }
    #loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #a0aec0; font-family: -apple-system, sans-serif; font-size: 15px; gap: 14px; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.15); border-top-color: #667eea; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #container { display: flex; flex-direction: column; align-items: center; padding: 8px 0; gap: 6px; }
    .page-wrapper { width: 100%; position: relative; background: white; }
    canvas { display: block; width: 100% !important; height: auto !important; }
    .page-num { position: absolute; bottom: 6px; right: 10px; background: rgba(0,0,0,0.45); color: white; font-size: 11px; padding: 2px 7px; border-radius: 999px; font-family: -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div><span>Loading PDF…</span></div>
  <div id="container"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var pdfData = Uint8Array.from(atob('${base64}'), c => c.charCodeAt(0));
    pdfjsLib.getDocument({ data: pdfData }).promise.then(function(pdf) {
      document.getElementById('loading').style.display = 'none';
      var container = document.getElementById('container');
      function renderPage(num) {
        pdf.getPage(num).then(function(page) {
          var vp0 = page.getViewport({ scale: 1 });
          var scale = (window.innerWidth * window.devicePixelRatio) / vp0.width;
          var viewport = page.getViewport({ scale: scale });
          var wrapper = document.createElement('div');
          wrapper.className = 'page-wrapper';
          var canvas = document.createElement('canvas');
          canvas.width = viewport.width; canvas.height = viewport.height;
          var label = document.createElement('div');
          label.className = 'page-num'; label.textContent = num + ' / ' + pdf.numPages;
          wrapper.appendChild(canvas); wrapper.appendChild(label);
          container.appendChild(wrapper);
          page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });
          if (num < pdf.numPages) renderPage(num + 1);
        });
      }
      renderPage(1);
    });
  </script>
</body>
</html>`;
};

const { width } = Dimensions.get('window');

// ── Image map keyed by hostel name ──────────────────────────────────────────
const hostelImages: Record<string, any> = {
    Shivneri: require('@/assets/images/Shivneri.png'),
    Lenyadri: require('@/assets/images/Lenyadri.png'),
    Bhimashankar: require('@/assets/images/Bhimashankar.png'),
    Saraswati: require('@/assets/images/Saraswati.png'),
    Shwetambara: require('@/assets/images/Shwetambara.png'),
};



import { useAdmissionStore } from '@/store/admission-store';
import { useAnnouncementStore, Announcement } from '@/store/announcement-store';
import { API_URL } from '@/constants/config';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { regConfig, fetchRegConfig } = useAdmissionStore();
    const { announcements, activeAnnouncements, fetchActiveAnnouncements, fetchAnnouncements } = useAnnouncementStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [allAnnModalVisible, setAllAnnModalVisible] = useState(false);
    const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Marquee Animation
    const marqueeAnim = useRef(new Animated.Value(0)).current;
    const [textWidth, setTextWidth] = useState(0);
    const slideAnim = useRef(new Animated.Value(30)).current;
    const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
    const scaleAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchRegConfig();
        fetchActiveAnnouncements();
        fetchAnnouncements();
        fetchPublicNotices();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();

        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 500,
                delay: 300 + i * 120,
                useNativeDriver: true,
            }).start();
        });

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (textWidth > 0) {
            marqueeAnim.setValue(0);
            Animated.loop(
                Animated.timing(marqueeAnim, {
                    toValue: -textWidth,
                    duration: textWidth * 18, // Adjust speed as needed
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [textWidth, activeAnnouncements]);

    const handleAnnouncementClick = (ann: Announcement) => {
        setSelectedAnn(ann);
        setModalVisible(true);
    };

    const isRegistrationVisible = () => {
        if (!regConfig.isOpen) return false;
        if (!regConfig.startDate || !regConfig.endDate) return true; // Default to open if no date set but isOpen is true

        const now = new Date();
        const start = new Date(regConfig.startDate);
        const end = new Date(regConfig.endDate);
        return now >= start && now <= end;
    };

    const boysHostels = hostels.filter(h => h.type === 'boys');
    const girlsHostels = hostels.filter(h => h.type === 'girls');
    const totalBoys = boysHostels.reduce((sum, h) => sum + h.capacity, 0);
    const totalGirls = girlsHostels.reduce((sum, h) => sum + h.capacity, 0);


    const handlePressIn = (index: number) => {
        Animated.spring(scaleAnims[index], {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = (index: number) => {
        Animated.spring(scaleAnims[index], {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const [publicNotices, setPublicNotices] = useState<Notice[]>([]);

    // Notice Detail & Viewer states
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [noticeDetailVisible, setNoticeDetailVisible] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState('');
    const [viewerName, setViewerName] = useState('');
    const [viewerType, setViewerType] = useState<'image' | 'pdf'>('image');
    const [pdfBase64, setPdfBase64] = useState('');

    const fetchPublicNotices = async () => {
        try {
            const response = await fetch(`${API_URL}/notices/public`);
            const data = await response.json();
            if (Array.isArray(data)) {
                const mappedData = data.map((n: any) => ({
                    id: n._id,
                    title: n.title,
                    description: n.description,
                    priority: n.priority as any,
                    date: new Date(n.createdAt).toLocaleDateString(),
                    issuedBy: n.issuedBy,
                    category: n.category || 'General',
                    hostelName: n.hostelName || 'General',
                    fileUrl: n.fileUrl,
                    fileName: n.fileName,
                    // Store technical date for 'NEW' calculation
                    createdAt: n.createdAt 
                }));
                setPublicNotices(mappedData.slice(0, 3));
            }
        } catch (error) {
            console.error('Error fetching public notices for home:', error);
        }
    };

    const handleOpenNoticeDetail = (notice: Notice) => {
        setSelectedNotice(notice);
        setNoticeDetailVisible(true);
    };

    const handleViewFile = async (url: string, name: string) => {
        const isPdf = name.toLowerCase().endsWith('.pdf');
        const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(name) || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        
        const serverBase = API_URL.replace('/api', '');
        const fullUrl = url.startsWith('http') ? url : `${serverBase}${url}`;

        setViewerName(name);

        if (isPdf) {
            setViewerType('pdf');
            try {
                const response = await fetch(fullUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = (reader.result as string).split(',')[1];
                    setPdfBase64(base64data);
                    setViewerVisible(true);
                };
            } catch (error) {
                console.error('Error loading PDF:', error);
                Alert.alert('Error', 'Failed to load PDF file');
            }
        } else if (isImg) {
            setViewerType('image');
            setViewerUri(fullUrl);
            setViewerVisible(true);
        } else {
            Alert.alert('Notice', 'This file type cannot be previewed in-app. Please download it to view.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Download', onPress: () => handleDownload(url, name) }
            ]);
        }
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const serverBase = API_URL.replace('/api', '');
            const fullUrl = url.startsWith('http') ? url : `${serverBase}${url}`;
            const fileUri = FileSystem.documentDirectory + filename;
            const downloadResumable = FileSystem.createDownloadResumable(fullUrl, fileUri);
            const { uri } = await downloadResumable.downloadAsync() as { uri: string };

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Success', 'File downloaded to: ' + uri);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to download file');
        }
    };


    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
                <LinearGradient
                    colors={['#00443D', '#00695C', '#00897B', '#26A69A']}
                    style={[styles.header, { paddingTop: insets.top + 16 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >

                    <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {/* Logo with glow ring */}
                        <View style={styles.logoGlowRing}>
                            <View style={styles.collegeBadge}>
                                <Image
                                    source={require('@/assets/images/logo.png')}
                                    style={styles.collegeLogo}
                                    contentFit="contain"
                                />
                            </View>
                        </View>
                        <Text style={styles.collegeName}>Government Polytechnic</Text>
                        <Text style={styles.collegeSubtitle}>Awasari (Kh.)</Text>
                        <Text style={styles.systemTitle}>CAMPUS LIVING PORTAL</Text>
                    </Animated.View>

                    <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(33,150,243,0.22)' }]}>
                                <Users size={18} color="#90CAF9" />
                            </View>
                            <Text style={styles.statNumber}>{totalBoys}</Text>
                            <Text style={styles.statLabel}>Boys Capacity</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(233,30,99,0.22)' }]}>
                                <Users size={18} color="#F48FB1" />
                            </View>
                            <Text style={styles.statNumber}>{totalGirls}</Text>
                            <Text style={styles.statLabel}>Girls Capacity</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,152,0,0.22)' }]}>
                                <Building2 size={18} color="#FFB74D" />
                            </View>
                            <Text style={styles.statNumber}>{hostels.length}</Text>
                            <Text style={styles.statLabel}>Total Hostels</Text>
                        </View>
                    </Animated.View>
                </LinearGradient>

                {/* Announcement Bar */}
                {activeAnnouncements.length > 0 && (
                    <View style={styles.announcementBar}>
                        <TouchableOpacity
                            style={styles.announcementBadge}
                            onPress={() => setAllAnnModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.announcementBadgeText}>Announcements</Text>
                            <BellRing size={14} color={Colors.white} style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                        <View style={styles.marqueeContainer}>
                            <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: marqueeAnim }] }}>
                                <View onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}>
                                    <View style={{ flexDirection: 'row' }}>
                                        {activeAnnouncements.map((ann, idx) => (
                                            <TouchableOpacity key={`orig-${idx}`} onPress={() => handleAnnouncementClick(ann)} style={styles.marqueeItem}>
                                                <Text style={styles.marqueeText}>{ann.message}</Text>
                                                <Text style={styles.marqueeDivider}>   •   </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    {activeAnnouncements.map((ann, idx) => (
                                        <TouchableOpacity key={`dup-${idx}`} onPress={() => handleAnnouncementClick(ann)} style={styles.marqueeItem}>
                                            <Text style={styles.marqueeText}>{ann.message}</Text>
                                            <Text style={styles.marqueeDivider}>   •   </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Animated.View>
                        </View>
                    </View>
                )}

                <View style={styles.content}>


                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: cardAnims[1],
                                transform: [{ translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                            },
                        ]}
                    >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Boys Hostels</Text>
                            <View style={styles.capacityBadge}>
                                <Text style={styles.capacityText}>{totalBoys} beds</Text>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hostelScroll}>
                            {boysHostels.map((hostel) => (
                                <Animated.View key={hostel.id} style={[styles.hostelCard, { transform: [{ scale: scaleAnims[0] }] }]}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPressIn={() => { handlePressIn(0); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                        onPressOut={() => handlePressOut(0)}
                                    >
                                        <ImageBackground
                                            source={hostelImages[hostel.name] ?? hostelImages.Shivneri}
                                            style={styles.hostelCardBg}
                                            imageStyle={styles.hostelCardBgImage}
                                        >
                                            <View style={styles.hostelCardOverlay}>
                                                <View style={styles.hostelCardHeader}>
                                                    <View style={styles.capacityPill}>
                                                        <Text style={styles.capacityPillText}>{hostel.capacity} beds</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.hostelCardName}>{hostel.name}</Text>
                                                <Text style={styles.hostelCardType}>Boys Hostel</Text>
                                            </View>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: cardAnims[2],
                                transform: [{ translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                            },
                        ]}
                    >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Girls Hostels</Text>
                            <View style={[styles.capacityBadge, { backgroundColor: '#FCE4EC' }]}>
                                <Text style={[styles.capacityText, { color: '#e94285ff' }]}>{totalGirls} beds</Text>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hostelScroll}>
                            {girlsHostels.map((hostel) => (
                                <View key={hostel.id} style={styles.hostelCard}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPressIn={() => { handlePressIn(1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                        onPressOut={() => handlePressOut(1)}
                                    >
                                        <ImageBackground
                                            source={hostelImages[hostel.name] ?? hostelImages.Saraswati}
                                            style={styles.hostelCardBg}
                                            imageStyle={styles.hostelCardBgImage}
                                        >
                                            <View style={styles.hostelCardOverlay}>
                                                <View style={styles.hostelCardHeader}>
                                                    <View style={styles.capacityPill}>
                                                        <Text style={styles.capacityPillText}>{hostel.capacity} beds</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.hostelCardName}>{hostel.name}</Text>
                                                <Text style={styles.hostelCardType}>Girls Hostel</Text>
                                            </View>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: cardAnims[3],
                                transform: [{ translateY: cardAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                            },
                        ]}
                    >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Latest Notices</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/(tabs)/notices' as any);
                                }}
                                style={styles.viewAllBtn}
                            >
                                <Text style={styles.viewAllText}>View All</Text>
                                <ChevronRight size={14} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                        {publicNotices.map((notice) => (
                            <TouchableOpacity 
                                key={notice.id} 
                                style={styles.noticePreview}
                                onPress={() => handleOpenNoticeDetail(notice)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.noticeLeft}>
                                    <View
                                        style={[
                                            styles.noticeDot,
                                            notice.priority === 'urgent' && { backgroundColor: Colors.error },
                                            notice.priority === 'important' && { backgroundColor: Colors.warning },
                                            notice.priority === 'normal' && { backgroundColor: Colors.primary },
                                        ]}
                                    />
                                    <View style={styles.noticeTextWrap}>
                                        <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                                        <Text style={styles.noticeDate}>
                                            {notice.date} • {notice.issuedBy}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    {notice.fileUrl && <Paperclip size={14} color={Colors.primary} />}
                                    {(new Date().getTime() - new Date(notice.createdAt || 0).getTime()) < 2 * 24 * 60 * 60 * 1000 && (
                                        <View style={styles.newBadge}>
                                            <Text style={styles.newBadgeText}>NEW</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>

                    {/* ── Dynamic "Apply for Hostel" Button ───────────────────── */}
                    {isRegistrationVisible() && (
                        <Animated.View
                            style={[
                                styles.section,
                                {
                                    opacity: cardAnims[0],
                                    transform: [
                                        { translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                                    ],
                                },
                            ]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push('/registration' as any);
                                }}
                                style={styles.applyButton}
                            >
                                <View style={styles.applyButtonContent}>
                                    <View style={styles.applyIconWrap}>
                                        <ClipboardList size={22} color={Colors.white} />
                                    </View>
                                    <View style={styles.applyTextWrap}>
                                        <Text style={styles.applyButtonText}>Hostel Admission 2025-26</Text>
                                        <View style={styles.applyBadge}>
                                            <Text style={styles.applyBadgeText}>APPLICATION OPEN</Text>
                                        </View>
                                    </View>
                                    <ChevronRight size={20} color={Colors.primary} />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    <View style={{ height: 20 }} />
                </View>
            </ScrollView>

            <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Announcement</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalMsg}>{selectedAnn?.message}</Text>
                            {!!selectedAnn?.details && <Text style={styles.modalDetails}>{selectedAnn.details}</Text>}
                            <Text style={styles.modalDate}>Valid from: {selectedAnn?.startDate ? new Date(selectedAnn.startDate).toLocaleDateString() : ''}</Text>
                            {selectedAnn?.fileUrl && (
                                <TouchableOpacity
                                    style={styles.downloadBtn}
                                    onPress={() => {
                                        const url = API_URL.replace('/api', '') + selectedAnn.fileUrl;
                                        Linking.openURL(url);
                                    }}
                                >
                                    <Download size={18} color={Colors.white} />
                                    <Text style={styles.downloadBtnText}>Download Attachment</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* All Announcements Modal */}
            <Modal visible={allAnnModalVisible} transparent={true} animationType="slide" onRequestClose={() => setAllAnnModalVisible(false)}>
                <View style={styles.fullModalOverlay}>
                    <View style={styles.fullModalContent}>
                        <View style={styles.fullModalHeader}>
                            <Text style={styles.modalTitle}>All Announcements</Text>
                            <TouchableOpacity onPress={() => setAllAnnModalVisible(false)} style={styles.closeBtn}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.fullModalBody} showsVerticalScrollIndicator={false}>
                            {announcements.length === 0 ? (
                                <Text style={styles.modalDetails}>No announcements available.</Text>
                            ) : (
                                announcements.map((ann, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.annCard}
                                        onPress={() => {
                                            setAllAnnModalVisible(false);
                                            handleAnnouncementClick(ann);
                                        }}
                                    >
                                        <View style={styles.annCardHeader}>
                                            <Text style={styles.annCardTitle}>{ann.message}</Text>
                                            {ann.isActive && <View style={styles.activeDot} />}
                                        </View>
                                        <Text style={styles.annCardDate}>{new Date(ann.createdAt || ann.startDate).toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* Notice Detail Modal */}
            <Modal
                visible={noticeDetailVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setNoticeDetailVisible(false)}
            >
                <BlurView intensity={20} style={styles.noticeModalOverlay}>
                    <View style={styles.noticeModalContent}>
                        <View style={styles.noticeModalHeader}>
                            <Text style={styles.modalTitle}>Notice Details</Text>
                            <TouchableOpacity onPress={() => setNoticeDetailVisible(false)} style={styles.closeBtn}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {selectedNotice && (
                                <View>
                                    <View style={styles.detailCard}>
                                        <Text style={styles.detailTitle}>{selectedNotice.title}</Text>
                                        
                                        <View style={styles.detailMetaRow}>
                                            <View style={styles.detailMetaItem}>
                                                <Calendar size={14} color={Colors.textLight} />
                                                <Text style={styles.detailMetaText}>{selectedNotice.date}</Text>
                                            </View>
                                            <View style={styles.detailMetaItem}>
                                                <UserIcon size={14} color={Colors.textLight} />
                                                <Text style={styles.detailMetaText}>{selectedNotice.issuedBy}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.divider} />
                                        
                                        <Text style={styles.detailDescription}>{selectedNotice.description}</Text>

                                        {selectedNotice.fileUrl && (
                                            <View style={styles.attachmentSection}>
                                                <Text style={styles.attachmentLabel}>Attachment</Text>
                                                <TouchableOpacity 
                                                    style={styles.attachmentCard}
                                                    onPress={() => handleViewFile(selectedNotice.fileUrl!, selectedNotice.fileName!)}
                                                >
                                                    <View style={styles.attachmentIcon}>
                                                        {selectedNotice.fileName?.toLowerCase().endsWith('.pdf') ? (
                                                            <FileText size={24} color={Colors.error} />
                                                        ) : (
                                                            <Paperclip size={24} color={Colors.primary} />
                                                        )}
                                                    </View>
                                                    <View style={styles.attachmentInfo}>
                                                        <Text style={styles.attachmentName} numberOfLines={1}>
                                                            {selectedNotice.fileName}
                                                        </Text>
                                                        <Text style={styles.attachmentAction}>Tap to view</Text>
                                                    </View>
                                                    <TouchableOpacity 
                                                        onPress={() => handleDownload(selectedNotice.fileUrl!, selectedNotice.fileName!)}
                                                        style={styles.downloadIcon}
                                                    >
                                                        <Download size={20} color={Colors.textLight} />
                                                    </TouchableOpacity>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </BlurView>
            </Modal>

            {/* Viewer Modal */}
            <Modal
                visible={viewerVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setViewerVisible(false)}
            >
                <View style={[styles.viewerOverlay, { paddingTop: insets.top }]}>
                    <View style={styles.viewerHeader}>
                        <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.viewerCloseBtn}>
                            <X size={26} color={Colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.viewerTitle} numberOfLines={1}>{viewerName}</Text>
                        <TouchableOpacity onPress={() => handleDownload(viewerUri, viewerName)} style={styles.viewerCloseBtn}>
                            <Download size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.viewerContent}>
                        {viewerType === 'image' ? (
                            <Image
                                source={{ uri: viewerUri }}
                                style={styles.fullImage}
                                contentFit="contain"
                            />
                        ) : (
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: buildPdfHtml(pdfBase64) }}
                                style={styles.pdfViewer}
                                scrollEnabled={true}
                                bounces={false}
                                allowFileAccess={true}
                                scalesPageToFit={true}
                                mixedContentMode="always"
                            />
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
        backgroundColor: Colors.background,
    },
    header: {
        paddingBottom: 28,
        paddingHorizontal: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    headerContent: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoGlowRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: Colors.white,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 0,
    },
    collegeBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 6,
    },
    collegeLogo: {
        width: 66,
        height: 66,
        borderRadius: 33,
    },
    collegeName: {
        fontSize: 22,
        fontWeight: '800' as const,
        color: Colors.white,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    collegeSubtitle: {
        fontSize: 14,
        fontWeight: '500' as const,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 3,
    },
    systemTitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 8,
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800' as const,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '500' as const,
        color: 'rgba(255,255,255,0.72)',
        marginTop: 3,
        letterSpacing: 0.3,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 4,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    capacityBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    capacityText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: '#1565C0',
    },
    hostelScroll: {
        paddingRight: 16,
        gap: 12,
    },
    hostelCard: {
        width: width * 0.52,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    hostelCardBg: {
        width: '100%',
        borderRadius: 16,
    },
    hostelCardBgImage: {
        borderRadius: 16,
    },
    hostelCardOverlay: {
        backgroundColor: 'rgba(0,0,0,0.38)',
        borderRadius: 16,
        padding: 16,
    },
    hostelCardHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 28,
    },
    capacityPill: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    capacityPillText: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    hostelCardName: {
        fontSize: 17,
        fontWeight: '800' as const,
        color: Colors.white,
        marginBottom: 3,
    },
    hostelCardType: {
        fontSize: 12,
        fontWeight: '500' as const,
        color: 'rgba(255,255,255,0.85)',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: Colors.primary,
    },
    noticePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    noticeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    noticeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    noticeTextWrap: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    noticeDate: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 2,
    },
    newBadge: {
        backgroundColor: Colors.error,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 8,
    },
    newBadgeText: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    // ── Apply Button ────────────────────────────────────────────────────────
    applyButton: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,137,123,0.1)',
    },
    applyButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    applyIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    applyTextWrap: {
        flex: 1,
    },
    applyButtonText: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: '700' as const,
    },
    applyBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryGhost,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 4,
    },
    applyBadgeText: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    announcementBar: {
        flexDirection: 'row',
        backgroundColor: '#E0F2F1',
        borderBottomWidth: 1,
        borderBottomColor: '#B2DFDB',
        alignItems: 'center',
    },
    announcementBadge: {
        flexDirection: 'row',
        backgroundColor: '#00695C',
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        zIndex: 2,
    },
    announcementBadgeText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 13,
    },
    marqueeContainer: {
        flex: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    marqueeItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    marqueeText: {
        color: '#004D40',
        fontSize: 14,
        fontWeight: '600',
    },
    marqueeDivider: {
        color: '#00897B',
        fontSize: 14,
        fontWeight: '700',
        marginHorizontal: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    modalBody: {
        marginBottom: 10,
    },
    modalMsg: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 10,
    },
    modalDetails: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
        lineHeight: 22,
    },
    modalDate: {
        fontSize: 12,
        color: Colors.textLight,
        marginBottom: 8,
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    downloadBtnText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 15,
    },
    fullModalOverlay: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 50,
    },
    fullModalContent: {
        flex: 1,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    fullModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeBtn: {
        padding: 4,
    },
    fullModalBody: {
        flex: 1,
    },
    annCard: {
        backgroundColor: Colors.background,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    annCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    annCardTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        lineHeight: 20,
        marginRight: 8,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        marginTop: 6,
    },
    annCardDate: {
        fontSize: 12,
        color: Colors.textLight,
    },
    // Notice Detail & Viewer Styles
    noticeModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    noticeModalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    noticeModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    detailCard: {
        gap: 16,
    },
    detailTitle: {
        fontSize: 22,
        fontWeight: '800' as const,
        color: Colors.text,
        lineHeight: 30,
    },
    detailMetaRow: {
        flexDirection: 'row',
        gap: 20,
    },
    detailMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailMetaText: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500' as const,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
    },
    detailDescription: {
        fontSize: 15,
        lineHeight: 24,
        color: Colors.textSecondary,
    },
    attachmentSection: {
        marginTop: 10,
        gap: 12,
    },
    attachmentLabel: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    attachmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    attachmentIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    attachmentInfo: {
        flex: 1,
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.text,
        marginBottom: 2,
    },
    attachmentAction: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '500' as const,
    },
    downloadIcon: {
        padding: 8,
    },
    viewerOverlay: {
        flex: 1,
        backgroundColor: '#000',
    },
    viewerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    viewerCloseBtn: {
        padding: 8,
    },
    viewerTitle: {
        flex: 1,
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700' as const,
        textAlign: 'center',
    },
    viewerContent: {
        flex: 1,
        backgroundColor: '#1e1e2e',
    },
    fullImage: {
        flex: 1,
    },
    pdfViewer: {
        flex: 1,
        backgroundColor: '#1e1e2e',
    },
});
