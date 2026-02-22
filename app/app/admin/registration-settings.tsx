import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Calendar,
    Plus,
    Trash2,
    Save,
    FileText,
    Layout,
    ChevronDown,
    ChevronUp,
    Settings,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAdmissionStore } from '@/store/admission-store';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegistrationSettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { regConfig, fetchRegConfig, updateRegConfig, isLoading } = useAdmissionStore();

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [pages, setPages] = useState(regConfig.pages || []);
    const [expandedPage, setExpandedPage] = useState<string | null>(null);

    useEffect(() => {
        fetchRegConfig().then(() => {
            const config = useAdmissionStore.getState().regConfig;
            setStartDate(new Date(config.startDate || new Date()));
            setEndDate(new Date(config.endDate || new Date()));
            setIsOpen(config.isOpen);
            setPages(config.pages || []);
        });
    }, []);

    const handleSave = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const success = await updateRegConfig({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isOpen,
            pages: pages
        });
        if (success) {
            Alert.alert('Success', 'Admission form system updated');
        } else {
            Alert.alert('Error', 'Failed to update settings');
        }
    };

    const addPage = () => {
        const newPage = {
            id: Date.now().toString(),
            title: `New Page ${pages.length + 1}`,
            description: '',
            fields: []
        };
        setPages([...pages, newPage]);
        setExpandedPage(newPage.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const removePage = (id: string) => {
        Alert.alert('Delete Page', 'Are you sure you want to delete this page and all its fields?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setPages(pages.filter(p => p.id !== id));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }
            }
        ]);
    };

    const updatePage = (id: string, updates: any) => {
        setPages(pages.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const addField = (pageId: string) => {
        setPages(pages.map(p => {
            if (p.id === pageId) {
                const newField = {
                    id: Date.now().toString(),
                    label: '',
                    type: 'text' as const,
                    required: true,
                    options: ['Option 1']
                };
                return { ...p, fields: [...p.fields, newField] };
            }
            return p;
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const updateField = (pageId: string, fieldId: string, updates: any) => {
        setPages(pages.map(p => {
            if (p.id === pageId) {
                return {
                    ...p,
                    fields: p.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
                };
            }
            return p;
        }));
    };

    const removeField = (pageId: string, fieldId: string) => {
        setPages(pages.map(p => {
            if (p.id === pageId) {
                return {
                    ...p,
                    fields: p.fields.filter(f => f.id !== fieldId)
                };
            }
            return p;
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const addOption = (pageId: string, fieldId: string) => {
        setPages(pages.map(p => {
            if (p.id === pageId) {
                return {
                    ...p,
                    fields: p.fields.map(f => {
                        if (f.id === fieldId) {
                            return { ...f, options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`] };
                        }
                        return f;
                    })
                };
            }
            return p;
        }));
    };

    const updateOption = (pageId: string, fieldId: string, optIdx: number, val: string) => {
        setPages(pages.map(p => {
            if (p.id === pageId) {
                return {
                    ...p,
                    fields: p.fields.map(f => {
                        if (f.id === fieldId && f.options) {
                            const newOpts = [...f.options];
                            newOpts[optIdx] = val;
                            return { ...f, options: newOpts };
                        }
                        return f;
                    })
                };
            }
            return p;
        }));
    };

    const removeOption = (pageId: string, fieldId: string, optIdx: number) => {
        setPages(pages.map(p => {
            if (p.id === pageId) {
                return {
                    ...p,
                    fields: p.fields.map(f => {
                        if (f.id === fieldId && f.options) {
                            return { ...f, options: f.options.filter((_, i) => i !== optIdx) };
                        }
                        return f;
                    })
                };
            }
            return p;
        }));
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admission System</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
                {/* ── Global Settings ── */}
                <View style={styles.sectionTitleRow}>
                    <Settings size={18} color={Colors.primary} />
                    <Text style={styles.sectionTitleMain}>Global Configuration</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>Admission Status</Text>
                            <Text style={styles.sectionSub}>{isOpen ? 'Publicly accepting responses' : 'Form is currently closed'}</Text>
                        </View>
                        <Switch
                            value={isOpen}
                            onValueChange={setIsOpen}
                            trackColor={{ false: '#D1D5DB', true: Colors.primary }}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.dateGrid}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Start Date</Text>
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                                <Calendar size={18} color={Colors.primary} />
                                <Text style={styles.dateBtnText}>{startDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>End Date</Text>
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                                <Calendar size={18} color={Colors.primary} />
                                <Text style={styles.dateBtnText}>{endDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            onChange={(e: any, d?: Date) => { setShowStartPicker(false); if (d) setStartDate(d); }}
                        />
                    )}
                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            onChange={(e: any, d?: Date) => { setShowEndPicker(false); if (d) setEndDate(d); }}
                        />
                    )}
                </View>

                {/* ── Page Manager ── */}
                <View style={[styles.sectionTitleRow, { marginTop: 10 }]}>
                    <Layout size={18} color={Colors.primary} />
                    <Text style={styles.sectionTitleMain}>Form Pages / Slides</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={addPage}>
                        <Plus size={16} color={Colors.white} />
                        <Text style={styles.addBtnText}>New Page</Text>
                    </TouchableOpacity>
                </View>

                {pages.length === 0 && (
                    <View style={styles.emptyState}>
                        <Layout size={40} color={Colors.textLight} strokeWidth={1} />
                        <Text style={styles.emptyText}>Your form is empty. Create your first page!</Text>
                    </View>
                )}

                {pages.map((page, pIdx) => (
                    <View key={page.id} style={styles.pageCard}>
                        <TouchableOpacity
                            style={styles.pageHeader}
                            onPress={() => setExpandedPage(expandedPage === page.id ? null : page.id)}
                        >
                            <View style={styles.pageNumberBadge}>
                                <Text style={styles.pageNumberText}>{pIdx + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pageTitleText}>{page.title || 'Untitled Page'}</Text>
                                <Text style={styles.pageMetaText}>{page.fields.length} fields</Text>
                            </View>
                            {expandedPage === page.id ? <ChevronUp size={20} color={Colors.textLight} /> : <ChevronDown size={20} color={Colors.textLight} />}
                        </TouchableOpacity>

                        {expandedPage === page.id && (
                            <View style={styles.pageDetails}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.fieldLabel}>Page Title</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={page.title}
                                        onChangeText={(t) => updatePage(page.id, { title: t })}
                                        placeholder="e.g. Identity Verification"
                                    />
                                </View>

                                <View style={styles.fieldHeaderRow}>
                                    <Text style={styles.subTitle}>Manage Fields</Text>
                                    {!page.id.startsWith('fixed_') && (
                                        <TouchableOpacity style={styles.addFieldInline} onPress={() => addField(page.id)}>
                                            <Plus size={14} color={Colors.primary} />
                                            <Text style={styles.addFieldInlineText}>Add Field</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {page.fields.map((field, fIdx) => (
                                    <View key={field.id} style={[styles.fieldItemCard, page.id.startsWith('fixed_') && styles.fieldItemFixed]}>
                                        <View style={styles.fieldTopRow}>
                                            <TextInput
                                                style={styles.fieldTitleInput}
                                                value={field.label}
                                                onChangeText={(t) => updateField(page.id, field.id, { label: t })}
                                                placeholder="Field Question / Label"
                                                editable={!page.id.startsWith('fixed_')}
                                            />
                                            {!page.id.startsWith('fixed_') && (
                                                <TouchableOpacity onPress={() => removeField(page.id, field.id)}>
                                                    <Trash2 size={16} color={Colors.error} />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View style={styles.fieldTypeRow}>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                                                {['text', 'number', 'date', 'dropdown', 'email', 'phone', 'file'].map(t => (
                                                    <TouchableOpacity
                                                        key={t}
                                                        style={[
                                                            styles.typeChip,
                                                            field.type === t && styles.typeChipActive,
                                                            page.id.startsWith('fixed_') && { opacity: 0.6 }
                                                        ]}
                                                        onPress={() => !page.id.startsWith('fixed_') && updateField(page.id, field.id, { type: t as any })}
                                                        disabled={page.id.startsWith('fixed_')}
                                                    >
                                                        <Text style={[styles.typeChipText, field.type === t && styles.typeChipTextActive]}>
                                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                            <View style={styles.reqToggle}>
                                                <Text style={styles.reqText}>Req.</Text>
                                                <Switch
                                                    value={field.required}
                                                    onValueChange={(v) => { if (!page.id.startsWith('fixed_')) updateField(page.id, field.id, { required: v }); }}
                                                    style={{ transform: [{ scale: 0.7 }] }}
                                                    disabled={page.id.startsWith('fixed_')}
                                                />
                                            </View>
                                        </View>

                                        {field.type === 'dropdown' && (
                                            <View style={styles.optContainer}>
                                                {field.options?.map((opt, oIdx) => (
                                                    <View key={oIdx} style={styles.optRow}>
                                                        <TextInput
                                                            style={styles.optInput}
                                                            value={opt}
                                                            onChangeText={(t) => updateOption(page.id, field.id, oIdx, t)}
                                                            editable={!page.id.startsWith('fixed_')}
                                                        />
                                                        {!page.id.startsWith('fixed_') && (
                                                            <TouchableOpacity onPress={() => removeOption(page.id, field.id, oIdx)}>
                                                                <Text style={{ color: Colors.error }}>✕</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                ))}
                                                {(!page.id.startsWith('fixed_')) && (
                                                    <TouchableOpacity style={styles.addOpt} onPress={() => addOption(page.id, field.id)}>
                                                        <Plus size={12} color={Colors.primary} />
                                                        <Text style={styles.addOptText}>Add Option</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))}

                                {(!page.id.startsWith('fixed_')) && (
                                    <TouchableOpacity
                                        style={styles.deletePageBtn}
                                        onPress={() => removePage(page.id)}
                                    >
                                        <Trash2 size={16} color={Colors.error} />
                                        <Text style={styles.deletePageBtnText}>Delete This Page</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.mainSaveBtn, isLoading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Save size={20} color={Colors.white} />
                    <Text style={styles.mainSaveBtnText}>{isLoading ? 'Deploying...' : 'Deploy Admission Form'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },

    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 10, gap: 8, paddingHorizontal: 4 },
    sectionTitleMain: { fontSize: 18, fontWeight: '800', color: Colors.text, flex: 1 },

    section: { backgroundColor: Colors.white, borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    sectionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 18 },

    dateGrid: { flexDirection: 'row', gap: 12 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
    dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
    dateBtnText: { fontSize: 14, color: Colors.text, fontWeight: '600' },

    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
    addBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },

    emptyState: { padding: 50, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 30, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' },
    emptyText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    pageCard: { backgroundColor: Colors.white, borderRadius: 24, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    pageHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: Colors.white },
    pageNumberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center' },
    pageNumberText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
    pageTitleText: { fontSize: 16, fontWeight: '700', color: Colors.text },
    pageMetaText: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

    pageDetails: { padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    inputGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    textInput: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15, fontWeight: '600', color: Colors.text },

    fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
    subTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
    addFieldInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addFieldInlineText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

    fieldItemCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    fieldItemFixed: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', borderStyle: 'dashed' },
    fieldTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    fieldTitleInput: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text, padding: 0 },

    fieldTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E2E8F0', marginRight: 6 },
    typeChipActive: { backgroundColor: Colors.primary },
    typeChipText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
    typeChipTextActive: { color: Colors.white },
    reqToggle: { flexDirection: 'row', alignItems: 'center' },
    reqText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },

    optContainer: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#E2E8F0' },
    optRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    optInput: { flex: 1, fontSize: 13, color: Colors.text, backgroundColor: Colors.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    addOpt: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    addOptText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

    deletePageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6, marginTop: 10 },
    deletePageBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },

    mainSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 24, gap: 10, marginTop: 20, elevation: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    mainSaveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800' },
});
