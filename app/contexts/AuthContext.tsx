import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Student, UserRole } from '@/constants/types';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

import { API_URL } from '@/constants/config';

const AUTH_KEY = 'hostel_auth';

interface StoredAuth {
    isLoggedIn: boolean;
    role: UserRole;
    studentId: string | null;
    hostelName: string | null;
    token: string | null;
    userName: string | null;
    subRole: string | null;
    isRoomAllocated?: boolean;
    watchmanId: string | null;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [role, setRole] = useState<UserRole>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [hostelName, setHostelName] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [subRole, setSubRole] = useState<string | null>(null);
    const [isRoomAllocated, setIsRoomAllocated] = useState<boolean>(false);
    const [watchmanId, setWatchmanId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const authQuery = useQuery({
        queryKey: ['auth'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(AUTH_KEY);
            if (stored) {
                return JSON.parse(stored) as StoredAuth;
            }
            return null;
        },
    });

    const fetchProfile = async () => {
        if (!token || role !== 'student') return;
        try {
            const response = await fetch(`${API_URL}/students/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.student) {
                const s = data.student;
                setStudent({
                    _id: s._id,
                    id: s._id,
                    name: s.fullName,
                    email: s.email,
                    phone: s.phone,
                    enrollmentNo: s.enrollment,
                    department: s.department,
                    year: s.year || '1st Year',
                    admissionType: s.category || 'Open',
                    category: s.category || 'Open',
                    isRoomAllocated: s.isRoomAllocated || false,
                    gender: s.gender || 'Male',
                    hostelName: s.allocatedHostel || (s.gender === 'Female' 
                        ? 'Jijau' 
                        : (s.year?.includes('2nd') || s.year?.includes('Second') ? 'Lenyadri' : 
                          s.year?.includes('3rd') || s.year?.includes('Third') ? 'Bhimashankar' : 'Shivneri')),
                    roomNo: s.allocatedRoom || 'N/A',
                    bedNumber: s.allocatedBed || 'N/A',
                    floor: s.allocatedRoom ? parseInt(s.allocatedRoom[0]) || 1 : 1,
                    photoUrl: s.photoUrl || s.additionalData?.photoUrl || '',
                    status: s.status === 'accepted' ? 'active' : 'pending',
                    rollNo: s.enrollment,
                    prevMarks: s.prevMarks || 'N/A',
                    distance: s.distance || '0 km',
                    parentName: s.additionalData?.parentName || 'N/A',
                    parentContact: s.additionalData?.parentContact || s.additionalData?.emergencyContact || 'N/A',
                    dateOfJoining: s.appliedAt ? new Date(s.appliedAt).toLocaleDateString() : 'N/A',
                    feeStatus: (s.feeStatus as any) || 'pending'
                } as any);
                setIsRoomAllocated(s.isRoomAllocated || false);
            }
        } catch (err) {
            console.error('Profile refresh error:', err);
        }
    };

    const refreshProfile = useCallback(() => {
        fetchProfile();
    }, [token, role]);

    useEffect(() => {
        if (authQuery.data) {
            setIsLoggedIn(authQuery.data.isLoggedIn);
            setRole(authQuery.data.role);
            setHostelName(authQuery.data.hostelName);
            setUserName(authQuery.data.userName);
            setToken(authQuery.data.token);
            setSubRole(authQuery.data.subRole || null);
            setIsRoomAllocated(authQuery.data.isRoomAllocated || false);
            setWatchmanId(authQuery.data.watchmanId || null);
            
            if (authQuery.data.isLoggedIn && authQuery.data.role === 'student') {
                fetchProfile();
            }
        }
    }, [authQuery.data]);

    const loginMutation = useMutation({
        mutationFn: async ({ loginRole, hostel, staffId, password }: { loginRole: UserRole, hostel?: string, staffId?: string, password?: string }) => {
            // Real login for staff roles (rector etc)
            if (loginRole && ['rector', 'admin', 'contractor', 'watchman'].includes(loginRole as any) && staffId && password) {
                try {
                    const response = await fetch(`${API_URL}/auth/staff-login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ staffId, password })
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Login failed');

                    const authData: StoredAuth = {
                        isLoggedIn: true,
                        role: data.user.role,
                        studentId: null,
                        hostelName: data.user.subRole || hostel || null,
                        token: data.token,
                        userName: data.user.name,
                        subRole: data.user.subRole || null,
                        isRoomAllocated: true,
                        watchmanId: data.user.id
                    };
                    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                    return authData;
                } catch (err: any) {
                    throw err;
                }
            }

            // Real login for students
            if (loginRole === 'student' && staffId && password) {
                try {
                    const response = await fetch(`${API_URL}/students/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enrollmentId: staffId, password })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Login failed');

                    const authData: StoredAuth = {
                        isLoggedIn: true,
                        role: 'student',
                        studentId: data.student.id,
                        hostelName: null,
                        token: data.token,
                        userName: data.student.name,
                        subRole: null,
                        isRoomAllocated: data.student.isRoomAllocated || false,
                        watchmanId: null
                    };
                    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                    return authData;
                } catch (err: any) {
                    throw err;
                }
            }

            throw new Error('Invalid login role or missing credentials');
        },
        onSuccess: (data) => {
            setIsLoggedIn(true);
            setRole(data.role);
            setHostelName(data.hostelName);
            setUserName(data.userName);
            setToken(data.token);
            setSubRole(data.subRole);
            setWatchmanId(data.watchmanId);
            if (data.role === 'student') {
                setStudent({ 
                    _id: data.studentId,
                    id: data.studentId, 
                    name: data.userName, 
                    enrollmentNo: data.studentId 
                } as any);
            }
            Alert.alert('Login Successful', `Welcome back, ${data.userName || 'User'}!`);
            queryClient.invalidateQueries({ queryKey: ['auth'] });

            // Navigate based on role and room allocation
            if (data.role === 'student' && !data.isRoomAllocated) {
                router.replace('/room-selection' as any);
            } else {
                router.replace('/(tabs)/dashboard' as any);
            }
        },
        onError: (error: any) => {
            Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
        }
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await AsyncStorage.removeItem(AUTH_KEY);
        },
        onSuccess: () => {
            setIsLoggedIn(false);
            setRole(null);
            setStudent(null);
            setHostelName(null);
            setUserName(null);
            setToken(null);
            setSubRole(null);
            setIsRoomAllocated(false);
            setWatchmanId(null);
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
    });

    const login = useCallback((loginRole: UserRole, params?: { hostel?: string, staffId?: string, password?: string }) => {
        loginMutation.mutate({
            loginRole,
            hostel: params?.hostel,
            staffId: params?.staffId,
            password: params?.password
        });
    }, [loginMutation]);

    const logout = useCallback(() => {
        logoutMutation.mutate();
    }, [logoutMutation]);

    return {
        isLoggedIn,
        role,
        student,
        hostelName,
        userName,
        token,
        subRole,
        isRoomAllocated,
        watchmanId,
        login,
        logout,
        refreshProfile,
        isLoading: authQuery.isLoading,
        isLoginLoading: loginMutation.isPending,
    };
});
