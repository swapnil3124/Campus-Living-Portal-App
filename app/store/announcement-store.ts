import { create } from 'zustand';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { API_URL } from '@/constants/config';

export interface Announcement {
    _id?: string;
    message: string;
    details?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdBy?: string;
    fileUrl?: string; // Add file URL for downloading attachments
    createdAt?: string;
}

interface AnnouncementStore {
    announcements: Announcement[];
    activeAnnouncements: Announcement[];
    isLoading: boolean;
    error: string | null;
    fetchAnnouncements: () => Promise<void>;
    fetchActiveAnnouncements: () => Promise<void>;
    addAnnouncement: (announcement: Partial<Announcement>) => Promise<boolean>;
    updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<boolean>;
    deleteAnnouncement: (id: string) => Promise<boolean>;
}

export const useAnnouncementStore = create<AnnouncementStore>((set, get) => ({
    announcements: [],
    activeAnnouncements: [],
    isLoading: false,
    error: null,

    fetchAnnouncements: async () => {
        if (get().announcements.length === 0) set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/announcements`);
            if (!response.ok) throw new Error('Failed to fetch announcements');
            const data = await response.json();
            set({ announcements: data, isLoading: false });
        } catch (err: any) {
            if (get().announcements.length === 0) set({ error: err.message, isLoading: false });
        }
    },

    fetchActiveAnnouncements: async () => {
        if (get().activeAnnouncements.length === 0) set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/announcements/active`);
            if (!response.ok) throw new Error('Failed to fetch active announcements');
            const data = await response.json();
            set({ activeAnnouncements: data, isLoading: false });
        } catch (err: any) {
            if (get().activeAnnouncements.length === 0) set({ error: err.message, isLoading: false });
        }
    },

    addAnnouncement: async (ann) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ann),
            });
            if (!response.ok) throw new Error('Failed to create announcement');
            const newAnn = await response.json();
            set((state) => ({ announcements: [newAnn, ...state.announcements], isLoading: false }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    updateAnnouncement: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/announcements/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update announcement');
            const updatedAnn = await response.json();
            set((state) => ({
                announcements: state.announcements.map((a) => a._id === id ? updatedAnn : a),
                isLoading: false
            }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    deleteAnnouncement: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/announcements/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete announcement');
            set((state) => ({
                announcements: state.announcements.filter((a) => a._id !== id),
                isLoading: false
            }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
        }
    },
}));
