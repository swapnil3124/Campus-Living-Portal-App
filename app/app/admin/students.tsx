import React, { useState, useMemo, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, TextInput, Modal, ScrollView, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Filter, User, MapPin, GraduationCap, Phone, Clock, FileText, CheckCircle2, ChevronDown } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmissionStore } from '@/store/admission-store';
import { Admission } from '@/constants/types';

export default function StudentManagementScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { token } = useAuth();
    const { admissions, fetchAdmissions, isLoading } = useAdmissionStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Default filter to "Active"
    const [selectedBatch, setSelectedBatch] = useState<string>('Active');
    const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);

    useEffect(() => {
        if (token && admissions.length === 0) {
            fetchAdmissions(token);
        }
    }, [token]);

    const onRefresh = async () => {
        if (!token) return;
        setIsRefreshing(true);
        await fetchAdmissions(token);
        setIsRefreshing(false);
    };

    // Derived distinct batches (Years from appliedAt) + Active / Exited
    const batchOptions = useMemo(() => {
        const years = new Set<string>();
        // Only consider accepted / past for student management (ignore pending/rejected)
        admissions.forEach(adm => {
            if (['accepted', 'past'].includes(adm.status)) {
                if (adm.appliedAt) {
                    const year = new Date(adm.appliedAt).getFullYear().toString();
                    years.add(year);
                }
            }
        });
        const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
        return ['Active', 'All Past Batches', ...sortedYears.map(y => `Batch ${y}`)];
    }, [admissions]);

    const filteredStudents = useMemo(() => {
        let result = admissions.filter(adm => ['accepted', 'past'].includes(adm.status));
        
        // Apply Batch Filter
        if (selectedBatch === 'Active') {
            result = result.filter(adm => adm.status === 'accepted' && adm.isRoomAllocated !== false);
        } else if (selectedBatch === 'All Past Batches') {
            result = result.filter(adm => adm.status === 'past' || adm.isRoomAllocated === false);
        } else if (selectedBatch.startsWith('Batch ')) {
            const year = selectedBatch.split(' ')[1];
            result = result.filter(adm => {
                if (!adm.appliedAt) return false;
                return new Date(adm.appliedAt).getFullYear().toString() === year && (adm.status === 'past' || adm.isRoomAllocated === false);
            });
        }

        // Apply Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(adm => 
                (adm.fullName || '').toLowerCase().includes(query) ||
                (adm.enrollment || '').toLowerCase().includes(query) ||
                (adm.department || '').toLowerCase().includes(query) ||
                (adm.allocatedRoom || '').toLowerCase().includes(query)
            );
        }
        
        return result;
    }, [admissions, selectedBatch, searchQuery]);

    const renderStudentCard = ({ item }: { item: Admission }) => {
        const isActive = item.status === 'accepted' && item.isRoomAllocated !== false;
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={styles.avatar} contentFit="cover" />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <User size={20} color={Colors.primary} />
                        </View>
                    )}
                    <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{item.fullName}</Text>
                        <Text style={styles.enrollmentText}>{item.enrollment} • {item.department}</Text>
                        
                        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E8F5E9' : '#ECEFF1' }]}>
                            <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.success : Colors.textLight }]} />
                            <Text style={[styles.statusText, { color: isActive ? Colors.success : Colors.textLight }]}>
                                {isActive ? 'Currently Active' : 'Exited / Past'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <CheckCircle2 size={14} color={Colors.textLight} />
                        <Text style={styles.detailText}>
                            {isActive ? (item.allocatedRoom ? `Room ${item.allocatedRoom}` : 'No Room') : 'Room Vacated'}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Phone size={14} color={Colors.textLight} />
                        <Text style={styles.detailText}>{item.phone}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <GraduationCap size={14} color={Colors.textLight} />
                        <Text style={styles.detailText}>{item.year} Year</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Student Record & History</Text>
            </LinearGradient>

            <View style={styles.controlsContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color={Colors.textLight} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search by name, PRN, or room..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={Colors.textLight}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.dropdownBtn}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIsBatchDropdownOpen(!isBatchDropdownOpen);
                    }}
                >
                    <Filter size={18} color={Colors.primary} />
                    <Text style={styles.dropdownBtnText}>{selectedBatch}</Text>
                    <ChevronDown size={18} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {isBatchDropdownOpen && (
                <View style={styles.dropdownMenu}>
                    {batchOptions.map((opt) => (
                        <TouchableOpacity 
                            key={opt}
                            style={[styles.dropdownItem, selectedBatch === opt && styles.dropdownItemActive]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedBatch(opt);
                                setIsBatchDropdownOpen(false);
                            }}
                        >
                            <Text style={[styles.dropdownItemText, selectedBatch === opt && styles.dropdownItemTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {isLoading && !isRefreshing && filteredStudents.length === 0 ? (
                <View style={[styles.center, {flex: 1}]}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={filteredStudents}
                    keyExtractor={(item) => item.id}
                    renderItem={renderStudentCard}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <User size={48} color={Colors.textLight} />
                            <Text style={styles.emptyText}>No students found in this category.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingBottom: 25, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginLeft: 15 },
    
    controlsContainer: { padding: 16, zIndex: 5 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 50, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: Colors.text },
    
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#BAE6FD' },
    dropdownBtnText: { color: Colors.primary, fontWeight: '700', marginHorizontal: 8, fontSize: 14 },
    dropdownMenu: { position: 'absolute', top: 140, left: 16, right: '40%', backgroundColor: '#FFF', borderRadius: 12, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10, zIndex: 20 },
    dropdownItem: { padding: 12, borderRadius: 8 },
    dropdownItemActive: { backgroundColor: '#F1F5F9' },
    dropdownItemText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
    dropdownItemTextActive: { color: Colors.primary, fontWeight: '700' },
    
    listContent: { padding: 16, paddingTop: 0 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9' },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
    studentInfo: { flex: 1, marginLeft: 12 },
    studentName: { fontSize: 16, fontWeight: '800', color: Colors.text },
    enrollmentText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: 6 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    
    detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    detailItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    detailText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 6, fontWeight: '600' },
    
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textLight, marginTop: 14, fontSize: 15, fontWeight: '500' }
});
