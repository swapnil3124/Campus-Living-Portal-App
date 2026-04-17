import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getBaseUrl = () => {
    // Machine IP for local network connectivity
    const MACHINE_IP = '10.219.141.132';

    // Check if we are in web mode
    if (Platform.OS === 'web') return 'http://localhost:5000/api';
    
    // For local development on physical devices or APKs
    return `http://${MACHINE_IP}:5000/api`;
};

export const API_URL = getBaseUrl();

export const getSocketUrl = () => {
    const api = getBaseUrl();
    return api.replace('/api', '');
};

export const SOCKET_URL = getSocketUrl();
