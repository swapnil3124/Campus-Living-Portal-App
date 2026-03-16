import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Modal,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import {
    Plus,
    FileText,
    Trash2,
    Calendar,
    Send,
    X,
    AlertCircle,
    Bell,
    CheckCircle2,
    Paperclip,
    Download,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
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

export default function WardenNoticesScreen() {
    const { hostelName: contextHostelName, userName } = useAuth();
    
    const normalizeHostel = (h: string | null) => {
        if (!h) return null;
        const lower = h.toLowerCase().trim();
        if (lower.includes('shivneri')) return 'Shivneri Hostel';
        if (lower.includes('lenyadri')) return 'Lenyadri Hostel';
        if (lower.includes('bhimashankar')) return 'Bhimashankar Hostel';
        if (lower.includes('shwetambara')) return 'Shwetambara Hostel';
        if (lower.includes('saraswati')) return 'Saraswati Hostel';
        if (lower.includes('jijau')) return 'Jijau Hostel';
        return h;
    };

    const hostelName = normalizeHostel(contextHostelName);
    
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Create Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('normal');
    const [category, setCategory] = useState('General');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [publishToHome, setPublishToHome] = useState(false);
    const [publishToStudents, setPublishToStudents] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Filter and Detail states
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedNotice, setSelectedNotice] = useState<any>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    
    // Viewer states
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string | null>(null);
    const [viewerName, setViewerName] = useState('');
    const [viewerType, setViewerType] = useState<'image' | 'pdf' | 'other'>('image');
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

    const fetchNotices = useCallback(async () => {
        if (!hostelName) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/notices?hostelName=${encodeURIComponent(hostelName)}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setNotices(data);
            }
        } catch (error) {
            console.error('Error fetching notices:', error);
        } finally {
            setLoading(false);
        }
    }, [hostelName]);

    const filteredNotices = notices.filter(n => 
        activeFilter === 'all' ? true : n.priority === activeFilter
    );

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            });
            if (!result.canceled) {
                setSelectedFile(result);
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const handleCreateNotice = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);
            
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('hostelName', hostelName || '');
            formData.append('priority', priority);
            formData.append('category', category);
            formData.append('issuedBy', userName || 'Warden');
            formData.append('isPublic', publishToHome.toString());
            formData.append('publishToStudents', publishToStudents.toString());

            if (selectedFile && !selectedFile.canceled) {
                const file = selectedFile.assets[0];
                const fileToUpload = {
                    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
                    name: file.name,
                    type: file.mimeType || 'application/octet-stream',
                };
                formData.append('file', fileToUpload as any);
            }

            const response = await fetch(`${API_URL}/notices`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Notice published successfully');
                setModalVisible(false);
                resetForm();
                fetchNotices();
            }
        } catch (error) {
            console.error('Error creating notice:', error);
            Alert.alert('Error', 'Failed to publish notice');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteNotice = (id: string) => {
        Alert.alert('Delete Notice', 'Are you sure you want to remove this notice?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await fetch(`${API_URL}/notices/${id}`, { method: 'DELETE' });
                        if (response.ok) {
                            fetchNotices();
                        }
                    } catch (error) {
                        console.error('Error deleting notice:', error);
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('normal');
        setCategory('General');
        setSelectedFile(null);
        setPublishToHome(false);
        setPublishToStudents(true);
    };

    const handleOpenDetail = (notice: any) => {
        setSelectedNotice(notice);
        setDetailVisible(true);
    };

    const handleViewFileFromDetail = async (url: string, name: string) => {
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
                const response = await FileSystem.downloadAsync(fullUrl, FileSystem.cacheDirectory + 'temp_warden.pdf');
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
                                {f === 'all' ? 'All Notices' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : filteredNotices.length > 0 ? (
                    filteredNotices.map((notice, idx) => (
                        <TouchableOpacity 
                            key={notice._id || idx} 
                            style={styles.noticeCard}
                            onPress={() => handleOpenDetail(notice)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[notice.priority]?.bg }]}>
                                    <Text style={[styles.priorityText, { color: priorityConfig[notice.priority]?.color }]}>
                                        {priorityConfig[notice.priority]?.label.toUpperCase()}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotice(notice._id);
                                }}>
                                    <Trash2 size={18} color={Colors.error} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                            <Text style={styles.noticeDesc} numberOfLines={2}>{notice.description}</Text>

                            <View style={styles.cardFooter}>
                                <View style={styles.footerInfo}>
                                    <Bell size={12} color={Colors.textLight} />
                                    <Text style={styles.footerText}>{notice.category}</Text>
                                    {notice.fileUrl && <Paperclip size={12} color={Colors.primary} style={{ marginLeft: 6 }} />}
                                </View>
                                <Text style={styles.timestamp}>{new Date(notice.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <FileText size={64} color={Colors.border} />
                        <Text style={styles.emptyText}>No notices found</Text>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
            >
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.fabGradient}>
                    <Plus size={28} color={Colors.white} />
                </LinearGradient>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Notice</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter notice title"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="What is this notice about?"
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                            />

                            <Text style={styles.label}>Priority</Text>
                            <View style={styles.priorityOptions}>
                                {Object.keys(priorityConfig).map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.priorityOption,
                                            priority === p && { borderColor: priorityConfig[p].color, backgroundColor: priorityConfig[p].bg }
                                        ]}
                                        onPress={() => setPriority(p)}
                                    >
                                        <Text style={[
                                            styles.priorityOptionText,
                                            priority === p && { color: priorityConfig[p].color }
                                        ]}>
                                            {priorityConfig[p].label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Category</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Mess, Maintenance, Event"
                                value={category}
                                onChangeText={setCategory}
                            />

                            <Text style={styles.label}>Publishing Options</Text>
                            <View style={styles.optionsContainer}>
                                <TouchableOpacity 
                                    style={styles.optionItem} 
                                    onPress={() => setPublishToHome(!publishToHome)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, publishToHome && styles.checkboxChecked]}>
                                        {publishToHome && <CheckCircle2 size={14} color="#FFF" />}
                                    </View>
                                    <View>
                                        <Text style={styles.optionTitle}>Publish to Home page</Text>
                                        <Text style={styles.optionDesc}>Visible to everyone on the landing page</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.optionItem} 
                                    onPress={() => setPublishToStudents(!publishToStudents)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, publishToStudents && styles.checkboxChecked]}>
                                        {publishToStudents && <CheckCircle2 size={14} color="#FFF" />}
                                    </View>
                                    <View>
                                        <Text style={styles.optionTitle}>Publish to Student</Text>
                                        <Text style={styles.optionDesc}>Visible only to students of your hostel</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Attachment (Optional)</Text>
                            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocument}>
                                <Paperclip size={20} color={selectedFile ? Colors.primary : Colors.textLight} />
                                <Text style={[styles.uploadBtnText, selectedFile && { color: Colors.primary }]}>
                                    {selectedFile && !selectedFile.canceled ? selectedFile.assets[0].name : 'Attach Circular (PDF/Image)'}
                                </Text>
                                {selectedFile && (
                                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                        <X size={16} color={Colors.error} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleCreateNotice}
                                disabled={submitting}
                            >
                                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.submitGradient}>
                                    {submitting ? (
                                        <ActivityIndicator size="small" color={Colors.white} />
                                    ) : (
                                        <>
                                            <Send size={20} color={Colors.white} />
                                            <Text style={styles.submitText}>Publish Notice</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Notice Detail Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={detailVisible}
                onRequestClose={() => setDetailVisible(false)}
            >
                <View style={styles.detailOverlay}>
                    <View style={styles.detailContent}>
                        <View style={styles.detailHeader}>
                            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[selectedNotice?.priority || 'normal']?.bg }]}>
                                <Text style={[styles.priorityText, { color: priorityConfig[selectedNotice?.priority || 'normal']?.color }]}>
                                    {(priorityConfig[selectedNotice?.priority || 'normal']?.label || 'NORMAL').toUpperCase()}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setDetailVisible(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.detailTitle}>{selectedNotice?.title}</Text>
                            <View style={styles.detailMeta}>
                                <View style={styles.metaItem}>
                                    <Calendar size={14} color={Colors.textLight} />
                                    <Text style={styles.metaText}>{selectedNotice ? new Date(selectedNotice.createdAt).toLocaleDateString() : ''}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Bell size={14} color={Colors.textLight} />
                                    <Text style={styles.metaText}>{selectedNotice?.category}</Text>
                                </View>
                            </View>

                            <View style={styles.detailDivider} />
                            
                            <Text style={styles.detailDesc}>{selectedNotice?.description}</Text>

                            {selectedNotice?.fileUrl && (
                                <View style={styles.detailAttachmentBox}>
                                    <Text style={styles.attachmentLabel}>Attached Document</Text>
                                    <TouchableOpacity 
                                        style={styles.attachmentPreview}
                                        onPress={() => handleViewFileFromDetail(selectedNotice.fileUrl, selectedNotice.fileName)}
                                    >
                                        <FileText size={24} color={Colors.primary} />
                                        <View style={styles.attachmentInfo}>
                                            <Text style={styles.attachmentName} numberOfLines={1}>{selectedNotice.fileName}</Text>
                                            <Text style={styles.attachmentAction}>Tap to Open / Download</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                            
                            <View style={styles.issuedBox}>
                                <Text style={styles.issuedLabel}>Published by</Text>
                                <Text style={styles.issuedName}>{selectedNotice?.issuedBy}</Text>
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
        backgroundColor: '#F8FAFC',
    },
    listContent: {
        padding: 16,
    },
    noticeCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
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
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    noticeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 6,
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
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    timestamp: {
        fontSize: 11,
        color: Colors.textLight,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textLight,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        borderRadius: 30,
        elevation: 6,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    modalForm: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    priorityOptions: {
        flexDirection: 'row',
        gap: 10,
    },
    priorityOption: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    priorityOptionText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textLight,
    },
    submitBtn: {
        marginTop: 30,
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        gap: 10,
    },
    uploadBtnText: {
        flex: 1,
        fontSize: 14,
        color: Colors.textLight,
    },
    optionsContainer: {
        gap: 12,
        marginTop: 4,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    checkboxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    optionDesc: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 1,
    },
    // Filter Bar Styles
    filterBar: {
        backgroundColor: Colors.white,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
    // Detail Modal Styles
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    detailContent: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 12,
    },
    detailMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
    },
    detailDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 20,
    },
    detailDesc: {
        fontSize: 16,
        lineHeight: 26,
        color: Colors.textSecondary,
        marginBottom: 30,
    },
    detailAttachmentBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    attachmentLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textLight,
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 12,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    attachmentInfo: {
        flex: 1,
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    attachmentAction: {
        fontSize: 12,
        color: Colors.primary,
        marginTop: 2,
    },
    issuedBox: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    issuedLabel: {
        fontSize: 11,
        color: Colors.textLight,
        marginBottom: 2,
    },
    issuedName: {
        fontSize: 14,
        fontWeight: '600',
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
    loader: {
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
