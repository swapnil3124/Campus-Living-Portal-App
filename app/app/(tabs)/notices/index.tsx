import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Platform,
    Alert,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { 
    Bell, 
    Clock, 
    User as UserIcon, 
    AlertTriangle, 
    Info, 
    AlertCircle, 
    X, 
    Download, 
    FileText, 
    Paperclip, 
    Calendar 
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Notice } from '@/constants/types';
import { API_URL } from '@/constants/config';

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

type FilterType = 'all' | 'urgent' | 'important' | 'normal';

const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'important', label: 'Important' },
    { key: 'normal', label: 'Normal' },
];

function NoticeCard({ notice, index, onPress }: { notice: Notice; index: number; onPress: () => void }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay: index * 80, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 450, delay: index * 80, useNativeDriver: true }),
        ]).start();
    }, []);

    const priorityConfig = {
        urgent: { color: Colors.error, bg: Colors.errorLight, icon: <AlertTriangle size={14} color={Colors.error} />, label: 'URGENT' },
        important: { color: Colors.warning, bg: Colors.warningLight, icon: <AlertCircle size={14} color={Colors.warning} />, label: 'IMPORTANT' },
        normal: { color: Colors.info, bg: Colors.infoLight, icon: <Info size={14} color={Colors.info} />, label: 'NORMAL' },
    };

    const config = priorityConfig[notice.priority];

    return (
        <Animated.View
            style={[
                styles.noticeCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    borderLeftColor: config.color,
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }}
                onPressIn={() => {
                    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
                }}
                onPressOut={() => {
                    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
                }}
            >
                <View style={styles.noticeCardInner}>
                    <View style={styles.noticeHeader}>
                        <View style={[styles.priorityBadge, { backgroundColor: config?.bg || Colors.border }]}>
                            {config?.icon}
                            <Text style={[styles.priorityText, { color: config?.color || Colors.textSecondary }]}>{config?.label || notice.priority}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {notice.fileUrl && <Paperclip size={14} color={Colors.primary} />}
                            {notice.isNew && (
                                <View style={styles.newBadge}>
                                    <Text style={styles.newBadgeText}>NEW</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                    <Text style={styles.noticeDesc} numberOfLines={2}>{notice.description}</Text>
                    <View style={styles.noticeMeta}>
                        <View style={styles.metaItem}>
                            <Clock size={12} color={Colors.textLight} />
                            <Text style={styles.metaText}>{notice.date}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <UserIcon size={12} color={Colors.textLight} />
                            <Text style={styles.metaText}>{notice.issuedBy}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function NoticesScreen() {
    const insets = useSafeAreaInsets();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // Detail & Viewer states
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState('');
    const [viewerName, setViewerName] = useState('');
    const [viewerType, setViewerType] = useState<'image' | 'pdf'>('image');
    const [pdfBase64, setPdfBase64] = useState('');

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/notices/public`);
            const data = await response.json();
            if (Array.isArray(data)) {
                const mappedData = data.map((n: any) => ({
                    id: n._id,
                    title: n.title,
                    description: n.description,
                    priority: n.priority as any,
                    category: n.category || 'General',
                    hostelName: n.hostelName || 'General',
                    date: new Date(n.createdAt).toLocaleDateString(),
                    issuedBy: n.issuedBy,
                    isNew: (new Date().getTime() - new Date(n.createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000,
                    fileUrl: n.fileUrl,
                    fileName: n.fileName
                }));
                setNotices(mappedData);
            }
        } catch (error) {
            console.error('Error fetching public notices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const filteredNotices = activeFilter === 'all'
        ? notices
        : notices.filter(n => n.priority === activeFilter);

    const handleFilter = useCallback((filter: FilterType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveFilter(filter);
    }, []);

    const handleOpenDetail = (notice: Notice) => {
        setSelectedNotice(notice);
        setDetailVisible(true);
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
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
            >
                <View style={styles.headerRow}>
                    <Bell size={24} color={Colors.white} />
                    <Text style={styles.headerTitle}>Notice Board</Text>
                </View>
                <Text style={styles.headerSubtitle}>Official hostel announcements</Text>
            </LinearGradient>

            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {filters.map((f) => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                            onPress={() => handleFilter(f.key)}
                        >
                            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : filteredNotices.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Bell size={48} color={Colors.textLight} />
                        <Text style={styles.emptyText}>No notices found</Text>
                    </View>
                ) : (
                    filteredNotices.map((notice, index) => (
                        <NoticeCard 
                            key={notice.id} 
                            notice={notice} 
                            index={index} 
                            onPress={() => handleOpenDetail(notice)}
                        />
                    ))
                )}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={detailVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailVisible(false)}
            >
                <BlurView intensity={20} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notice Details</Text>
                            <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.closeBtn}>
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: Colors.white,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginLeft: 34,
    },
    filterRow: {
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filterScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500' as const,
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: Colors.white,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    noticeCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    noticeCardInner: {
        padding: 16,
    },
    noticeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700' as const,
        letterSpacing: 0.5,
    },
    newBadge: {
        backgroundColor: Colors.error,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    newBadgeText: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    noticeTitle: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: Colors.text,
        marginBottom: 6,
        lineHeight: 20,
    },
    noticeDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        marginBottom: 12,
    },
    noticeMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: Colors.textLight,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textLight,
    },
    // New Modal & Viewer Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    closeBtn: {
        padding: 4,
    },
    modalBody: {
        flex: 1,
        padding: 24,
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
