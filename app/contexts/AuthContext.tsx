import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Student, UserRole } from '@/constants/types';
import { mockStudent } from '@/mocks/data';

const AUTH_KEY = 'hostel_auth';

interface StoredAuth {
    isLoggedIn: boolean;
    role: UserRole;
    studentId: string | null;
    hostelName: string | null;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [role, setRole] = useState<UserRole>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [hostelName, setHostelName] = useState<string | null>(null);
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
            if (authQuery.data.isLoggedIn && authQuery.data.role === 'student') {
                setStudent(mockStudent);
            }
        }
    }, [authQuery.data]);

    const loginMutation = useMutation({
        mutationFn: async ({ loginRole, hostel }: { loginRole: UserRole, hostel?: string }) => {
            const authData: StoredAuth = {
                isLoggedIn: true,
                role: loginRole,
                studentId: loginRole === 'student' ? mockStudent.id : null,
                hostelName: hostel || null,
            };
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            return authData;
        },
        onSuccess: (data) => {
            setIsLoggedIn(true);
            setRole(data.role);
            setHostelName(data.hostelName);
            if (data.role === 'student') {
                setStudent(mockStudent);
            }
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
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
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
    });

    const login = useCallback((loginRole: UserRole, hostel?: string) => {
        loginMutation.mutate({ loginRole, hostel });
    }, [loginMutation]);

    const logout = useCallback(() => {
        logoutMutation.mutate();
    }, [logoutMutation]);

    return {
        isLoggedIn,
        role,
        student,
        hostelName,
        login,
        logout,
        isLoading: authQuery.isLoading,
        isLoginLoading: loginMutation.isPending,
    };
});
