import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getBaseUrl = () => {
    // Check if we are in web mode
    if (Platform.OS === 'web') return 'http://localhost:5000/api';
    
    // Get the debugger host (machine IP) from Expo Constants
    const debuggerHost = Constants.expoConfig?.hostUri;
    let machineIp = debuggerHost?.split(':')[0];
    
    // Explicitly check for 127.0.0.1 or localhost and treat as null
    if (machineIp === '127.0.0.1' || machineIp === 'localhost') {
        machineIp = undefined;
    }
    
    // Fallback logic
    if (machineIp) return `http://${machineIp}:5000/api`;
    
    // Default for Android emulator (10.0.2.2) or iOS simulator (localhost)
    if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
    return 'http://localhost:5000/api';
};

export const API_URL = getBaseUrl();

export const getSocketUrl = () => {
    const api = getBaseUrl();
    return api.replace('/api', '');
};

export const SOCKET_URL = getSocketUrl();
