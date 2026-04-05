import { create } from 'zustand';
import { HostelExit } from '@/constants/types';
import { API_URL } from '@/constants/config';
// Socket removed here
import { io } from 'socket.io-client';

interface ExitStore {
    exits: HostelExit[];
    isLoading: boolean;
    error: string | null;
    fetchStudentExits: (studentId: string) => Promise<void>;
    fetchWardenExits: (hostelName: string) => Promise<void>;
    submitExit: (data: Partial<HostelExit>) => Promise<boolean>;
    updateExitStatus: (id: string, status: 'approved' | 'rejected', wardenRemark: string) => Promise<boolean>;
    initSocket: () => void;
}

// Singleton socket for realtime updates
let socket: any = null;

export const useExitStore = create<ExitStore>((set, get) => ({
    exits: [],
    isLoading: false,
    error: null,

    initSocket: () => {
        if (!socket) {
            socket = io(API_URL.replace('/api', ''));
            socket.on('hostel_exit_updated', () => {
                // In a structured app we'd recall fetch based on current role, 
                // but setting a flag or just relying on pull-to-refresh works too.
            });
        }
    },

    fetchStudentExits: async (studentId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/hostel-exit/student?studentId=${studentId}&userRole=student`);
            const data = await response.json();
            if (response.ok) {
                set({ exits: data, isLoading: false });
            } else {
                set({ error: data.message, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchWardenExits: async (hostelName: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/hostel-exit/warden?hostelName=${encodeURIComponent(hostelName)}`);
            const data = await response.json();
            if (response.ok) {
                set({ exits: data, isLoading: false });
            } else {
                set({ error: data.message, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    submitExit: async (data) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/hostel-exit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            set({ isLoading: false });
            
            if (response.ok && result.success) {
                set((state) => ({ exits: [result.request, ...state.exits] }));
                return true;
            }
            return false;
        } catch (error) {
            set({ isLoading: false, error: 'Failed to submit exit request' });
            return false;
        }
    },

    updateExitStatus: async (id, status, wardenRemark) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/hostel-exit/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, wardenRemark }),
            });
            const result = await response.json();
            set({ isLoading: false });
            
            if (response.ok && result.success) {
                set((state) => ({
                    exits: state.exits.map(ex => ex._id === id ? result.request : ex)
                }));
                return true;
            }
            return false;
        } catch (error) {
            set({ isLoading: false, error: 'Failed to update exit status' });
            return false;
        }
    }
}));
