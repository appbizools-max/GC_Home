import { useFonts } from 'expo-font';

export function useAppFonts(): [boolean, Error | null] {
  return useFonts({
    'Inter': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
  });
}
