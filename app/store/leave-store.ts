import { create } from 'zustand';
import { LeaveApplication } from '@/constants/types';
import { mockLeaves } from '@/mocks/data';

interface LeaveState {
    leaves: LeaveApplication[];
    isLoading: boolean;
    fetchLeaves: () => Promise<void>;
    updateLeaveStatus: (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => Promise<void>;
    addLeave: (leave: Omit<LeaveApplication, 'id' | 'status' | 'createdAt'>) => Promise<void>;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
    leaves: mockLeaves,
    isLoading: false,

    fetchLeaves: async () => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ leaves: [...get().leaves], isLoading: false });
    },

    updateLeaveStatus: async (id, status, rejectionReason) => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        set(state => ({
            leaves: state.leaves.map(l =>
                l.id === id ? { ...l, status, rejectionReason } : l
            ),
            isLoading: false
        }));
    },

    addLeave: async (newLeaveData) => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const newLeave: LeaveApplication = {
            ...newLeaveData,
            id: `L00${get().leaves.length + 1}`,
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
        };
        set(state => ({
            leaves: [newLeave, ...state.leaves],
            isLoading: false
        }));
    },
}));
