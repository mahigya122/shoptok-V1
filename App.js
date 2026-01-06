// Polyfills required for supabase-js and React Native runtime.
// Load native-only polyfills conditionally so web bundling doesn't fail.
import { Platform } from 'react-native';

try {
	// react-native-get-random-values is a native module — require dynamically using a variable
	// so bundlers won't statically try to resolve it for web.
	if (Platform && Platform.OS && Platform.OS !== 'web') {
		const mod = 'react-native-get-random-values';
		try { require(mod); } catch (e) { /* ignore if not installed on native runtime */ }
	}
} catch (e) {
	// ignore
}

try {
	// URL polyfill — only load when URL is missing
	if (typeof URL === 'undefined') {
		const mod = 'react-native-url-polyfill/auto';
		try { require(mod); } catch (e) { /* ignore on web */ }
	}
} catch (e) {
	// ignore
}

try {
	// expo-crypto may be available on native runtimes
	if (Platform && Platform.OS && Platform.OS !== 'web') {
		const mod = 'expo-crypto';
		try { require(mod); } catch (e) { /* ignore */ }
	}
} catch (e) {
	// ignore
}

import 'expo-router/entry';

// This file bootstraps the Expo Router (file-based routing).
// Keep it minimal — `expo`'s AppEntry will resolve to this.
