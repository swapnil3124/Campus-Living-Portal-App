import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Student, UserRole } from '@/constants/types';
import { mockStudent } from '@/mocks/data';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:5000/api';
    const debuggerHost = Constants.expoConfig?.hostUri;
    const machineIp = debuggerHost?.split(':')[0];
    if (machineIp) return `http://${machineIp}:5000/api`;
    return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
};

const API_URL = getBaseUrl();

const AUTH_KEY = 'hostel_auth';

interface StoredAuth {
    isLoggedIn: boolean;
    role: UserRole;
    studentId: string | null;
    hostelName: string | null;
    token: string | null;
    userName: string | null;
    subRole: string | null;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [role, setRole] = useState<UserRole>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [hostelName, setHostelName] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [subRole, setSubRole] = useState<string | null>(null);
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

    useEffect(() => {
        if (authQuery.data) {
            setIsLoggedIn(authQuery.data.isLoggedIn);
            setRole(authQuery.data.role);
            setHostelName(authQuery.data.hostelName);
            setUserName(authQuery.data.userName);
            setToken(authQuery.data.token);
            setSubRole(authQuery.data.subRole || null);
            if (authQuery.data.isLoggedIn && authQuery.data.role === 'student') {
                setStudent(mockStudent);
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
                        subRole: data.user.subRole || null
                    };
                    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                    return authData;
                } catch (err: any) {
                    throw err;
                }
            }

            // Mock/Local login for students or cases without full backend auth yet
            const authData: StoredAuth = {
                isLoggedIn: true,
                role: loginRole,
                studentId: loginRole === 'student' ? mockStudent.id : null,
                hostelName: hostel || null,
                token: 'mock-token',
                userName: loginRole === 'student' ? mockStudent.name : loginRole,
                subRole: null
            };
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            return authData;
        },
        onSuccess: (data) => {
            setIsLoggedIn(true);
            setRole(data.role);
            setHostelName(data.hostelName);
            setUserName(data.userName);
            setToken(data.token);
            setSubRole(data.subRole);
            if (data.role === 'student') {
                setStudent(mockStudent);
            }
            Alert.alert('Login Successful', `Welcome back, ${data.userName || 'User'}!`);
            queryClient.invalidateQueries({ queryKey: ['auth'] });
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
        login,
        logout,
        isLoading: authQuery.isLoading,
        isLoginLoading: loginMutation.isPending,
    };
});
