import { create } from 'zustand';

type Comment = { id: string; userId?: string | null; text: string; createdAt: string };

type LocalVideo = {
  id: string;
  title?: string;
  caption?: string;
  video_url: string;
  poster_url?: string;
  created_at: string;
  uploaderId?: string | null;
};

type LocalState = {
  uploads: LocalVideo[];
  comments: Record<string, Comment[]>;
  reactions: Record<string, Record<string, number>>; // videoId -> { emoji: count }
  addUpload: (v: LocalVideo) => void;
  addComment: (videoId: string, comment: Comment) => void;
  addReaction: (videoId: string, emoji: string) => void;
};

export const useLocalInteractions = create<LocalState>((set, get) => ({
  uploads: [],
  comments: {},
  reactions: {},
  addUpload: (v) => set({ uploads: [v, ...get().uploads] }),
  addComment: (videoId, comment) => set((s) => ({ comments: { ...s.comments, [videoId]: [...(s.comments[videoId] || []), comment] } })),
  addReaction: (videoId, emoji) => set((s) => {
    const prev = s.reactions[videoId] || {};
    const next = { ...prev, [emoji]: (prev[emoji] || 0) + 1 };
    return { reactions: { ...s.reactions, [videoId]: next } };
  }),
}));

export type { LocalVideo, Comment };
