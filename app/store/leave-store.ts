import { create } from 'zustand';
import { LeaveApplication } from '@/constants/types';
import { API_URL } from '@/constants/config';

interface LeaveState {
    leaves: LeaveApplication[];
    isLoading: boolean;
    fetchStudentLeaves: (studentId: string) => Promise<void>;
    fetchWardenLeaves: (hostelName: string, token?: string) => Promise<void>;
    updateLeaveStatus: (id: string, status: 'approved' | 'rejected', token?: string, rejectionReason?: string) => Promise<void>;
    addLeave: (leave: any) => Promise<void>;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
    leaves: [],
    isLoading: false,

    fetchStudentLeaves: async (studentId: string) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/leaves/student/${studentId}`);
            if (!response.ok) throw new Error('Failed to fetch leaves');
            const data = await response.json();
            
            // Map _id to id
            const mappedData = data.map((l: any) => ({
                ...l,
                id: l._id
            }));
            
            set({ leaves: mappedData, isLoading: false });
        } catch (error) {
            console.error('Error fetching student leaves:', error);
            set({ leaves: [], isLoading: false });
        }
    },

    fetchWardenLeaves: async (hostelName: string, token?: string) => {
        if (!token) return;
        set({ isLoading: true });
        try {
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/leaves/warden` + (hostelName ? `?hostelName=${encodeURIComponent(hostelName)}` : ''), {
                headers
            });
            if (!response.ok) throw new Error('Failed to fetch leaves');
            const data = await response.json();
            
            const mappedData = data.map((l: any) => ({
                ...l,
                id: l._id
            }));
            
            set({ leaves: mappedData, isLoading: false });
        } catch (error) {
            console.error('Error fetching warden leaves:', error);
            set({ leaves: [], isLoading: false });
        }
    },

    updateLeaveStatus: async (id, status, token?, rejectionReason?) => {
        if (!token) return;
        set({ isLoading: true });
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/leaves/${id}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status, rejectionReason }),
            });
            
            if (!response.ok) throw new Error('Failed to update leave');
            
            const { leave } = await response.json();
            
            set(state => ({
                leaves: state.leaves.map(l =>
                    l.id === id ? { ...l, status: leave.status, rejectionReason: leave.rejectionReason, qrCodeToken: leave.qrCodeToken } : l
                ),
                isLoading: false
            }));
        } catch (error) {
            console.error('Error updating leave status:', error);
            set({ isLoading: false });
        }
    },

    addLeave: async (newLeaveData) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/leaves`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLeaveData),
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.error('addLeave server error:', errBody);
                throw new Error(errBody.error || 'Failed to add leave');
            }

            const { leave } = await response.json();
            leave.id = leave._id;

            set(state => ({
                leaves: [leave, ...state.leaves],
                isLoading: false
            }));
        } catch (error) {
            console.error('Error adding leave:', error);
            set({ isLoading: false });
            throw error;
        }
    },
}));
