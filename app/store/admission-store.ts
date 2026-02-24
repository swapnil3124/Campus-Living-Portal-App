import { create } from 'zustand';
import { Admission } from '@/constants/types';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Use your computer's IP address for physical devices
// 10.0.2.2 is the alias for localhost in Android Emulator
const getBaseUrl = () => {
    // For Web, localhost is always correct
    if (Platform.OS === 'web') return 'http://localhost:5000/api';

    // In Expo, hostUri gives us the machine's IP address automatically
    const debuggerHost = Constants.expoConfig?.hostUri;
    const machineIp = debuggerHost?.split(':')[0];

    if (machineIp) {
        return `http://${machineIp}:5000/api`;
    }

    // Fallback for Android Emulator or generic localhost
    return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
};

const API_URL = getBaseUrl();

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
    fetchAdmissions: () => Promise<void>;
    addAdmission: (admission: any) => Promise<boolean>;
    updateAdmission: (id: string, updates: Partial<Admission>) => Promise<boolean>;
    deleteAdmission: (id: string) => Promise<boolean>;
    getAdmissionById: (id: string) => Promise<Admission | null>;
    fetchRegConfig: () => Promise<void>;
    updateRegConfig: (updates: any) => Promise<boolean>;
    meritListSettings: {
        departmentSeats: Record<string, number>;
        categoryPercentages: Record<string, number>;
    };
    fetchMeritListSettings: () => Promise<void>;
    updateMeritListSettings: (settings: any) => Promise<boolean>;
    generateMeritList: () => Promise<{ success: boolean; message: string }>;
    meritLists: any[];
    fetchMeritLists: () => Promise<void>;
    publishMeritList: (id: string) => Promise<boolean>;
    deleteMeritList: (id: string) => Promise<boolean>;
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

    fetchAdmissions: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/admissions`);
            if (!response.ok) throw new Error('Failed to fetch admissions');
            const data = await response.json();
            const transformedData = data.map((adm: any) => ({
                ...adm,
                id: adm._id,
            }));
            set({ admissions: transformedData, isLoading: false });
        } catch (err: any) {
            console.error('fetchAdmissions Error:', err);
            set({ error: err.message, isLoading: false });
        }
    },

    fetchRegConfig: async () => {
        try {
            const response = await fetch(`${API_URL}/config/registration`);
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
            console.error('fetchRegConfig Error:', err);
        }
    },

    updateRegConfig: async (updates) => {
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

            const response = await fetch(`${API_URL}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'registration', value: newValue }),
            });
            if (response.ok) {
                set({ regConfig: newValue, isLoading: false });
                return true;
            }
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to update config');
        } catch (err: any) {
            console.error('updateRegConfig Error:', err);
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
            console.error('addAdmission Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    updateAdmission: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            // Strip id and _id from updates to avoid Mongoose immutable field errors
            const { id: _, _id: __, ...cleanUpdates } = updates as any;

            const response = await fetch(`${API_URL}/admissions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            console.error('updateAdmission Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    deleteAdmission: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/admissions/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete admission');

            set((state) => ({
                admissions: state.admissions.filter((adm) => adm.id !== id),
                isLoading: false
            }));
            return true;
        } catch (err: any) {
            console.error('deleteAdmission Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    getAdmissionById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/admissions/${id}`);
            if (!response.ok) throw new Error('Failed to fetch admission');
            const data = await response.json();
            return { ...data, id: data._id };
        } catch (err) {
            console.error('getAdmissionById Error:', err);
            return null;
        }
    },

    fetchMeritListSettings: async () => {
        try {
            const response = await fetch(`${API_URL}/config/merit_list`);
            if (response.ok) {
                const data = await response.json();
                set({ meritListSettings: data.value });
            }
        } catch (err) {
            console.error('fetchMeritListSettings Error:', err);
        }
    },

    updateMeritListSettings: async (settings) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'merit_list', value: settings }),
            });
            if (response.ok) {
                set({ meritListSettings: settings, isLoading: false });
                return true;
            }
            throw new Error('Failed to update merit list settings');
        } catch (err: any) {
            console.error('updateMeritListSettings Error:', err);
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    fetchMeritLists: async () => {
        try {
            const response = await fetch(`${API_URL}/merit`);
            if (response.ok) {
                const data = await response.json();
                set({ meritLists: data });
            }
        } catch (err) {
            console.error('fetchMeritLists Error:', err);
        }
    },

    generateMeritList: async () => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/merit/generate`, {
                method: 'POST',
            });
            const data = await response.json();
            if (response.ok) {
                // Also update the local meritLists state with the newly generated lists
                set({ meritLists: data.lists, isLoading: false });
                return { success: true, message: data.message };
            }
            throw new Error(data.message || 'Failed to generate merit list');
        } catch (err: any) {
            console.error('generateMeritList Error:', err);
            set({ isLoading: false });
            return { success: false, message: err.message };
        }
    },

    publishMeritList: async (id: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/merit/${id}/publish`, {
                method: 'POST',
            });
            if (response.ok) {
                set({ isLoading: false });
                return true;
            }
            throw new Error('Failed to publish merit list');
        } catch (err) {
            console.error('publishMeritList Error:', err);
            set({ isLoading: false });
            return false;
        }
    },

    deleteMeritList: async (id: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/merit/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                set((state) => ({
                    meritLists: state.meritLists.filter(l => l._id !== id),
                    isLoading: false
                }));
                return true;
            }
            throw new Error('Failed to delete merit list');
        } catch (err) {
            console.error('deleteMeritList Error:', err);
            set({ isLoading: false });
            return false;
        }
    },
}));
