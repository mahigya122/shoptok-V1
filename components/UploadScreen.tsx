import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import { useLocalInteractions } from '../store/localInteractions';
import { useUserStore } from '../store/userStore';
import * as api from '../services/api';

export default function UploadScreen() {
  const addUpload = useLocalInteractions((s) => s.addUpload);
  const userId = useUserStore((s) => s.userId);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');

  const createMockUpload = () => {
    const id = 'local-' + Math.random().toString(36).slice(2);
    const video = {
      id,
      title,
      caption,
      video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      poster_url: undefined,
      created_at: new Date().toISOString(),
      uploaderId: userId || null,
    };
    addUpload(video);
    Alert.alert('Uploaded', 'Local upload added to feed');
    setTitle(''); setCaption('');
  };

  const pickAndUpload = async () => {
    let ImagePicker: any = null;
    try {
      ImagePicker = require('expo-image-picker');
    } catch (e) {
      ImagePicker = null;
    }

    if (!ImagePicker) {
      Alert.alert('Missing dependency', 'Please install expo-image-picker: npm install expo-image-picker');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.8 });
    if (res.cancelled) return;

    const uri = res.uri;
    const filename = 'videos/' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + uri.split('/').pop();

    try {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const publicUrl = await api.uploadToStorage('videos', filename, blob, res.type || 'video/mp4');

      const row = await api.createVideoRow({
        title,
        caption,
        video_url: publicUrl,
        poster_url: null,
        created_at: new Date().toISOString(),
      });

      useLocalInteractions.getState().addUpload(row);
      Alert.alert('Uploaded', 'Video uploaded and added to feed');
      setTitle(''); setCaption('');
    } catch (e) {
      console.warn('Upload failed', e);
      Alert.alert('Upload failed', String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h}>Upload (mock)</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" style={styles.input} />
      <TextInput value={caption} onChangeText={setCaption} placeholder="Caption" style={styles.input} />
      <Button title="Add sample video to feed" onPress={createMockUpload} />
      <Text style={styles.note}>This creates a local mock upload that appears in the feed immediately.</Text>
      <Button title="Pick & Upload Video" onPress={pickAndUpload} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#070708' },
  h: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#111', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  note: { color: '#999', marginTop: 12 }
});
