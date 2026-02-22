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
    Image,
    Linking,
} from 'react-native';
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
    const { admissions, updateAdmission, fetchAdmissions, isLoading } = useAdmissionStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewingFile, setViewingFile] = useState<{ name: string, type: string, base64: string } | null>(null);

    // Filter States
    const [filterDept, setFilterDept] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [filterGender, setFilterGender] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    React.useEffect(() => {
        fetchAdmissions();
    }, []);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchAdmissions();
        setIsRefreshing(false);
    };

    const filteredAdmissions = useMemo(() => {
        let result = [...admissions].filter(adm =>
            adm.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            adm.enrollment.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Apply Hostel-specific constraints
        if (hostelName === 'Shivneri') {
            result = result.filter(adm => adm.year === '1st' && adm.gender?.toLowerCase() === 'male');
        } else if (hostelName === 'Lenyadri') {
            result = result.filter(adm => adm.year === '2nd' && adm.gender?.toLowerCase() === 'male');
        } else if (hostelName === 'Bhimashankar') {
            result = result.filter(adm => adm.year === '3rd' && adm.gender?.toLowerCase() === 'male');
        } else if (hostelName === 'Saraswati' || hostelName === 'Shwetamber' || hostelName === 'Shwetambara') {
            result = result.filter(adm => adm.gender?.toLowerCase() === 'female');
        }

        if (filterDept) {
            result = result.filter(adm => adm.department === filterDept);
        }
        if (filterCategory) {
            result = result.filter(adm => adm.category === filterCategory);
        }
        if (filterGender) {
            result = result.filter(adm => adm.gender === filterGender);
        }

        if (sortOrder) {
            result.sort((a, b) => {
                const marksA = parseFloat(a.prevMarks) || 0;
                const marksB = parseFloat(b.prevMarks) || 0;
                return sortOrder === 'asc' ? marksA - marksB : marksB - marksA;
            });
        }

        return result;
    }, [admissions, searchQuery, filterDept, filterCategory, filterGender, sortOrder, hostelName]);

    const handleCreateMeritList = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            'Create Merit List',
            'This will generate a merit list based on current verified applications. Do you want to continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate',
                    style: 'default',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert(
                            'Success',
                            'Merit list has been generated and is ready for review.',
                            [{ text: 'OK' }]
                        );
                    }
                }
            ]
        );
    };

    const resetFilters = () => {
        setFilterDept(null);
        setFilterCategory(null);
        setFilterGender(null);
        setSortOrder(null);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admission Management</Text>
            </View>

            <View style={styles.searchBarWrap}>
                <View style={styles.searchBar}>
                    <Search size={20} color={Colors.textLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or enrollment..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.filterIconButton}
                        onPress={() => setIsFilterModalVisible(true)}
                    >
                        <SlidersHorizontal size={22} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={handleCreateMeritList}
                    >
                        <Plus size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                {isLoading && admissions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Loading admissions...</Text>
                    </View>
                ) : filteredAdmissions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No admissions found</Text>
                        {(filterDept || filterCategory || filterGender) && (
                            <TouchableOpacity onPress={resetFilters} style={{ marginTop: 12 }}>
                                <Text style={{ color: Colors.primary, fontWeight: '600' }}>Clear all filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : filteredAdmissions.map((adm) => (
                    <View key={adm.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.admName}>{adm.fullName}</Text>
                                <Text style={styles.admSub}>{adm.enrollment} • {adm.department}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.statusBadge, { backgroundColor: Colors.primary + '15' }]}
                                onPress={() => { setSelectedAdmission(adm); setIsEditModalVisible(true); }}
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
                ))}
            </ScrollView>

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
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailHeading}>Personal Information</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Full Name</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.fullName}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Enrollment</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.enrollment}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Email</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.email}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Phone</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.phone}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Gender</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.gender || '-'}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailHeading}>Academic Information</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Department</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.department}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Year</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.year || '-'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Previous Marks</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.prevMarks}%</Text>
                                    </View>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailHeading}>Other Details</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Category</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.category || '-'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Distance</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.distance} KM</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Parent Name</Text>
                                        <Text style={styles.detailValue}>{selectedAdmission.parentName}</Text>
                                    </View>
                                </View>

                                {selectedAdmission.additionalData && Object.keys(selectedAdmission.additionalData).length > 0 && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailHeading}>Additional Data</Text>
                                        {Object.entries(selectedAdmission.additionalData).map(([key, value]: [string, any]) => (
                                            <View key={key} style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>{key.replace(/_/g, ' ')}</Text>
                                                <Text style={styles.detailValue}>{String(value)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <View style={{ height: 40 }} />
                            </ScrollView>
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
});
