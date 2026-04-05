import { create } from 'zustand';
import { Admission } from '@/constants/types';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Use your computer's IP address for physical devices
// 10.0.2.2 is the alias for localhost in Android Emulator
import { API_URL } from '@/constants/config';

interface AdmissionStore {
    admissions: Admission[];
    regConfig: {
        startDate: string;
        endDate: string;
        isOpen: boolean;
        pages: Array<{
            id: string;
            title: string;
            description?: string;
            fields: Array<{
                id: string;
                label: string;
                type: 'text' | 'number' | 'date' | 'dropdown' | 'email' | 'phone' | 'file' | 'image';
                required: boolean;
                options?: string[];
            }>;
        }>;
    };
    isLoading: boolean;
    error: string | null;
    fetchAdmissions: (token?: string, year?: string) => Promise<void>;
    addAdmission: (admission: any) => Promise<boolean>;
    updateAdmission: (id: string, updates: Partial<Admission>, token?: string) => Promise<boolean>;
    deleteAdmission: (id: string, token?: string) => Promise<boolean>;
    getAdmissionById: (id: string, token?: string) => Promise<Admission | null>;
    fetchRegConfig: () => Promise<void>;
    updateRegConfig: (updates: any, token?: string) => Promise<boolean>;
    meritListSettings: {
        departmentSeats: Record<string, number>;
        categoryPercentages: Record<string, number>;
        yearSeats?: Record<string, number>;
    };
    fetchMeritListSettings: (isGirls?: boolean) => Promise<void>;
    updateMeritListSettings: (settings: any, token?: string, isGirls?: boolean) => Promise<boolean>;
    generateMeritList: (token?: string) => Promise<{ success: boolean; message: string }>;
    fetchMeritLists: (token?: string) => Promise<void>;
    publishMeritList: (id: string, hostelName: string, token?: string) => Promise<boolean>;
    sendToRector: (id: string, token?: string) => Promise<boolean>;
    generatePasswords: (id: string, admissionIds?: string[], token?: string) => Promise<{ success: boolean; passwords?: any[] }>;
    sendEmails: (students: any[], token?: string) => Promise<{ success: boolean; message: string }>;
    meritLists: any[];
    deleteMeritList: (id: string, token?: string) => Promise<boolean>;
}

export const useAdmissionStore = create<AdmissionStore>((set, get) => ({
    admissions: [],
    regConfig: {
        startDate: '',
        endDate: '',
        isOpen: true,
        pages: [
            {
                id: 'fixed_personal_info',
                title: 'Personal Identity',
                description: 'Please provide your basic contact information.',
                fields: [
                    { id: 'fullName', label: 'Full Name', type: 'text', required: true },
                    { id: 'enrollment', label: 'Enrollment No', type: 'number', required: true },
                    { id: 'email', label: 'Email ID', type: 'email', required: true },
                    { id: 'phone', label: 'Student Mobile No', type: 'phone', required: true },
                    { id: 'distance', label: 'Distance (KM)', type: 'number', required: true },
                    { id: 'studentPhoto', label: 'Student Photo', type: 'image', required: true },
                ]
            }
        ]
    },
    meritListSettings: {
        departmentSeats: {},
        categoryPercentages: {}
    },
    meritLists: [],
    isLoading: false,
    error: null,

    fetchAdmissions: async (token?: string, year?: string) => {
        if (!token) return;
        if (get().admissions.length === 0) {
            set({ isLoading: true, error: null });
        }
        try {
            const headers: any = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            let url = `${API_URL}/admissions`;
            if (year) {
                url += `?year=${year}`;
            }

            const response = await fetch(url, {
                headers
            });
            if (!response.ok) throw new Error('Failed to fetch admissions');
            const data = await response.json();
            const transformedData = data.map((adm: any) => ({
                ...adm,
                id: adm._id,
            }));
            set({ admissions: transformedData, isLoading: false });
        } catch (err: any) {
            console.warn('fetchAdmissions Error:', err);
            if (get().admissions.length === 0) {
                set({ error: err.message, isLoading: false });
            }
        }
    },

    fetchRegConfig: async () => {
        try {
            const response = await fetch(`${API_URL}/config/registration`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                let pages = data.value.pages || [];

                const fixedPersonal = {
                    id: 'fixed_personal_info',
                    title: 'Personal Identity',
                    description: 'Please provide your basic contact information.',
                    fields: [
                        { id: 'fullName', label: 'Full Name', type: 'text', required: true },
                        { id: 'enrollment', label: 'Enrollment No', type: 'number', required: true },
                        { id: 'email', label: 'Email ID', type: 'email', required: true },
                        { id: 'phone', label: 'Student Mobile No', type: 'phone', required: true },
                        { id: 'distance', label: 'Distance (KM)', type: 'number', required: true },
                        { id: 'studentPhoto', label: 'Student Photo', type: 'image', required: true },
                    ]
                };

                const fixedAcademic = {
                    id: 'fixed_academic_info',
                    title: 'Academic Details',
                    description: 'Required for merit list generation and sorting.',
                    fields: [
                        {
                            id: 'department',
                            label: 'Department',
                            type: 'dropdown',
                            required: true,
                            options: [
                                'Automobile Engineering',
                                'Civil Engineering',
                                'Computer Engineering',
                                'Electrical Engineering',
                                'E&TC Engineering',
                                'Information Technology',
                                'Mechanical Engineering'
                            ]
                        },
                        {
                            id: 'year',
                            label: 'Year',
                            type: 'dropdown',
                            required: true,
                            options: ['1st', '2nd', '3rd']
                        },
                        { id: 'prevMarks', label: 'Previous Marks (%)', type: 'number', required: true },
                        {
                            id: 'category',
                            label: 'Category',
                            type: 'dropdown',
                            required: true,
                            options: ['Open', 'OBC', 'TFWS', 'EWS', 'SEBC', 'SC', 'ST', 'VJ(NTA)', 'NT1(NTB)', 'NT2(NTC)', 'NT3(NTD)']
                        },
                        {
                            id: 'gender',
                            label: 'Gender',
                            type: 'dropdown',
                            required: true,
                            options: ['Male', 'Female', 'Other']
                        },
                    ]
                };

                // Ensure fixed slides exist and are in correct order
                pages = pages.filter((p: any) => !['fixed_personal_info', 'fixed_academic_info'].includes(p.id));
                pages = [fixedPersonal, fixedAcademic, ...pages];

                set({ regConfig: { ...data.value, pages } });
            }
        } catch (err) {
            console.warn('fetchRegConfig Error:', err);
        }
    },

    updateRegConfig: async (updates, token?: string) => {
        set({ isLoading: true });
        try {
            const current = get().regConfig;
            let newValue = { ...current, ...updates };

            const fixedPersonal = {
                id: 'fixed_personal_info',
                title: 'Personal Identity',
                description: 'Please provide your basic contact information.',
                fields: [
                    { id: 'fullName', label: 'Full Name', type: 'text', required: true },
                    { id: 'enrollment', label: 'Enrollment No', type: 'number', required: true },
                    { id: 'email', label: 'Email ID', type: 'email', required: true },
                    { id: 'phone', label: 'Student Mobile No', type: 'phone', required: true },
                    { id: 'distance', label: 'Distance (KM)', type: 'number', required: true },
                    { id: 'studentPhoto', label: 'Student Photo', type: 'image', required: true },
                ]
            };

            const fixedAcademic = {
                id: 'fixed_academic_info',
                title: 'Academic Details',
                description: 'Required for merit list generation and sorting.',
                fields: [
                    {
                        id: 'department',
                        label: 'Department',
                        type: 'dropdown',
                        required: true,
                        options: [
                            'Automobile Engineering',
                            'Civil Engineering',
                            'Computer Engineering',
                            'Electrical Engineering',
                            'E&TC Engineering',
                            'Information Technology',
                            'Mechanical Engineering'
                        ]
                    },
                    {
                        id: 'year',
                        label: 'Year',
                        type: 'dropdown',
                        required: true,
                        options: ['1st', '2nd', '3rd']
                    },
                    { id: 'prevMarks', label: 'Previous Marks (%)', type: 'number', required: true },
                    {
                        id: 'category',
                        label: 'Category',
                        type: 'dropdown',
                        required: true,
                        options: ['Open', 'OBC', 'TFWS', 'EWS', 'SEBC', 'SC', 'ST', 'VJ(NTA)', 'NT1(NTB)', 'NT2(NTC)', 'NT3(NTD)']
                    },
                    {
                        id: 'gender',
                        label: 'Gender',
                        type: 'dropdown',
                        required: true,
                        options: ['Male', 'Female', 'Other']
                    },
                ]
            };

            // Protection: Force injection of fixed slides at the start
            newValue.pages = newValue.pages.filter((p: any) => !['fixed_personal_info', 'fixed_academic_info'].includes(p.id));
            newValue.pages = [fixedPersonal, fixedAcademic, ...newValue.pages];

            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/config`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ key: 'registration', value: newValue }),
            });
            if (response.ok) {
                set({ regConfig: newValue, isLoading: false });
                return true;
            }
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to update config');
        } catch (err: any) {
            console.warn('updateRegConfig Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    addAdmission: async (admission) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/admissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(admission),
            });
            if (!response.ok) {
                const errData = await response.json();
                let errorMsg = errData.message || 'Failed to submit admission';
                if (errData.errors) {
                    const specificErrors = Object.values(errData.errors).map((e: any) => e.message).join(', ');
                    errorMsg = `${errorMsg}: ${specificErrors}`;
                }
                throw new Error(errorMsg);
            }
            const newDoc = await response.json();

            set((state) => ({
                admissions: [...state.admissions, { ...newDoc, id: newDoc._id }],
                isLoading: false
            }));
            return true;
        } catch (err: any) {
            console.warn('addAdmission Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    updateAdmission: async (id, updates, token?: string) => {
        set({ isLoading: true, error: null });
        try {
            // Strip id and _id from updates to avoid Mongoose immutable field errors
            const { id: _, _id: __, ...cleanUpdates } = updates as any;

            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/admissions/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(cleanUpdates),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update admission');
            }
            const updatedDoc = await response.json();

            set((state) => ({
                admissions: state.admissions.map((adm) =>
                    adm.id === id ? { ...updatedDoc, id: updatedDoc._id } : adm
                ),
                isLoading: false
            }));
            return true;
        } catch (err: any) {
            console.warn('updateAdmission Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    deleteAdmission: async (id, token?: string) => {
        set({ isLoading: true, error: null });
        try {
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/admissions/${id}`, {
                method: 'DELETE',
                headers
            });
            if (!response.ok) throw new Error('Failed to delete admission');

            set((state) => ({
                admissions: state.admissions.filter((adm) => adm.id !== id),
                isLoading: false
            }));
            return true;
        } catch (err: any) {
            console.warn('deleteAdmission Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    getAdmissionById: async (id, token?: string) => {
        try {
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/admissions/${id}`, {
                headers
            });
            if (!response.ok) throw new Error('Failed to fetch admission');
            const data = await response.json();
            return { ...data, id: data._id };
        } catch (err) {
            console.warn('getAdmissionById Error:', err);
            return null;
        }
    },

    fetchMeritListSettings: async (isGirls = false) => {
        try {
            const key = isGirls ? 'girls_merit_list_config' : 'merit_list';
            const response = await fetch(`${API_URL}/config/${key}`);
            if (response.ok) {
                const data = await response.json();
                set({ meritListSettings: data.value });
            }
        } catch (err) {
            console.warn('fetchMeritListSettings Error:', err);
        }
    },

    updateMeritListSettings: async (settings, token, isGirls = false) => {
        set({ isLoading: true });
        try {
            const key = isGirls ? 'girls_merit_list_config' : 'merit_list';
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/config`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ key, value: settings }),
            });
            if (response.ok) {
                set({ meritListSettings: settings, isLoading: false });
                return true;
            }
            throw new Error('Failed to update merit list settings');
        } catch (err: any) {
            console.warn('updateMeritListSettings Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    fetchMeritLists: async (token?: string) => {
        try {
            const headers: any = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/merit`, {
                headers
            });
            if (response.ok) {
                const data = await response.json();
                set({ meritLists: data });
            }
        } catch (err) {
            console.warn('fetchMeritLists Error:', err);
        }
    },

    generateMeritList: async (token?: string) => {
        set({ isLoading: true });
        try {
            const headers: any = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/merit/generate`, {
                method: 'POST',
                headers
            });
            const data = await response.json();
            if (response.ok) {
                set({ meritLists: data.lists, isLoading: false });
                return { success: true, message: data.message };
            }
            throw new Error(data.message || 'Failed to generate merit list');
        } catch (err: any) {
            console.warn('generateMeritList Error:', err);
            set({ isLoading: false });
            return { success: false, message: err.message };
        }
    },

    publishMeritList: async (id: string, hostelName: string, token?: string) => {
        try {
            const headers: any = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/merit/${id}/publish`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ hostelName })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            return true;
        } catch (err: any) {
            console.warn('publishMeritList Error:', err.message || err);
            return false;
        }
    },

    sendToRector: async (id: string, token?: string) => {
        try {
            const headers: any = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/merit/${id}/send-to-rector`, {
                method: 'POST',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            return true;
        } catch (err: any) {
            console.warn('sendToRector Error:', err.message || err);
            return false;
        }
    },

    generatePasswords: async (id: string, admissionIds?: string[], token?: string) => {
        try {
            const headers: any = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/merit/${id}/generate-passwords`, {
                method: 'POST',
                headers,
                body: admissionIds ? JSON.stringify({ admissionIds }) : undefined
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || `Server error: ${response.status}`);
            }
            return { success: true, passwords: responseData.passwords };
        } catch (err: any) {
            console.warn('generatePasswords Error:', err.message || err);
            return { success: false };
        }
    },

    sendEmails: async (students: any[], token?: string) => {
        try {
            const headers: any = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/merit/send-emails`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ students })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }
            return { success: true, message: data.message };
        } catch (err: any) {
            console.warn('sendEmails Error:', err.message || err);
            return { success: false, message: err.message };
        }
    },

    deleteMeritList: async (id: string, token?: string) => {
        try {
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/merit/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.ok) {
                set((state) => ({
                    meritLists: state.meritLists.filter(l => l._id !== id)
                }));
                return true;
            }
            throw new Error('Failed to delete merit list');
        } catch (err) {
            console.warn('deleteMeritList Error:', err);
            return false;
        }
    },
}));
