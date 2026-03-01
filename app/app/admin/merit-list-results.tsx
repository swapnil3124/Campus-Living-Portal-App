import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    Alert,
    Linking,
    FlatList,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Download,
    User,
    GraduationCap,
    CheckCircle2,
    Search,
    Filter,
    XCircle,
    Building2,
    Calendar,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAdmissionStore } from '@/store/admission-store';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
    Trash2,
    Send,
    FileSpreadsheet,
    CheckCheck,
    AlertCircle,
    FileText,
    Eye,
    Phone,
    Mail,
    MapPin,
    Hash,
    Layers,
    Info,
    ChevronRight,
    Maximize2,
    X,
    ExternalLink,
    Key,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as XLSX from 'xlsx';

export default function MeritListResultsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { meritLists, admissions, isLoading, publishMeritList, deleteMeritList, fetchMeritLists, fetchAdmissions, getAdmissionById, regConfig } = useAdmissionStore();
    const [viewingStudent, setViewingStudent] = useState<any | null>(null);
    const [fullStudentData, setFullStudentData] = useState<any | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const { hostelName, role } = useAuth();

    const [selectedRectorHostel, setSelectedRectorHostel] = useState<string | null>(null);

    const isBoysHostel = ['shivneri', 'lenyadri', 'bhimashankar'].includes(hostelName?.toLowerCase() || '');
    const isGirlsHostel = ['saraswati', 'shwetambara', 'shwetamber', 'girls'].includes(hostelName?.toLowerCase() || '');
    const isWarden = role === 'admin' && (isBoysHostel || isGirlsHostel);
    const isRector = role === 'rector' && ['boys', 'girls'].includes(hostelName?.toLowerCase() || '');

    React.useEffect(() => {
        fetchMeritLists();
        if (admissions.length === 0) fetchAdmissions();
    }, []);

    const availableHostels = React.useMemo(() => {
        if (!isRector) return [];
        if (hostelName?.toLowerCase() === 'boys') return ['Shivneri', 'Lenyadri', 'Bhimashankar'];
        if (hostelName?.toLowerCase() === 'girls') return ['Saraswati', 'Shwetambara'];
        return [];
    }, [isRector, hostelName]);

    React.useEffect(() => {
        if (isRector && availableHostels.length > 0 && !selectedRectorHostel) {
            setSelectedRectorHostel(availableHostels[0]);
        }
    }, [isRector, availableHostels, selectedRectorHostel]);

    // In-app Viewer State (images use a separate viewer; PDFs expand inline inside the modal)
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string | null>(null);
    const [viewerName, setViewerName] = useState('');
    const [viewerType, setViewerType] = useState<'image' | 'pdf' | 'other'>('image');

    // Fullscreen PDF state — shown as overlay INSIDE the student detail modal
    const [fullscreenPdfUri, setFullscreenPdfUri] = useState<string | null>(null);
    const [fullscreenPdfName, setFullscreenPdfName] = useState('');

    // Build a proper HTML page with PDF.js to render the PDF inline
    const buildPdfHtml = (dataUri: string) => {
        // Extract just the base64 string (strip the data URI prefix, e.g. "data:application/pdf;base64,")
        const base64 = dataUri.startsWith('data:')
            ? dataUri.split(',')[1] ?? dataUri
            : dataUri;

        return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      min-height: 100%;
      background: #1e1e2e;
      overflow-x: hidden;
    }
    #loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #a0aec0;
      font-family: -apple-system, sans-serif;
      font-size: 15px;
      gap: 14px;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid rgba(255,255,255,0.15);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #error {
      color: #fc8181;
      font-family: -apple-system, sans-serif;
      font-size: 14px;
      text-align: center;
      padding: 40px 20px;
    }
    #container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 0;
      gap: 6px;
    }
    .page-wrapper {
      width: 100%;
      position: relative;
      background: white;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: auto !important;
    }
    .page-num {
      position: absolute;
      bottom: 6px;
      right: 10px;
      background: rgba(0,0,0,0.45);
      color: white;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 999px;
      font-family: -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div><span>Loading PDF…</span></div>
  <div id="error" style="display:none"></div>
  <div id="container"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    var base64Data = '${base64}';

    // Convert base64 to Uint8Array
    function base64ToUint8Array(b64) {
      var bin = atob(b64);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr;
    }

    var pdfData = base64ToUint8Array(base64Data);

    pdfjsLib.getDocument({ data: pdfData }).promise.then(function(pdf) {
      document.getElementById('loading').style.display = 'none';
      var container = document.getElementById('container');
      var total = pdf.numPages;

      function renderPage(num) {
        pdf.getPage(num).then(function(page) {
          var vp0 = page.getViewport({ scale: 1 });
          var scale = (window.innerWidth * window.devicePixelRatio) / vp0.width;
          var viewport = page.getViewport({ scale: scale });

          var wrapper = document.createElement('div');
          wrapper.className = 'page-wrapper';

          var canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          var label = document.createElement('div');
          label.className = 'page-num';
          label.textContent = num + ' / ' + total;

          wrapper.appendChild(canvas);
          wrapper.appendChild(label);
          container.appendChild(wrapper);

          page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });
          if (num < total) renderPage(num + 1);
        });
      }

      renderPage(1);
    }).catch(function(err) {
      document.getElementById('loading').style.display = 'none';
      var el = document.getElementById('error');
      el.style.display = 'block';
      el.textContent = 'Could not load PDF: ' + (err && err.message ? err.message : err);
    });
  </script>
</body>
</html>`;
    };

    const isFile = (value: any) => {
        if (!value) return false;
        if (typeof value === 'string') {
            return value.startsWith('data:') ||
                /\.(pdf|jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(value) ||
                value.includes('firebasestorage') ||
                value.includes('cloudinary') ||
                value.includes('blob:');
        }
        if (typeof value === 'object' && value !== null) {
            return value.base64 || value.uri || value.url;
        }
        return false;
    };

    const getFileUri = (value: any) => {
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value !== null) return value.base64 || value.uri;
        return null;
    };

    const getFileName = (key: string, value: any) => {
        if (typeof value === 'object' && value !== null && value.name) return value.name;

        // Handle ID keys - if it looks like a timestamp/ID, try to find the label from regConfig
        const field = regConfig.pages.flatMap(p => p.fields).find(f => f.id === key);
        if (field) return field.label;

        return key.replace(/([A-Z])/g, ' $1').trim();
    };

    const isImageFile = (value: any) => {
        if (!value) return false;
        if (typeof value === 'object' && value !== null) {
            if (value.type?.startsWith('image/')) return true;
            const uri = value.base64 || value.uri || value.url;
            if (typeof uri === 'string') {
                return uri.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(uri);
            }
        }
        if (typeof value === 'string') {
            return value.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(value);
        }
        return false;
    };

    const isPdfFile = (value: any) => {
        if (!value) return false;
        if (typeof value === 'string') {
            return value.startsWith('data:application/pdf') || value.endsWith('.pdf') || value.includes('.pdf?');
        }
        if (typeof value === 'object' && value !== null) {
            return value.type === 'application/pdf' || (value.name && value.name.endsWith('.pdf'));
        }
        return false;
    };

    const handleViewDocument = (uri: string, name: string) => {
        const isImg = isImageFile(uri) || uri.startsWith('data:image/');
        const isPdf = isPdfFile(uri) || uri.startsWith('data:application/pdf') || uri.includes('.pdf');

        if (isPdf) {
            setFullscreenPdfUri(uri);
            setFullscreenPdfName(name);
        } else {
            setViewerUri(uri);
            setViewerName(name);
            setViewerType(isImg ? 'image' : 'other');
            setViewerVisible(true);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Group merit lists by department and only take the newest one for each
    const latestListsMap = new Map();
    meritLists.forEach(list => {
        // Rector ONLY sees lists from wardens that have been sent for review or published
        if (isRector && list.status === 'draft') return;

        // Group ALL lists strictly by department so we never have duplicate generation objects
        if (!latestListsMap.has(list.department) || new Date(list.generatedAt) > new Date(latestListsMap.get(list.department).generatedAt)) {
            latestListsMap.set(list.department, list);
        }
    });

    const latestLists = Array.from(latestListsMap.values());

    // Combine all students from all departments
    const allShortlisted = latestLists.flatMap(list =>
        list.students.map((s: any) => ({
            ...s,
            deptName: list.department,
            listId: list._id,
            listStatus: list.status
        }))
    );

    // Filter Students based on Warden's Hostel
    const allStudents = React.useMemo(() => {
        let result = [...allShortlisted];
        const hNameRaw = isRector && selectedRectorHostel ? selectedRectorHostel.toLowerCase() : (hostelName?.toLowerCase() || '');

        // If it's a warden/admin with a specific hostel, restrict view
        if (hostelName) {
            if (hNameRaw === 'shivneri') {
                result = result.filter(s => s.year === '1st' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'lenyadri') {
                result = result.filter(s => s.year === '2nd' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'bhimashankar') {
                result = result.filter(s => s.year === '3rd' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'saraswati' || hNameRaw === 'shwetamber' || hNameRaw === 'shwetambara') {
                result = result.filter(s => s.gender?.toLowerCase() === 'female');
            } else if (hNameRaw === 'boys') {
                result = result.filter(s => s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'girls') {
                result = result.filter(s => s.gender?.toLowerCase() === 'female');
            }
        }
        return result;
    }, [allShortlisted, hostelName, role, selectedRectorHostel]);

    const departments = Array.from(new Set(allStudents.map(s => s.deptName))).sort();

    const filteredStudents = allStudents.filter((s: any) =>
        (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.enrollment || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Default sort by marks
    filteredStudents.sort((a, b) => b.prevMarks - a.prevMarks);

    const draftWardenLists = React.useMemo(() => {
        if (!isWarden) return [];
        return latestLists.filter(l =>
            l.status === 'draft' &&
            l.students.some((s: any) => allStudents.some(as => as.admissionId === s.admissionId))
        );
    }, [latestLists, allStudents, isWarden]);

    const hasDraftWardenLists = draftWardenLists.length > 0;


    const handleExportXLSX = async () => {
        if (allStudents.length === 0 || isExporting) return;
        setIsExporting(true);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Sort by department for Excel
            const exportData = [...allStudents].sort((a, b) => a.deptName.localeCompare(b.deptName));

            // Prepare data for Excel
            // Fields: Student Name, Enrollment No, Dept Name, Category
            const data = exportData.map((s: any) => ({
                'Student Name': s.fullName,
                'Enrollment No': s.enrollment,
                'Dept Name': s.deptName,
                'Category': s.category
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(data);

            // Set column widths
            ws['!cols'] = [
                { wch: 30 }, // Name
                { wch: 20 }, // Enrollment
                { wch: 35 }, // Department
                { wch: 15 }  // Category
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Merit List');

            // Generate base64 string
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            const currentYear = new Date().getFullYear();
            const fileName = `Merit_list_${currentYear}.xlsx`;
            const fileUri = FileSystem.cacheDirectory + fileName;

            // Save to file system as base64
            await FileSystem.writeAsStringAsync(fileUri, wbout, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Export Error:', error);
            Alert.alert('Error', 'Failed to generate Excel file');
        } finally {
            setIsExporting(false);
        }
    };

    const handleBulkPublish = async () => {
        if (isWarden) {
            if (!hasDraftWardenLists) {
                Alert.alert('Info', 'All your student merit lists have already been sent.');
                return;
            }

            Alert.alert(
                'Send to Rector',
                `This will send ${allStudents.length} shortlisted students to the Boys Rector for final review. Continue?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Send',
                        onPress: async () => {
                            setIsPublishing(true);
                            try {
                                let successCount = 0;
                                const { sendToRector } = useAdmissionStore.getState();
                                for (const list of draftWardenLists) {
                                    const success = await sendToRector(list._id);
                                    if (success) successCount++;
                                }

                                if (successCount > 0) {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    Alert.alert('Success', `Successfully sent ${allStudents.length} students to the Rector for final review.`);
                                    await useAdmissionStore.getState().fetchMeritLists();
                                } else {
                                    Alert.alert('Error', 'Failed to send students.');
                                }
                            } catch (e) {
                                Alert.alert('Error', 'An unexpected error occurred during sending.');
                            } finally {
                                setIsPublishing(false);
                            }
                        }
                    }
                ]
            );
            return;
        }

        if (isRector) {
            const rectorReviewLists = latestLists.filter(l => l.status === 'sent_to_rector');
            if (rectorReviewLists.length === 0) {
                Alert.alert('Info', 'There are no pending merit lists to publish to the homepage.');
                return;
            }

            Alert.alert(
                'Publish to Homepage',
                `This will officially publish ${rectorReviewLists.length} hostel merit lists to the application homepage. Continue?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Publish',
                        onPress: async () => {
                            setIsPublishing(true);
                            try {
                                let successCount = 0;
                                const { publishMeritList } = useAdmissionStore.getState();
                                for (const list of rectorReviewLists) {
                                    const success = await publishMeritList(list._id);
                                    if (success) successCount++;
                                }

                                if (successCount > 0) {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    Alert.alert('Success', `Published ${successCount} lists to the Homepage.`);
                                    await useAdmissionStore.getState().fetchMeritLists();
                                } else {
                                    Alert.alert('Error', 'Failed to publish lists.');
                                }
                            } catch (e) {
                                Alert.alert('Error', 'An unexpected error occurred while publishing.');
                            } finally {
                                setIsPublishing(false);
                            }
                        }
                    }
                ]
            );
            return;
        }

        const unpublishedLists = latestLists.filter(l => l.status !== 'published');
        if (unpublishedLists.length === 0) {
            Alert.alert('Info', 'All merit lists are already published.');
            return;
        }

        Alert.alert(
            'Publish All Lists',
            `This will publish ${unpublishedLists.length} department lists and accept all shortlisted students. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Publish All',
                    onPress: async () => {
                        setIsPublishing(true);
                        try {
                            let successCount = 0;
                            const { publishMeritList } = useAdmissionStore.getState();
                            for (const list of unpublishedLists) {
                                const success = await publishMeritList(list._id);
                                if (success) successCount++;
                            }

                            if (successCount > 0) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                Alert.alert('Success', `Published ${successCount} department lists.`);
                                await useAdmissionStore.getState().fetchMeritLists();
                            } else {
                                Alert.alert('Error', 'Failed to publish lists.');
                            }
                        } catch (e) {
                            Alert.alert('Error', 'An unexpected error occurred while publishing.');
                        } finally {
                            setIsPublishing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleGeneratePasswords = async () => {
        // Let rector click generate passwords on ALL published lists
        const publishedLists = latestLists.filter(l => l.status === 'published');
        if (publishedLists.length === 0) {
            Alert.alert('Info', 'You must Publish merit lists to the home page first before generating passwords.');
            return;
        }

        Alert.alert(
            'Generate Emails & Passwords',
            `This will generate secure login passwords and instantly send emails to all students from the ${publishedLists.length} published merit lists. Proceed?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate and Send',
                    onPress: async () => {
                        setIsPublishing(true);
                        try {
                            let successCount = 0;
                            const { generatePasswords } = useAdmissionStore.getState();
                            for (const list of publishedLists) {
                                const success = await generatePasswords(list._id);
                                if (success) successCount++;
                            }

                            if (successCount > 0) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                Alert.alert('Success', `Emails and Passwords dispatched for students in ${successCount} lists.`);
                            } else {
                                Alert.alert('Error', 'Failed to dispatch emails.');
                            }
                        } catch (e) {
                            Alert.alert('Error', 'An unexpected error occurred generating passwords.');
                        } finally {
                            setIsPublishing(false);
                        }
                    }
                }
            ]
        );
    };


    return (
        <>
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Shortlisted Students</Text>
                    <TouchableOpacity
                        style={[styles.downloadBtn, isExporting && { opacity: 0.5 }]}
                        onPress={handleExportXLSX}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <FileSpreadsheet size={20} color={Colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>

                {isRector && availableHostels.length > 0 && (
                    <View style={styles.rectorTabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rectorTabsScroll}>
                            {availableHostels.map(hostel => {
                                const isActive = selectedRectorHostel === hostel;
                                return (
                                    <TouchableOpacity
                                        key={hostel}
                                        style={[styles.rectorTab, isActive && styles.rectorTabActive]}
                                        onPress={() => setSelectedRectorHostel(hostel)}
                                    >
                                        <Text style={[styles.rectorTabText, isActive && styles.rectorTabTextActive]}>
                                            {hostel}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Analyzing Applications...</Text>
                    </View>
                ) : allStudents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        {isRector ? (
                            <>
                                <Text style={styles.emptyTitle}>Admission Review Empty</Text>
                                <Text style={styles.emptyText}>Waiting for Hostel Wardens to finalize and send their merit lists for your review.</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.emptyTitle}>No Generated Data</Text>
                                <Text style={styles.emptyText}>Analyze registered student data first by generating a merit list from the config screen.</Text>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => router.replace('/admin/merit-list-settings')}
                                >
                                    <Text style={styles.actionBtnText}>Go to Config</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>

                        <FlatList
                            data={filteredStudents}
                            keyExtractor={(student, index) => `${student.enrollment}-${index}`}
                            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                            showsVerticalScrollIndicator={false}
                            style={styles.content}
                            ListHeaderComponent={
                                <>
                                    <View style={styles.summaryCard}>
                                        <View style={styles.summaryHeader}>
                                            <View style={styles.iconCircle}>
                                                <GraduationCap size={18} color={Colors.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.summaryTitle}>Shortlisted Overview</Text>
                                                <Text style={styles.summaryDate}>
                                                    Across {latestLists.length} Departments
                                                </Text>
                                            </View>
                                            <View style={[styles.badge, (isWarden ? !hasDraftWardenLists : latestLists.every(l => l.status === 'published')) && { backgroundColor: '#2DCE89' }]}>
                                                <Text style={styles.badgeText}>{isWarden ? (!hasDraftWardenLists ? 'SENT TO RECTOR' : 'PENDING') : (latestLists.every(l => l.status === 'published') ? 'ALL PUBLISHED' : 'PENDING PUBLISH')}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.summaryGrid}>
                                            <View style={styles.summaryItem}>
                                                <Text style={styles.summaryLabel}>Total Departments</Text>
                                                <Text style={styles.summaryValue}>{departments.length}</Text>
                                            </View>
                                            <View style={styles.summaryItem}>
                                                <Text style={styles.summaryLabel}>Total Shortlisted</Text>
                                                <Text style={styles.summaryValue}>{allStudents.length}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {hostelName && !isRector && (
                                        <View style={[styles.summaryCard, { backgroundColor: Colors.primary + '05', borderColor: Colors.primary + '20', marginBottom: 16 }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <Building2 size={18} color={Colors.primary} />
                                                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    {hostelName} Hostel Merit List
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.searchContainer}>
                                        <Search size={18} color={Colors.textLight} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search Name or Enrollment..."
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholderTextColor={Colors.textLight}
                                        />
                                        {searchQuery.length > 0 && (
                                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                                <XCircle size={18} color={Colors.textLight} />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={styles.actionsRow}>
                                        {!isRector && (
                                            <View style={[styles.actionIconButton, { backgroundColor: '#F8F9FA' }]}>
                                                <Filter size={18} color={Colors.textSecondary} />
                                                <Text style={[styles.actionIconText, { color: Colors.textSecondary }]}>
                                                    Categorized View
                                                </Text>
                                            </View>
                                        )}

                                        {isRector && (
                                            <TouchableOpacity
                                                style={[styles.actionIconButton, { backgroundColor: '#F57C00' }, isPublishing && { opacity: 0.7 }]}
                                                onPress={handleGeneratePasswords}
                                                disabled={isPublishing}
                                            >
                                                {isPublishing ? (
                                                    <ActivityIndicator size="small" color={Colors.white} />
                                                ) : (
                                                    <>
                                                        <Key size={18} color={Colors.white} />
                                                        <Text style={[styles.actionIconText, { color: Colors.white }]}>Generate Password</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}

                                        {!isRector && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionIconButton,
                                                    styles.publishBtn,
                                                    (isPublishing || (isWarden ? !hasDraftWardenLists : !latestLists.some(l => l.status !== 'published'))) && { opacity: 0.5 }
                                                ]}
                                                onPress={handleBulkPublish}
                                                disabled={isPublishing || (isWarden ? !hasDraftWardenLists : !latestLists.some(l => l.status !== 'published'))}
                                            >
                                                {isPublishing ? (
                                                    <ActivityIndicator size="small" color={Colors.white} />
                                                ) : (
                                                    <>
                                                        {isWarden ? (
                                                            <>
                                                                {hasDraftWardenLists ? <Send size={18} color={Colors.white} /> : <CheckCheck size={18} color={Colors.white} />}
                                                                <Text style={[styles.actionIconText, { color: Colors.white }]}>{hasDraftWardenLists ? 'Send to Rector' : 'Sent to Rector'}</Text>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {latestLists.some(l => l.status !== 'published') ? <Send size={18} color={Colors.white} /> : <CheckCheck size={18} color={Colors.white} />}
                                                                <Text style={[styles.actionIconText, { color: Colors.white }]}>{latestLists.some(l => l.status !== 'published') ? 'Publish All' : 'All Published'}</Text>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}

                                        {isRector && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionIconButton,
                                                    styles.publishBtn,
                                                    (isPublishing || !latestLists.some(l => l.status === 'sent_to_rector')) && { opacity: 0.5 }
                                                ]}
                                                onPress={handleBulkPublish}
                                                disabled={isPublishing || !latestLists.some(l => l.status === 'sent_to_rector')}
                                            >
                                                {isPublishing ? (
                                                    <ActivityIndicator size="small" color={Colors.white} />
                                                ) : (
                                                    <>
                                                        {latestLists.some(l => l.status === 'sent_to_rector') ? <Send size={18} color={Colors.white} /> : <CheckCheck size={18} color={Colors.white} />}
                                                        <Text style={[styles.actionIconText, { color: Colors.white }]}>{latestLists.some(l => l.status === 'sent_to_rector') ? 'Publish to Home Page' : 'All Published'}</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={styles.sectionHeaderLine}>
                                        <Text style={styles.sectionTitle}>Merit Ranking</Text>
                                        <View style={styles.line} />
                                    </View>
                                </>
                            }
                            ListEmptyComponent={
                                <View style={styles.noStudents}>
                                    <AlertCircle size={32} color={Colors.textLight} style={{ marginBottom: 12 }} />
                                    <Text style={styles.noStudentsText}>
                                        {searchQuery ? 'No students match your search.' : 'No shortlisted students found.'}
                                    </Text>
                                </View>
                            }
                            renderItem={({ item: student, index }) => (
                                <TouchableOpacity
                                    key={`${student.enrollment}-${index}`}
                                    style={styles.studentCard}
                                    onPress={async () => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        setViewingStudent(student);

                                        // Fetch full data
                                        if (student.admissionId) {
                                            setIsDetailLoading(true);
                                            const fullData = await getAdmissionById(student.admissionId);
                                            setFullStudentData(fullData);
                                            setIsDetailLoading(false);
                                        }
                                    }}
                                >
                                    <View style={[styles.rankBadge, student.rank <= 3 && styles.topRank]}>
                                        <Text style={[styles.rankText, student.rank <= 3 && styles.topRankText]}>
                                            {student.rank}
                                        </Text>
                                    </View>
                                    <View style={styles.cardAvatar}>
                                        {(() => {
                                            const photo = student.photoUrl || admissions.find((a: any) => a.id === student.admissionId)?.photoUrl;
                                            return photo ? (
                                                <Image source={{ uri: photo }} style={styles.avatarImage} contentFit="cover" />
                                            ) : (
                                                <User size={22} color={Colors.primary} />
                                            );
                                        })()}
                                    </View>
                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentName}>{student.fullName}</Text>
                                        <Text style={styles.studentSub}>{student.deptName}</Text>

                                        <View style={styles.tagRow}>
                                            <View style={styles.selectionTag}>
                                                <Text style={styles.selectionTagText}>{student.selectionCategory}</Text>
                                            </View>
                                            <View style={[styles.tag, { backgroundColor: '#F1F3F5' }]}>
                                                <Text style={styles.tagTextSmall}>{student.category}</Text>
                                            </View>
                                            <View style={[styles.tag, { backgroundColor: Colors.primary + '10' }]}>
                                                <Text style={[styles.tagTextSmall, { color: Colors.primary }]}>{student.year} {student.gender}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.marksContainer}>
                                        <Text style={styles.marksValue}>{student.prevMarks}%</Text>
                                        <Text style={styles.marksLabel}>{student.enrollment}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Student Detail Modal */}
                <Modal
                    visible={!!viewingStudent}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => {
                        if (fullscreenPdfUri) {
                            setFullscreenPdfUri(null);
                        } else {
                            setViewingStudent(null);
                            setFullStudentData(null);
                        }
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { marginTop: insets.top + 20 }]}>
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Registration Details</Text>
                                    <Text style={styles.modalSub}>Complete application data</Text>
                                </View>
                                <TouchableOpacity onPress={() => {
                                    setViewingStudent(null);
                                    setFullStudentData(null);
                                }}>
                                    <XCircle size={28} color={Colors.textLight} />
                                </TouchableOpacity>
                            </View>

                            {isDetailLoading ? (
                                <View style={styles.modalLoading}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.modalLoadingText}>Loading full application...</Text>
                                </View>
                            ) : viewingStudent && (
                                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                    <View style={styles.detailHero}>
                                        <View style={styles.avatar}>
                                            {fullStudentData?.photoUrl ? (
                                                <Image source={{ uri: fullStudentData.photoUrl }} style={styles.fullAvatar} contentFit="cover" />
                                            ) : (
                                                <User size={60} color={Colors.primary} />
                                            )}
                                        </View>
                                        <Text style={styles.heroName}>{viewingStudent.fullName}</Text>
                                        <Text style={styles.heroSub}>{viewingStudent.enrollment}</Text>

                                        <View style={styles.statusBadgeLarge}>
                                            <CheckCircle2 size={18} color={Colors.white} />
                                            <Text style={styles.statusBadgeText}>PROVISIONALLY SHORTLISTED</Text>
                                        </View>
                                    </View>

                                    {/* Merit Selection Metadata */}
                                    <Text style={styles.sectionHeading}>Selection Analysis</Text>
                                    <View style={styles.infoSection}>
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoLabelGroup}>
                                                <Hash size={16} color={Colors.textSecondary} />
                                                <Text style={styles.infoLabel}>Merit Rank</Text>
                                            </View>
                                            <Text style={styles.infoValue}>#{viewingStudent.rank}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoLabelGroup}>
                                                <Layers size={16} color={Colors.textSecondary} />
                                                <Text style={styles.infoLabel}>Selection Quota</Text>
                                            </View>
                                            <View style={[styles.tag, { backgroundColor: Colors.primary + '15' }]}>
                                                <Text style={[styles.tagText, { color: Colors.primary }]}>{viewingStudent.selectionCategory}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoLabelGroup}>
                                                <Building2 size={16} color={Colors.textSecondary} />
                                                <Text style={styles.infoLabel}>Department</Text>
                                            </View>
                                            <Text style={styles.infoValue}>{viewingStudent.deptName}</Text>
                                        </View>
                                    </View>

                                    {regConfig.pages.map((page) => (
                                        <View key={page.id} style={{ marginBottom: 24 }}>
                                            <Text style={styles.sectionHeading}>{page.title}</Text>
                                            <View style={styles.infoSection}>
                                                {page.fields.map((field, fIdx) => {
                                                    const value = field.id === 'fullName' ? (fullStudentData?.fullName || viewingStudent.fullName) :
                                                        field.id === 'enrollment' ? (fullStudentData?.enrollment || viewingStudent.enrollment) :
                                                            field.id === 'email' ? (fullStudentData?.email || viewingStudent.email) :
                                                                field.id === 'phone' ? (fullStudentData?.phone) :
                                                                    field.id === 'department' ? (fullStudentData?.department || viewingStudent.deptName) :
                                                                        field.id === 'year' ? (fullStudentData?.year) :
                                                                            field.id === 'prevMarks' ? (fullStudentData?.prevMarks || viewingStudent.prevMarks) :
                                                                                field.id === 'category' ? (fullStudentData?.category || viewingStudent.category) :
                                                                                    field.id === 'gender' ? (fullStudentData?.gender) :
                                                                                        field.id === 'studentPhoto' ? (fullStudentData?.photoUrl || viewingStudent.photoUrl) :
                                                                                            fullStudentData?.additionalData?.[field.id];

                                                    if (!value && field.type !== 'file' && field.type !== 'image') return null;

                                                    if ((field.type === 'file' || field.type === 'image') && value) {
                                                        const uri = getFileUri(value);
                                                        const name = field.label; // Use labels for names
                                                        const isImg = isImageFile(value) || (typeof uri === 'string' && (uri.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(uri)));
                                                        const isPdf = isPdfFile(value) || (typeof uri === 'string' && (uri.startsWith('data:application/pdf') || uri.includes('.pdf')));

                                                        if (isImg && uri) {
                                                            return (
                                                                <View key={field.id} style={[styles.imageAttachmentWrapper, { marginTop: 12 }]}>
                                                                    <View style={styles.imageAttachmentHeader}>
                                                                        <FileText size={16} color={Colors.primary} />
                                                                        <Text style={styles.imageAttachmentName}>{name}</Text>
                                                                    </View>
                                                                    <View style={styles.imageFrame}>
                                                                        <Image
                                                                            source={{ uri }}
                                                                            style={styles.attachedImage}
                                                                            contentFit="contain"
                                                                        />
                                                                        <TouchableOpacity
                                                                            style={styles.maximizeBtn}
                                                                            onPress={() => handleViewDocument(uri, name)}
                                                                            activeOpacity={0.7}
                                                                        >
                                                                            <Maximize2 size={16} color={Colors.white} />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            );
                                                        }

                                                        if (isPdf && uri) {
                                                            return (
                                                                <View key={field.id} style={[styles.imageAttachmentWrapper, { marginTop: 12 }]}>
                                                                    <View style={styles.imageAttachmentHeader}>
                                                                        <FileText size={16} color={Colors.primary} />
                                                                        <Text style={styles.imageAttachmentName}>{name}</Text>
                                                                        <View style={styles.pdfBadge}>
                                                                            <Text style={styles.pdfBadgeText}>PDF</Text>
                                                                        </View>
                                                                    </View>
                                                                    <View style={styles.pdfFrame}>
                                                                        <SafePdfViewer
                                                                            uri={uri}
                                                                            buildHtml={buildPdfHtml}
                                                                            style={styles.pdfWebView}
                                                                        />
                                                                        <TouchableOpacity
                                                                            style={styles.maximizeBtn}
                                                                            onPress={() => {
                                                                                setFullscreenPdfUri(uri);
                                                                                setFullscreenPdfName(name);
                                                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                                            }}
                                                                            activeOpacity={0.7}
                                                                        >
                                                                            <Maximize2 size={16} color={Colors.white} />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            );
                                                        }

                                                        // Unknown file or non-base64
                                                        return (
                                                            <TouchableOpacity
                                                                key={field.id}
                                                                style={[styles.attachmentCard, { marginTop: 12 }]}
                                                                onPress={() => uri && handleViewDocument(uri, name)}
                                                            >
                                                                <View style={styles.attachmentIcon}>
                                                                    <FileText size={20} color={Colors.primary} />
                                                                </View>
                                                                <View style={{ flex: 1 }}>
                                                                    <Text style={styles.attachmentName}>{name}</Text>
                                                                    <Text style={styles.attachmentType}>Touch to view file</Text>
                                                                </View>
                                                                <View style={styles.eyeBtn}>
                                                                    <Eye size={18} color={Colors.primary} />
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    }

                                                    return (
                                                        <View key={field.id} style={[styles.infoRow, fIdx === page.fields.length - 1 && { borderBottomWidth: 0 }]}>
                                                            <View style={styles.infoLabelGroup}>
                                                                {field.id === 'email' ? <Mail size={16} color={Colors.textSecondary} /> :
                                                                    field.id === 'phone' ? <Phone size={16} color={Colors.textSecondary} /> :
                                                                        field.id === 'enrollment' ? <Hash size={16} color={Colors.textSecondary} /> :
                                                                            field.id === 'department' ? <Building2 size={16} color={Colors.textSecondary} /> :
                                                                                <User size={16} color={Colors.textSecondary} />}
                                                                <Text style={styles.infoLabel}>{field.label}</Text>
                                                            </View>
                                                            <Text style={styles.infoValue}>{String(value)}</Text>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        style={styles.closeBtn}
                                        onPress={() => {
                                            setViewingStudent(null);
                                            setFullStudentData(null);
                                        }}
                                    >
                                        <Text style={styles.closeBtnText}>Done Viewing</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>

                        {/* Fullscreen PDF overlay — inside this same Modal so WebView renders correctly */}
                        {fullscreenPdfUri && (
                            <View style={styles.pdfFullscreenOverlay}>
                                {/* Header */}
                                <View style={[styles.pdfFullscreenHeader, { paddingTop: insets.top + 8 }]}>
                                    <TouchableOpacity
                                        style={styles.pdfFullscreenBack}
                                        onPress={() => setFullscreenPdfUri(null)}
                                    >
                                        <ChevronLeft size={22} color="#fff" />
                                    </TouchableOpacity>
                                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                                        <Text style={styles.pdfFullscreenTitle} numberOfLines={1}>
                                            {fullscreenPdfName}
                                        </Text>
                                        <Text style={styles.pdfFullscreenSub}>PDF Document</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.pdfFullscreenBack}
                                        onPress={() => {
                                            setFullscreenPdfUri(null);
                                            setFullscreenPdfName('');
                                        }}
                                    >
                                        <X size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                {/* PDF WebView */}
                                <SafePdfViewer
                                    uri={fullscreenPdfUri}
                                    buildHtml={buildPdfHtml}
                                    style={styles.pdfFullscreenWebView}
                                />
                            </View>
                        )}
                    </View>
                </Modal>


            </View >

            {/* Global Image/Document Viewer Modal */}
            < Modal
                visible={viewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewerVisible(false)
                }
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
                    <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />

                    <View style={[styles.viewerHeader, { paddingTop: insets.top + 10, paddingHorizontal: 20 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.viewerTitle} numberOfLines={1}>{viewerName || 'Document Preview'}</Text>
                            <Text style={styles.viewerSubtitle}>
                                {viewerType === 'image' ? 'Image File' : 'Digital Attachment'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setViewerVisible(false)}
                            style={styles.viewerCloseBtn}
                        >
                            <X size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.viewerContainer}>
                        <View style={styles.viewerContent}>
                            {viewerUri && viewerType === 'image' ? (
                                <Image
                                    source={{ uri: viewerUri as string }}
                                    style={styles.fullImage}
                                    contentFit="contain"
                                />
                            ) : (
                                <View style={styles.nonImageContent}>
                                    <FileText size={64} color="rgba(255,255,255,0.4)" />
                                    <Text style={styles.nonImageTitle}>Viewing Document</Text>
                                    <Text style={styles.nonImageDesc}>
                                        This file type might not support direct preview. You can open it in your device's default application.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.externalAppBtn}
                                        onPress={() => viewerUri && Linking.openURL(viewerUri)}
                                    >
                                        <ExternalLink size={20} color="#fff" />
                                        <Text style={styles.externalAppBtnText}>Open with External App</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.viewerFooterBtn}
                            onPress={() => setViewerVisible(false)}
                        >
                            <Text style={styles.viewerFooterBtnText}>Close Preview</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal >
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    downloadBtn: {
        padding: 8,
        backgroundColor: Colors.primary + '10',
        borderRadius: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 16,
    },
    deptTabsWrapper: {
        backgroundColor: Colors.white,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    deptTabs: {
        paddingHorizontal: 16,
        gap: 10,
    },
    deptTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F3F5',
        borderWidth: 1,
        borderColor: '#F1F3F5',
    },
    deptTabActive: {
        backgroundColor: Colors.primary + '10',
        borderColor: Colors.primary,
    },
    deptTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    deptTabTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        flex: 1,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-end',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.white,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.textSecondary,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.primary,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    studentSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    selectionTag: {
        marginTop: 8,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    selectionTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    marksContainer: {
        alignItems: 'flex-end',
    },
    marksValue: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.accent,
    },
    marksLabel: {
        fontSize: 10,
        color: Colors.textLight,
        marginTop: 2,
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
        height: '92%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    modalSub: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    modalLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    modalLoadingText: {
        marginTop: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.textSecondary,
        marginTop: 24,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingLeft: 4,
    },
    infoLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    attachmentSection: {
        gap: 12,
        marginBottom: 20,
    },
    attachmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        gap: 12,
    },
    attachmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    attachmentType: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    noAttachments: {
        padding: 20,
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#DEE2E6',
    },
    noAttachmentsText: {
        color: Colors.textLight,
        fontSize: 13,
    },
    eyeBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageAttachmentWrapper: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        marginBottom: 8,
    },
    imageAttachmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    imageAttachmentName: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    imageFrame: {
        width: '100%',
        minHeight: 300,
        backgroundColor: '#F1F3F5',
        borderRadius: 12,
        overflow: 'hidden',
    },
    attachedImage: {
        width: '100%',
        height: 400, // Large enough to see content
    },
    maximizeBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    overlayText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '800',
    },
    modalScroll: {
        flex: 1,
    },
    detailHero: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.primary + '20',
        overflow: 'hidden',
    },
    heroName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    heroSub: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    statusBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2DCE89',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        gap: 8,
        marginTop: 20,
    },
    statusBadgeText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '800',
    },
    infoSection: {
        backgroundColor: '#F8F9FA',
        padding: 20,
        borderRadius: 24,
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    infoLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '700',
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '800',
    },
    closeBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    closeBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    actionBtn: {
        marginTop: 24,
        backgroundColor: Colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionBtnText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 15,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryDate: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border + '40',
        marginVertical: 16,
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border + '60',
    },
    noStudents: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 16,
    },
    noStudentsText: {
        color: Colors.textLight,
        textAlign: 'center',
        fontSize: 14,
    },
    topRank: {
        backgroundColor: Colors.accent + '15',
    },
    topRankText: {
        color: Colors.accent,
        fontWeight: '900',
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    tagTextSmall: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border + '40',
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionIconButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    publishBtn: {
        backgroundColor: Colors.primary,
    },
    actionIconText: {
        fontSize: 14,
        fontWeight: '700',
    },
    deptFilterWrapper: {
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        marginLeft: 4,
    },
    // Viewer Styles
    viewerContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    viewerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
    },
    viewerTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '800',
    },
    viewerSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginTop: 2,
    },
    viewerCloseBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerContent: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 24,
        overflow: 'hidden',
        // No justifyContent/alignItems center — that collapses WebView dimensions
    },
    fullImage: {
        width: '100%',
        height: '100%',
        alignSelf: 'center',
    },
    nonImageContent: {
        flex: 1,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    nonImageTitle: {
        color: Colors.white,
        fontSize: 22,
        fontWeight: '800',
        marginTop: 24,
    },
    nonImageDesc: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    externalAppBtn: {
        marginTop: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    externalAppBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    viewerFooterBtn: {
        marginTop: 20,
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    viewerFooterBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    // PDF inline viewer styles
    pdfBadge: {
        marginLeft: 8,
        backgroundColor: Colors.primary + '20',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    pdfBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    pdfFrame: {
        width: '100%',
        height: 320,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        position: 'relative',
    },
    pdfWebView: {
        flex: 1,
        backgroundColor: '#1e1e2e',
    },
    pdfLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
    },
    pdfLoadingText: {
        marginTop: 12,
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    fullPdfViewer: {
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: '#1e1e2e',
    },
    // Fullscreen PDF overlay (inside student modal)
    pdfFullscreenOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1e1e2e',
        zIndex: 10,
        flexDirection: 'column',
    },
    pdfFullscreenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 12,
        backgroundColor: '#12122a',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    pdfFullscreenBack: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pdfFullscreenTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    pdfFullscreenSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        marginTop: 2,
    },
    pdfFullscreenWebView: {
        flex: 1,
        backgroundColor: '#1e1e2e',
    },
    cardAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    fullAvatar: {
        width: '100%',
        height: '100%',
    },
    rectorTabsContainer: {
        marginBottom: 10,
        backgroundColor: Colors.white,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    rectorTabsScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    rectorTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    rectorTabActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    rectorTabText: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    rectorTabTextActive: {
        color: Colors.white,
    }
});

const SafePdfViewer = ({ uri, buildHtml, style }: { uri: string; buildHtml: (u: string) => string; style?: any }) => {
    const [localUri, setLocalUri] = useState<string | null>(null);

    React.useEffect(() => {
        const id = Math.random().toString(36).substring(7);
        const fileUri = FileSystem.cacheDirectory + `pdf_viewer_${id}.html`;
        FileSystem.writeAsStringAsync(fileUri, buildHtml(uri), { encoding: FileSystem.EncodingType.UTF8 })
            .then(() => setLocalUri(fileUri))
            .catch(console.error);
    }, [uri, buildHtml]);

    if (!localUri) {
        return (
            <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ color: Colors.primary, marginTop: 10, fontWeight: '600' }}>Preparing PDF…</Text>
            </View>
        );
    }

    return (
        <WebView
            key={uri}
            source={{ uri: localUri }}
            style={style}
            originWhitelist={['*']}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            scrollEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
                <View style={styles.pdfLoadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.pdfLoadingText}>Loading PDF…</Text>
                </View>
            )}
        />
    );
};
