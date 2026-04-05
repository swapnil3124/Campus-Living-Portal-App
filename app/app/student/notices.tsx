import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Animated,
    Alert,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import {
    Bell,
    Clock,
    FileText,
    AlertCircle,
    ChevronRight,
    Calendar,
    Download,
    Eye,
    Paperclip,
    X,
} from 'lucide-react-native';
import { Modal } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

import { API_URL } from '@/constants/config';

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
    'normal': { color: Colors.info, bg: Colors.infoLight, label: 'Normal' },
    'important': { color: '#E65100', bg: '#FFF3E0', label: 'Important' },
    'urgent': { color: Colors.error, bg: Colors.errorLight, label: 'Urgent' },
};

function NoticeCard({ notice, index, onPress }: { notice: any; index: number; onPress: () => void }) {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, []);

    const priority = priorityConfig[notice.priority] || priorityConfig['normal'];

    return (
        <Animated.View style={[styles.noticeCard, { opacity: fadeAnim }]}>
            <TouchableOpacity 
                style={{ flex: 1, flexDirection: 'row' }} 
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={styles.cardAccent} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                            <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
                        </View>
                        <Text style={styles.categoryText}>{notice.category}</Text>
                    </View>

                    <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                    <Text style={styles.noticeDesc} numberOfLines={2}>{notice.description}</Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.issuedByWrap}>
                            <Text style={styles.issuedByLabel}>Issued by: </Text>
                            <Text style={styles.issuedByVal}>{notice.issuedBy}</Text>
                        </View>
                        <View style={styles.dateWrap}>
                            <Clock size={12} color={Colors.textLight} />
                            <Text style={styles.dateText}>
                                {new Date(notice.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    {notice.fileUrl && (
                        <View style={styles.attachmentBadge}>
                            <Paperclip size={12} color={Colors.primary} />
                            <Text style={styles.attachmentBadgeText}>Circular Attached</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}


export default function StudentNoticesScreen() {
    const { student } = useAuth();
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter and Detail states
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedNotice, setSelectedNotice] = useState<any>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    
    // Viewer states
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string | null>(null);
    const [viewerName, setViewerName] = useState('');
    const [viewerType, setViewerType] = useState<'image' | 'pdf' | 'other'>('image');

    const fetchNotices = useCallback(async () => {
        const activeHostel = student?.hostelName || (student?.gender?.toLowerCase() === 'female' ? 'girls' : 'boys');
        
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/notices?hostelName=${encodeURIComponent(activeHostel)}&studentOnly=true`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setNotices(data);
            }
        } catch (error) {
            console.error('Error fetching notices:', error);
        } finally {
            setLoading(false);
        }
    }, [student?.hostelName]);

    const filteredNotices = notices.filter(n => 
        activeFilter === 'all' ? true : n.priority === activeFilter
    );

    const handleOpenDetail = (notice: any) => {
        setSelectedNotice(notice);
        setDetailVisible(true);
    };

    const [pdfBase64, setPdfBase64] = useState<string | null>(null);

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

    const handleViewFile = async (url: string, name: string) => {
        const isPdf = name.toLowerCase().endsWith('.pdf');
        const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(name) || /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('data:image/');
        
        const serverBase = API_URL.replace('/api', '');
        const fullUrl = url.startsWith('http') ? url : `${serverBase}${url}`;
        
        setViewerName(name || 'Document');
        setViewerUri(fullUrl);

        if (isPdf) {
            setViewerType('pdf');
            setViewerVisible(true);
            try {
                const response = await FileSystem.downloadAsync(fullUrl, FileSystem.cacheDirectory + 'temp.pdf');
                if (response.status === 200) {
                    const base64 = await FileSystem.readAsStringAsync(response.uri, { encoding: FileSystem.EncodingType.Base64 });
                    setPdfBase64(base64);
                }
            } catch (e) {
                console.error('PDF pre-load error:', e);
                Alert.alert('Error', 'Failed to load PDF preview');
            }
        } else {
            setViewerType(isImg ? 'image' : 'other');
            setViewerVisible(true);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    return (
        <View style={styles.container}>
            {/* Filter Bar */}
            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['all', 'normal', 'important', 'urgent'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.filterItem,
                                activeFilter === f && styles.filterItemActive
                            ]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === f && styles.filterTextActive
                            ]}>
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : student?.status === 'past' ? (
                    <View style={styles.emptyState}>
                        <Bell size={64} color={Colors.error} />
                        <Text style={styles.emptyTitle}>Access Denied</Text>
                        <Text style={styles.emptyText}>Internal hostel-specific notices are only available for currently active residents. Please check the public notice board for general announcements.</Text>
                    </View>
                ) : filteredNotices.length > 0 ? (
                    filteredNotices.map((notice, index) => (
                        <NoticeCard 
                            key={notice._id || index} 
                            notice={notice} 
                            index={index} 
                            onPress={() => handleOpenDetail(notice)} 
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Bell size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No notices found</Text>
                        <Text style={styles.emptyText}>There are no notices matching your filter.</Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Notice Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailVisible}
                onRequestClose={() => setDetailVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[selectedNotice?.priority]?.bg || Colors.infoLight }]}>
                                <Text style={[styles.priorityText, { color: priorityConfig[selectedNotice?.priority]?.color || Colors.info }]}>
                                    {(selectedNotice?.priority || 'INFO').toUpperCase()}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.closeBtn}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
                            <Text style={styles.detailTitle}>{selectedNotice?.title}</Text>
                            
                            <View style={styles.detailMeta}>
                                <View style={styles.metaRow}>
                                    <Clock size={14} color={Colors.textLight} />
                                    <Text style={styles.metaText}>
                                        {selectedNotice ? new Date(selectedNotice.createdAt).toLocaleDateString() : ''}
                                    </Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Bell size={14} color={Colors.textLight} />
                                    <Text style={styles.metaText}>{selectedNotice?.category}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />
                            
                            <Text style={styles.detailDesc}>{selectedNotice?.description}</Text>

                            {selectedNotice?.fileUrl && (
                                <View style={styles.attachmentSection}>
                                    <Text style={styles.sectionTitle}>Official Document</Text>
                                    <TouchableOpacity 
                                        style={styles.attachmentBox}
                                        onPress={() => handleViewFile(selectedNotice.fileUrl, selectedNotice.fileName)}
                                    >
                                        <View style={styles.fileIconBox}>
                                            <FileText size={24} color={Colors.primary} />
                                        </View>
                                        <View style={styles.fileInfo}>
                                            <Text style={styles.fileName} numberOfLines={1}>{selectedNotice.fileName}</Text>
                                            <Text style={styles.fileAction}>Download Attachment</Text>
                                        </View>
                                        <Download size={20} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.issuedSection}>
                                <Text style={styles.issuedLabel}>Published by</Text>
                                <Text style={styles.issuedValue}>{selectedNotice?.issuedBy}</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* In-App Document Viewer Modal */}
            <Modal
                visible={viewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => { setViewerVisible(false); setPdfBase64(null); }}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
                    <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
                    
                    <View style={[styles.viewerHeader, { paddingTop: 50 }]}>
                        <TouchableOpacity style={styles.viewerClose} onPress={() => { setViewerVisible(false); setPdfBase64(null); }}>
                            <X size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.viewerTitleText} numberOfLines={1}>{viewerName}</Text>
                        <TouchableOpacity 
                            style={styles.viewerDownload} 
                            onPress={async () => {
                                if (viewerUri) {
                                    try {
                                        const fileUri = FileSystem.cacheDirectory + (viewerName || 'document.pdf');
                                        const downloadRes = await FileSystem.downloadAsync(viewerUri, fileUri);
                                        if (downloadRes.status === 200) {
                                            await Sharing.shareAsync(fileUri);
                                        }
                                    } catch (e) {
                                        Alert.alert('Error', 'Could not download file.');
                                    }
                                }
                            }}
                        >
                            <Download size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.viewerContent}>
                        {viewerUri && viewerType === 'image' ? (
                            <Image source={{ uri: viewerUri }} style={styles.fullImage} contentFit="contain" />
                        ) : viewerUri && viewerType === 'pdf' ? (
                            pdfBase64 ? (
                                    <WebView 
                                        originWhitelist={['*']}
                                        source={{ html: buildPdfHtml(pdfBase64) }}
                                        style={styles.fullWebView}
                                        javaScriptEnabled={true}
                                        domStorageEnabled={true}
                                        allowFileAccess={true}
                                        scalesPageToFit={true}
                                        mixedContentMode="always"
                                    />
                            ) : (
                                <View style={styles.errorView}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={[styles.errorText, { color: '#fff' }]}>Preparing Document Preview...</Text>
                                </View>
                            )
                        ) : (
                            <View style={styles.errorView}>
                                <FileText size={64} color="#666" />
                                <Text style={styles.errorText}>Cannot preview this file type in-app.</Text>
                                <TouchableOpacity 
                                    style={styles.openExternal}
                                    onPress={() => viewerUri && Sharing.shareAsync(viewerUri)}
                                >
                                    <Text style={styles.openExternalText}>Open with External App</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.openExternal, { marginTop: 15, backgroundColor: '#475569' }]}
                                    onPress={() => viewerUri && Linking.openURL(viewerUri)}
                                >
                                    <Text style={styles.openExternalText}>Open in Browser</Text>
                                </TouchableOpacity>
                            </View>
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
        backgroundColor: '#F1F5F9', // Subtle gray-blue background
    },
    listContent: {
        padding: 16,
    },
    noticeCard: {
        backgroundColor: Colors.white,
        borderRadius: 20, // More rounded corners for premium feel
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
        flexDirection: 'row',
    },
    cardAccent: {
        width: 6,
        backgroundColor: Colors.primary,
    },
    cardContent: {
        flex: 1,
        padding: 18,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    noticeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    noticeDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    issuedByWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    issuedByLabel: {
        fontSize: 12,
        color: Colors.textLight,
    },
    issuedByVal: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    dateWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        color: Colors.textLight,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 120,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    attachmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryGhost,
        padding: 12,
        borderRadius: 12,
        marginTop: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: Colors.primaryLight,
    },
    attachmentText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    // Filter Bar
    filterBar: {
        backgroundColor: Colors.white,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterItemActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: Colors.white,
    },
    // Notice Card Enhancements
    attachmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        backgroundColor: Colors.primaryGhost,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    attachmentBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.primary,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        paddingTop: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    closeBtn: {
        padding: 4,
    },
    detailScroll: {
        padding: 24,
    },
    detailTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        lineHeight: 32,
        marginBottom: 16,
    },
    detailMeta: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textLight,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 24,
    },
    detailDesc: {
        fontSize: 16,
        lineHeight: 28,
        color: Colors.textSecondary,
        marginBottom: 32,
    },
    attachmentSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    attachmentBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    fileIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    fileAction: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    issuedSection: {
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginBottom: 40,
    },
    issuedLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginBottom: 4,
    },
    issuedValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    // Viewer Styles
    viewerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    viewerClose: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerTitleText: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    viewerDownload: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerContent: {
        flex: 1,
    },
    fullImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    fullWebView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    viewerLoader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -20,
    },
    errorView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    errorText: {
        color: '#999',
        fontSize: 14,
        marginTop: 20,
        textAlign: 'center',
    },
    openExternal: {
        marginTop: 30,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: 12,
    },
    openExternalText: {
        color: '#fff',
        fontWeight: '700',
    },
});
