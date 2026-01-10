// Polyfills required for supabase-js and React Native runtime.
// Load native-only polyfills conditionally so web bundling doesn't fail.
import { Platform } from 'react-native';

try {
	if (Platform && Platform.OS && Platform.OS !== 'web') {
		const mod = 'react-native-get-random-values';
		try { require(mod); } catch (e) {}
	}
} catch (e) {}

try {
	if (typeof URL === 'undefined') {
		const mod = 'react-native-url-polyfill/auto';
		try { require(mod); } catch (e) {}
	}
} catch (e) {}

try {
	if (Platform && Platform.OS && Platform.OS !== 'web') {
		const mod = 'expo-crypto';
		try { require(mod); } catch (e) {}
	}
} catch (e) {}

// ---------------- APP ----------------

import React, { useState } from 'react';
import { StatusBar, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
	SafeAreaProvider,
	SafeAreaView,
} from 'react-native-safe-area-context';

import VideoFeed from './components/VideoFeed';
import UploadScreen from './components/UploadScreen';
import ProfileScreen from './components/ProfileScreen';
import { colors } from './constants/colors';

export default function App() {
	const [tab, setTab] = useState('feed');

	let Screen = <VideoFeed />;
	if (tab === 'upload') Screen = <UploadScreen />;
	if (tab === 'profile') Screen = <ProfileScreen />;

	return (
		<SafeAreaProvider>
			<SafeAreaView
				style={styles.container}
				edges={['top', 'left', 'right']}
			>
				<StatusBar barStyle="light-content" />
				<View style={{ flex: 1 }}>{Screen}</View>

				<View style={styles.bottom}>
					<TabButton
						label="Feed"
						active={tab === 'feed'}
						onPress={() => setTab('feed')}
					/>
					<TabButton
						label="Upload"
						active={tab === 'upload'}
						onPress={() => setTab('upload')}
					/>
					<TabButton
						label="Profile"
						active={tab === 'profile'}
						onPress={() => setTab('profile')}
					/>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

function TabButton({ label, active, onPress }) {
	return (
		<TouchableOpacity
			onPress={onPress}
			style={[styles.tab, active && styles.active]}
		>
			<Text style={{ color: active ? colors.primary : colors.text }}>
				{label}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	bottom: {
		height: 60,
		flexDirection: 'row',
		borderTopWidth: 1,
		borderColor: '#111',
	},
	tab: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	active: {
		backgroundColor: '#0B0B0D',
	},
});
