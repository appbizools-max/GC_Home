import { Platform, StatusBar } from 'react-native';

export const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 10;
export const BOTTOM_INSET = Platform.OS === 'ios' ? 24 : 0;