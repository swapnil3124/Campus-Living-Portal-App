import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    Modal,
    RefreshControl,
    FlatList,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Search,
    Filter,
    User,
    Mail,
    Phone,
    School,
    MapPin,
    Calendar,
    Briefcase,
    GraduationCap,
    CheckCircle,
    XCircle,
    Clock,
    Edit3,
    Eye,
    FileText,
    Download,
    ExternalLink,
    Plus,
    SlidersHorizontal,
    ChevronDown,
    ListChecks,
    Maximize2,
    X,
    Building2,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAdmissionStore } from '@/store/admission-store';
import { Admission } from '@/constants/types';
import { useAuth } from '@/contexts/AuthContext';

const DEPARTMENTS = [
    'Automobile Engineering',
    'Civil Engineering',
    'Computer Engineering',
    'Electrical Engineering',
    'E&TC Engineering',
    'Information Technology',
    'Mechanical Engineering'
];

const CATEGORIES = [
    'Open', 'OBC', 'TFWS', 'EWS', 'SEBC', 'SC', 'ST', 'VJ(NTA)', 'NT1(NTB)', 'NT2(NTC)', 'NT3(NTD)'
];

export default function AdmissionManagementScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { hostelName } = useAuth();
    const { admissions, updateAdmission, fetchAdmissions, getAdmissionById, isLoading, regConfig } = useAdmissionStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // Filter States
    const [filterDept, setFilterDept] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [filterGender, setFilterGender] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>('pending');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    React.useEffect(() => {
        fetchAdmissions();
    }, []);

    // Document Viewer State
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string | null>(null);
    const [viewerName, setViewerName] = useState('');
    const [viewerType, setViewerType] = useState<'image' | 'pdf' | 'other'>('image');
    const [fullscreenPdfUri, setFullscreenPdfUri] = useState<string | null>(null);
    const [fullscreenPdfName, setFullscreenPdfName] = useState('');

    const isFile = (value: any) => {
        if (!value) return false;
        if (typeof value === 'string') {
            return value.startsWith('data:') || /\.(pdf|jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(value);
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

    const isImageFile = (value: any) => {
        if (!value) return false;
        const uri = getFileUri(value);
        if (typeof uri === 'string') {
            return uri.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(uri);
        }
        return false;
    };

    const isPdfFile = (value: any) => {
        if (!value) return false;
        const uri = getFileUri(value);
        if (typeof uri === 'string') {
            return uri.startsWith('data:application/pdf') || uri.includes('.pdf');
        }
        return false;
    };

    const buildPdfHtml = (dataUri: string) => {
        const base64 = dataUri.startsWith('data:') ? dataUri.split(',')[1] ?? dataUri : dataUri;
        return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes"><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script><style>*{margin:0;padding:0;}body{background:#1e1e2e;}#container{display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:8px;}.page-wrapper{width:100%;background:white;}canvas{display:block;width:100%!important;height:auto!important;}</style></head><body><div id="container"></div><script>pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';var pdfData=Uint8Array.from(atob('${base64}'), c => c.charCodeAt(0));pdfjsLib.getDocument({data:pdfData}).promise.then(pdf=>{const container=document.getElementById('container');function render(num){pdf.getPage(num).then(page=>{const vp=page.getViewport({scale:1});const scale=(window.innerWidth*window.devicePixelRatio)/vp.width;const viewport=page.getViewport({scale});const wrapper=document.createElement('div');wrapper.className='page-wrapper';const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;wrapper.appendChild(canvas);container.appendChild(wrapper);page.render({canvasContext:canvas.getContext('2d'),viewport});if(num<pdf.numPages)render(num+1);});}render(1);});</script></body></html>`;
    };

    const handleViewDocument = (value: any, name: string) => {
        const uri = getFileUri(value);
        if (!uri) return;
        const isPdf = isPdfFile(value);
        const isImg = isImageFile(value);

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

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchAdmissions();
        setIsRefreshing(false);
    };

    const baseList = useMemo(() => {
        let result = [...admissions];
        const hNameRaw = hostelName?.toLowerCase() || '';

        // Apply Warden-specific filtering constraints
        if (hNameRaw === 'shivneri') {
            // Shivneri Warden manages 1st Year Male students
            result = result.filter(adm => adm.year === '1st' && adm.gender?.toLowerCase() === 'male');
        } else if (hNameRaw === 'lenyadri') {
            // Lenyadri Warden manages 2nd Year Male students
            result = result.filter(adm => adm.year === '2nd' && adm.gender?.toLowerCase() === 'male');
        } else if (hNameRaw === 'bhimashankar') {
            // Bhimashankar Warden manages 3rd Year Male students
            result = result.filter(adm => adm.year === '3rd' && adm.gender?.toLowerCase() === 'male');
        } else if (hNameRaw === 'saraswati' || hNameRaw === 'shwetamber' || hNameRaw === 'shwetambara' || hNameRaw === 'girls') {
            // Girls' hostels see ALL female registrations
            result = result.filter(adm => adm.gender?.toLowerCase() === 'female');
        }
        return result;
    }, [admissions, hostelName]);

    const statusCounts = useMemo(() => {
        return {
            pending: baseList.filter(adm => adm.status !== 'accepted' && adm.status !== 'rejected').length,
            accepted: baseList.filter(adm => adm.status === 'accepted').length,
            rejected: baseList.filter(adm => adm.status === 'rejected').length,
        };
    }, [baseList]);

    const filteredAdmissions = useMemo(() => {
        let result = baseList.filter(adm =>
            (adm.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (adm.enrollment || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filterDept) {
            result = result.filter(adm => adm.department === filterDept);
        }
        if (filterCategory) {
            result = result.filter(adm => adm.category === filterCategory);
        }
        if (filterGender) {
            result = result.filter(adm => adm.gender?.toLowerCase() === filterGender.toLowerCase());
        }
        if (filterStatus) {
            if (filterStatus === 'pending') {
                result = result.filter(adm => (adm.status !== 'accepted' && adm.status !== 'rejected'));
            } else {
                result = result.filter(adm => adm.status === filterStatus);
            }
        }

        if (sortOrder) {
            result.sort((a, b) => {
                const marksA = parseFloat(a.prevMarks) || 0;
                const marksB = parseFloat(b.prevMarks) || 0;
                return sortOrder === 'asc' ? marksA - marksB : marksB - marksA;
            });
        }

        return result;
    }, [baseList, searchQuery, filterDept, filterCategory, filterGender, filterStatus, sortOrder]);

    const handleCreateMeritList = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/admin/merit-list-settings');
    };

    const resetFilters = () => {
        setFilterDept(null);
        setFilterCategory(null);
        setFilterGender(null);
        setFilterStatus(null);
        setSortOrder(null);
    };

    const handleUpdateStatus = async (id: string, newStatus: 'accepted' | 'rejected' | 'pending') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const action = newStatus === 'accepted' ? 'Approving' : newStatus === 'rejected' ? 'Rejecting' : 'Resetting to Pending';

        Alert.alert(
            `${action} Application`,
            `Are you sure you want to ${newStatus === 'accepted' ? 'approve' : 'reject'} this application?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: newStatus === 'accepted' ? 'Approve' : newStatus === 'rejected' ? 'Reject' : 'Reset to Pending',
                    style: newStatus === 'rejected' ? 'destructive' : 'default',
                    onPress: async () => {
                        const success = await updateAdmission(id, { status: newStatus });
                        if (success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            if (newStatus === 'rejected') {
                                // Automatically fill the empty seat if it was a shortlisted student
                                await useAdmissionStore.getState().generateMeritList();
                                Alert.alert('Application Rejected', 'A seat has been freed and the system has automatically promoted the next qualified student in the merit list.');
                            } else {
                                Alert.alert('Application Approved', 'The student application has been successfully approved.');
                            }
                            setIsEditModalVisible(false);
                        } else {
                            Alert.alert('Error', 'Failed to update application status.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admission Review</Text>
            </View>

            <View style={styles.searchBarWrap}>
                <View style={styles.searchBar}>
                    <Search size={20} color={Colors.textLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <TouchableOpacity
                    style={styles.searchMeritBtn}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/admin/merit-list-results');
                    }}
                >
                    <ListChecks size={20} color={Colors.white} />
                    <Text style={styles.searchMeritBtnText}>Merit list</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.quickFiltersWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilters}>
                    {[
                        { id: 'pending', label: 'Pending', icon: <Clock size={16} />, count: statusCounts.pending },
                        { id: 'accepted', label: 'Approved', icon: <CheckCircle size={16} />, count: statusCounts.accepted },
                        { id: 'rejected', label: 'Rejected', icon: <XCircle size={16} />, count: statusCounts.rejected },
                    ].map((status) => (
                        <TouchableOpacity
                            key={status.id}
                            style={[
                                styles.quickFilterTab,
                                filterStatus === status.id && styles.quickFilterTabActive,
                                filterStatus === status.id && status.id === 'accepted' && { backgroundColor: '#EBFBEE', borderColor: '#28A745' },
                                filterStatus === status.id && status.id === 'rejected' && { backgroundColor: '#FFF5F5', borderColor: '#DC3545' },
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setFilterStatus(status.id);
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {React.cloneElement(status.icon as any, {
                                    color: filterStatus === status.id
                                        ? (status.id === 'accepted' ? '#28A745' : status.id === 'rejected' ? '#DC3545' : Colors.primary)
                                        : Colors.textLight
                                })}
                                <Text style={[
                                    styles.quickFilterText,
                                    filterStatus === status.id && styles.quickFilterTextActive,
                                    filterStatus === status.id && status.id === 'accepted' && { color: '#28A745' },
                                    filterStatus === status.id && status.id === 'rejected' && { color: '#DC3545' },
                                ]}>
                                    {status.label}
                                </Text>
                                <View style={[
                                    styles.countBadge,
                                    filterStatus === status.id && styles.countBadgeActive,
                                    filterStatus === status.id && status.id === 'accepted' && { backgroundColor: '#28A745' },
                                    filterStatus === status.id && status.id === 'rejected' && { backgroundColor: '#DC3545' },
                                ]}>
                                    <Text style={[
                                        styles.countText,
                                        filterStatus === status.id && styles.countTextActive
                                    ]}>{status.count}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredAdmissions}
                keyExtractor={(adm) => adm.id}
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
                ListHeaderComponent={
                    <>
                        {/* The searchBar and quickFilters are already rendered above the list in this layout.
                            But if we want them to scroll WITH the list (better for performance/UX), 
                            we should move them into ListHeaderComponent.
                            Currently they are fixed at the top if we leave them out.
                            Actually, the user had them above the ScrollView. 
                            I will leave them above the FlatList for now to maintain the same UI,
                            but FlatList itself is better than ScrollView map.
                        */}
                    </>
                }
                ListEmptyComponent={
                    isLoading && admissions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Loading admissions...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No admissions found</Text>
                            {(filterDept || filterCategory || filterGender) && (
                                <TouchableOpacity onPress={resetFilters} style={{ marginTop: 12 }}>
                                    <Text style={{ color: Colors.primary, fontWeight: '600' }}>Clear all filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                }
                renderItem={({ item: adm }) => (
                    <View key={adm.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            {adm.photoUrl ? (
                                <Image source={{ uri: adm.photoUrl }} style={styles.cardAvatar} contentFit="cover" />
                            ) : (
                                <View style={styles.cardAvatarPlaceholder}>
                                    <User size={20} color={Colors.primary} />
                                </View>
                            )}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.admName}>{adm.fullName}</Text>
                                <Text style={styles.admSub}>{adm.enrollment} • {adm.department}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.statusBadge, { backgroundColor: Colors.primary + '15' }]}
                                onPress={async () => {
                                    setSelectedAdmission(adm);
                                    setIsEditModalVisible(true);
                                    setIsDetailLoading(true);
                                    const fullData = await getAdmissionById(adm.id);
                                    if (fullData) setSelectedAdmission(fullData);
                                    setIsDetailLoading(false);
                                }}
                            >
                                <Eye size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                                <Text style={[styles.statusText, { color: Colors.primary }]}>VIEW FORM</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Phone size={14} color={Colors.textLight} />
                                <Text style={styles.infoLabel}>{adm.phone}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <GraduationCap size={14} color={Colors.textLight} />
                                <Text style={styles.infoLabel}>{adm.prevMarks}%</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <MapPin size={14} color={Colors.textLight} />
                                <Text style={styles.infoLabel}>{adm.distance} KM</Text>
                            </View>

                            <View style={{ flex: 1 }} />

                            <TouchableOpacity
                                style={styles.statusSection}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    Alert.alert(
                                        'Update Review Status',
                                        `Change status for ${adm.fullName}:`,
                                        [
                                            { text: 'Approve', onPress: () => handleUpdateStatus(adm.id, 'accepted') },
                                            { text: 'Reject', style: 'destructive', onPress: () => handleUpdateStatus(adm.id, 'rejected') },
                                            { text: 'Mark as Pending', onPress: () => handleUpdateStatus(adm.id, 'pending') },
                                            { text: 'Cancel', style: 'cancel' },
                                        ]
                                    );
                                }}
                            >
                                {adm.status === 'accepted' ? (
                                    <View style={[styles.statusBadgeSingle, styles.statusBadgeAccepted]}>
                                        <CheckCircle size={14} color="#2DCE89" />
                                        <Text style={[styles.statusBadgeText, { color: '#2DCE89' }]}>APPROVED</Text>
                                    </View>
                                ) : adm.status === 'rejected' ? (
                                    <View style={[styles.statusBadgeSingle, styles.statusBadgeRejected]}>
                                        <XCircle size={14} color="#F5365C" />
                                        <Text style={[styles.statusBadgeText, { color: '#F5365C' }]}>REJECTED</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.statusBadgeSingle, styles.statusBadgePending]}>
                                        <Clock size={14} color="#FB6340" />
                                        <Text style={[styles.statusBadgeText, { color: '#FB6340' }]}>PENDING</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tagRow}>
                            {adm.category && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{adm.category}</Text>
                                </View>
                            )}
                            {adm.year && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{adm.year} Year</Text>
                                </View>
                            )}
                            {adm.gender && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{adm.gender.toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            />

            {/* Filter Modal */}
            <Modal
                visible={isFilterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '85%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filters</Text>
                            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                                <XCircle size={24} color={Colors.textLight} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            {/* Department */}
                            <Text style={styles.filterTitle}>Department</Text>
                            <View style={styles.filterOptions}>
                                {DEPARTMENTS.map(dept => (
                                    <TouchableOpacity
                                        key={dept}
                                        style={[styles.filterChip, filterDept === dept && styles.filterChipActive]}
                                        onPress={() => setFilterDept(filterDept === dept ? null : dept)}
                                    >
                                        <Text style={[styles.filterChipText, filterDept === dept && styles.filterChipTextActive]}>{dept}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Category */}
                            <Text style={styles.filterTitle}>Category</Text>
                            <View style={styles.filterOptions}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                                        onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
                                    >
                                        <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Gender */}
                            <Text style={styles.filterTitle}>Gender</Text>
                            <View style={styles.filterOptions}>
                                {['male', 'female', 'other'].map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.filterChip, filterGender === g && styles.filterChipActive]}
                                        onPress={() => setFilterGender(filterGender === g ? null : g)}
                                    >
                                        <Text style={[styles.filterChipText, filterGender === g && styles.filterChipTextActive]}>{g.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Status */}
                            <Text style={styles.filterTitle}>Review Status</Text>
                            <View style={styles.filterOptions}>
                                {[
                                    { id: 'accepted', label: 'Approved' },
                                    { id: 'rejected', label: 'Rejected' },
                                    { id: 'pending', label: 'Pending' }
                                ].map(s => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.filterChip, filterStatus === s.id && styles.filterChipActive]}
                                        onPress={() => setFilterStatus(filterStatus === s.id ? null : s.id)}
                                    >
                                        <Text style={[styles.filterChipText, filterStatus === s.id && styles.filterChipTextActive]}>{s.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Sorting */}
                            <Text style={styles.filterTitle}>Sort by Marks</Text>
                            <View style={styles.filterOptions}>
                                <TouchableOpacity
                                    style={[styles.filterChip, sortOrder === 'desc' && styles.filterChipActive]}
                                    onPress={() => setSortOrder(sortOrder === 'desc' ? null : 'desc')}
                                >
                                    <Text style={[styles.filterChipText, sortOrder === 'desc' && styles.filterChipTextActive]}>Descending (High to Low)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterChip, sortOrder === 'asc' && styles.filterChipActive]}
                                    onPress={() => setSortOrder(sortOrder === 'asc' ? null : 'asc')}
                                >
                                    <Text style={[styles.filterChipText, sortOrder === 'asc' && styles.filterChipTextActive]}>Ascending (Low to High)</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ height: 40 }} />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                                <Text style={styles.resetBtnText}>Reset All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={() => setIsFilterModalVisible(false)}>
                                <Text style={styles.applyBtnText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Application Detail Modal (View Form) */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { marginTop: insets.top + 20, height: '95%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Student Form</Text>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                                <XCircle size={28} color={Colors.textLight} />
                            </TouchableOpacity>
                        </View>

                        {selectedAdmission && (
                            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                <View style={styles.detailHero}>
                                    <View style={styles.detailAvatarContainer}>
                                        {isDetailLoading ? (
                                            <ActivityIndicator size="large" color={Colors.primary} style={{ margin: 18 }} />
                                        ) : selectedAdmission.photoUrl ? (
                                            <Image source={{ uri: selectedAdmission.photoUrl }} style={styles.detailAvatar} contentFit="cover" />
                                        ) : (
                                            <User size={60} color={Colors.primary} />
                                        )}
                                    </View>
                                    <Text style={styles.heroName}>{selectedAdmission.fullName}</Text>
                                    <Text style={styles.heroSub}>{selectedAdmission.enrollment} • {selectedAdmission.department} • {selectedAdmission.distance} KM</Text>
                                </View>

                                {regConfig.pages.map((page) => (
                                    <View key={page.id} style={styles.detailSection}>
                                        <Text style={styles.detailHeading}>{page.title}</Text>
                                        {page.fields.map((field) => {
                                            const value = field.id === 'fullName' ? selectedAdmission.fullName :
                                                field.id === 'enrollment' ? selectedAdmission.enrollment :
                                                    field.id === 'email' ? selectedAdmission.email :
                                                        field.id === 'phone' ? selectedAdmission.phone :
                                                            field.id === 'department' ? selectedAdmission.department :
                                                                field.id === 'year' ? selectedAdmission.year :
                                                                    field.id === 'distance' ? selectedAdmission.distance + ' KM' :
                                                                        field.id === 'prevMarks' ? selectedAdmission.prevMarks + '%' :
                                                                            field.id === 'category' ? selectedAdmission.category :
                                                                                field.id === 'gender' ? selectedAdmission.gender :
                                                                                    field.id === 'studentPhoto' ? selectedAdmission.photoUrl :
                                                                                        selectedAdmission.additionalData?.[field.id];

                                            if (!value && field.type !== 'file' && field.type !== 'image') return null;

                                            if (field.type === 'file' || field.type === 'image') {
                                                if (!isFile(value)) return null;

                                                return (
                                                    <View key={field.id} style={styles.attachmentItem}>
                                                        <Text style={styles.detailLabel}>{field.label}</Text>
                                                        <TouchableOpacity
                                                            style={styles.fileLink}
                                                            onPress={() => handleViewDocument(value, field.label)}
                                                        >
                                                            <FileText size={16} color={Colors.primary} />
                                                            <Text style={styles.fileLinkText}>View {field.label}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            }

                                            return (
                                                <View key={field.id} style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>{field.label}</Text>
                                                    <Text style={styles.detailValue}>{String(value)}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}

                                <View style={styles.modalFooterActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.rejectBtn]}
                                        onPress={() => selectedAdmission && handleUpdateStatus(selectedAdmission.id, 'rejected')}
                                    >
                                        <XCircle size={20} color={Colors.white} />
                                        <Text style={styles.actionButtonText}>REJECT APPLICATION</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.approveBtn]}
                                        onPress={() => selectedAdmission && handleUpdateStatus(selectedAdmission.id, 'accepted')}
                                    >
                                        <CheckCircle size={20} color={Colors.white} />
                                        <Text style={styles.actionButtonText}>APPROVE APPLICATION</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Global Image/Document Viewer Modal */}
            <Modal
                visible={viewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewerVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
                    <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />

                    <View style={[styles.viewerHeader, { paddingTop: insets.top + 10, paddingHorizontal: 20 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.viewerTitle} numberOfLines={1}>{viewerName || 'Preview'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.viewerCloseBtn}>
                            <XCircle size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.viewerContent}>
                        {viewerUri && viewerType === 'image' ? (
                            <Image source={{ uri: viewerUri }} style={styles.fullImage} contentFit="contain" />
                        ) : (
                            <View style={styles.nonImageContent}>
                                <FileText size={64} color="rgba(255,255,255,0.4)" />
                                <Text style={styles.nonImageTitle}>Document File</Text>
                                <TouchableOpacity
                                    style={styles.externalAppBtn}
                                    onPress={() => viewerUri && Linking.openURL(viewerUri)}
                                >
                                    <ExternalLink size={20} color="#fff" />
                                    <Text style={styles.externalAppBtnText}>Open in External App</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Fullscreen PDF overlay — shows inside the student modal context or separate */}
            <Modal
                visible={!!fullscreenPdfUri}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setFullscreenPdfUri(null)}
            >
                <View style={[styles.pdfFullscreenOverlay, { paddingTop: insets.top }]}>
                    <View style={styles.pdfFullscreenHeader}>
                        <TouchableOpacity
                            style={styles.pdfFullscreenBack}
                            onPress={() => setFullscreenPdfUri(null)}
                        >
                            <ChevronLeft size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.pdfFullscreenTitle} numberOfLines={1}>{fullscreenPdfName}</Text>
                    </View>
                    {fullscreenPdfUri && (
                        <SafePdfViewer uri={fullscreenPdfUri} buildHtml={buildPdfHtml} />
                    )}
                </View>
            </Modal>
        </View >
    );
}

const SafePdfViewer = ({ uri, buildHtml }: { uri: string; buildHtml: (u: string) => string }) => {
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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ color: '#fff', marginTop: 10 }}>Preparing Document...</Text>
            </View>
        );
    }

    return (
        <WebView
            source={{ uri: localUri }}
            style={styles.pdfFullscreenWebView}
            originWhitelist={['*']}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: Colors.white,
    },
    backBtn: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    searchBarWrap: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 14,
        paddingHorizontal: 12,
        gap: 8,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    filterIconButton: {
        width: 50,
        height: 50,
        backgroundColor: Colors.white,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    createBtn: {
        width: 50,
        height: 50,
        backgroundColor: Colors.primary,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    admName: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
    },
    admSub: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoLabel: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: '500',
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 12,
    },
    tag: {
        backgroundColor: '#F1F3F5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textSecondary,
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    modalScroll: {
        flex: 1,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 20,
        marginBottom: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F1F3F5',
        borderWidth: 1,
        borderColor: '#F1F3F5',
    },
    filterChipActive: {
        backgroundColor: Colors.primary + '10',
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
    },
    resetBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#F1F3F5',
        alignItems: 'center',
    },
    resetBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    applyBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: 'center',
    },
    applyBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.white,
    },
    detailSection: {
        marginBottom: 24,
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 16,
    },
    detailHeading: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    detailLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '700',
        textAlign: 'right',
        flex: 1,
        marginLeft: 20,
    },
    cardAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F3F5',
        overflow: 'hidden',
    },
    cardAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailHero: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        marginBottom: 20,
    },
    detailAvatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: Colors.white,
    },
    detailAvatar: {
        width: '100%',
        height: '100%',
    },
    heroName: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    heroSub: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    attachmentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    fileLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    fileLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    // Viewer Styles
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
    viewerCloseBtn: {
        padding: 4,
    },
    viewerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    nonImageContent: {
        alignItems: 'center',
        gap: 20,
    },
    nonImageTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '700',
    },
    externalAppBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    externalAppBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    pdfFullscreenOverlay: {
        flex: 1,
        backgroundColor: '#1e1e2e',
    },
    pdfFullscreenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#12122a',
        gap: 12,
    },
    pdfFullscreenBack: {
        padding: 4,
    },
    pdfFullscreenTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    pdfFullscreenWebView: {
        flex: 1,
        backgroundColor: '#1e1e2e',
    },
    modalFooterActions: {
        flexDirection: 'column',
        gap: 12,
        marginTop: 20,
        paddingBottom: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 0.5,
    },
    rejectBtn: {
        backgroundColor: '#DC3545',
    },
    approveBtn: {
        backgroundColor: '#28A745',
    },
    quickFiltersWrapper: {
        backgroundColor: Colors.white,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F5',
    },
    quickFilters: {
        paddingHorizontal: 16,
        gap: 10,
    },
    quickFilterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    quickFilterTabActive: {
        backgroundColor: Colors.primary + '10',
        borderColor: Colors.primary,
    },
    quickFilterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    quickFilterTextActive: {
        color: Colors.primary,
        fontWeight: '800',
    },
    miniStatusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    statusSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadgeSingle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
        borderWidth: 1,
    },
    statusBadgePending: {
        backgroundColor: '#FB634010',
        borderColor: '#FB634030',
    },
    statusBadgeAccepted: {
        backgroundColor: '#2DCE8910',
        borderColor: '#2DCE8930',
    },
    statusBadgeRejected: {
        backgroundColor: '#F5365C10',
        borderColor: '#F5365C30',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    searchMeritBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        height: 50,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    searchMeritBtnText: {
        color: Colors.white,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    countBadge: {
        backgroundColor: '#E9ECEF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    countBadgeActive: {
        backgroundColor: Colors.primary,
    },
    countText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textSecondary,
    },
    countTextActive: {
        color: Colors.white,
    },
});
