import React, { useState, useEffect } from 'react';
import { Modal, View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import { useLocalInteractions } from '../store/localInteractions';
import { useUserStore } from '../store/userStore';
import { commentVideo } from '../services/api';

interface CommentsModalProps {
  videoId: string;
  visible: boolean;
  onClose: () => void;
}

export default function CommentsModal({ videoId, visible, onClose }: CommentsModalProps) {
  const comments = useLocalInteractions((s) => s.comments[videoId] || []);
  const addComment = useLocalInteractions((s) => s.addComment);
  const userId = useUserStore((s) => s.userId);

  const [text, setText] = useState('');

  useEffect(() => {
    if (!visible) setText('');
  }, [visible]);

  const send = async () => {
    if (!text) return;

    const newComment = {
      id: Math.random().toString(36).slice(2),
      userId: userId || null,
      text,
      createdAt: new Date().toISOString()
    };

    // Add locally
    addComment(videoId, newComment);

    // Send to Supabase (backend)
    try {
      await commentVideo(videoId, userId || 'anonymous', text);
    } catch (err) {
      console.warn("Failed to send comment to backend", err);
    }

    setText('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.h}>Comments</Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.small}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No comments yet</Text>}
        />

        <View style={styles.compose}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a comment"
            style={styles.input}
          />
          <Button title="Send" onPress={send} />
        </View>

        <Button title="Close" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#070708' },
  h: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#111' },
  text: { color: '#fff' },
  small: { color: '#888', fontSize: 12 },
  empty: { color: '#888' },
  compose: { flexDirection: 'row', gap: 8, alignItems: 'center', marginVertical: 12 },
  input: { flex: 1, backgroundColor: '#111', color: '#fff', padding: 8, borderRadius: 8 }
});
