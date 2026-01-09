// Polyfills required for supabase-js and React Native runtime.
// Load native-only polyfills conditionally so web bundling doesn't fail.
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

// NOTE: router entry removed temporarily for debugging to ensure
// the app can render without expo-router causing a blank screen.

import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileScreen from './components/ProfileScreen';
import UploadScreen from './components/UploadScreen';
import VideoFeed from './components/VideoFeed';
import { colors } from './constants/colors';

export default function App() {
	const [tab, setTab] = useState('feed');

	let Screen = <VideoFeed />;
	if (tab === 'upload') Screen = <UploadScreen />;
	if (tab === 'profile') Screen = <ProfileScreen />;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
				<StatusBar barStyle="light-content" />
				<View style={{ flex: 1 }}>{Screen}</View>
				<View style={styles.bottom}>
					<TabButton label="Feed" active={tab === 'feed'} onPress={() => setTab('feed')} />
					<TabButton label="Upload" active={tab === 'upload'} onPress={() => setTab('upload')} />
					<TabButton label="Profile" active={tab === 'profile'} onPress={() => setTab('profile')} />
				</View>
			</SafeAreaView>
		</GestureHandlerRootView>
	);
}

function TabButton({ label, active, onPress }) {
	return (
		<TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.active]}>
			<Text style={{ color: active ? colors.primary : colors.text }}>{label}</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	bottom: { height: 60, flexDirection: 'row', borderTopWidth: 1, borderColor: '#111' },
	tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	active: { backgroundColor: '#0B0B0D' },
});
