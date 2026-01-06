import { useColorScheme as rnUseColorScheme } from 'react-native';

export function useColorScheme() {
  // React Native's hook returns 'light' | 'dark' | null
  return rnUseColorScheme();
}

export default useColorScheme;
