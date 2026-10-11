import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { mockVideos } from "../data/mockVideos";
import { categories, type Playlist, type Video } from "../types";
import type { Category } from "../types";
import { googleConfig } from "../services/googleConfig";

const toggle = (items: string[], id: string) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter((item): item is string => typeof item === "string"),
        ),
      ]
    : [];
export function isVideo(value: unknown): value is Video {
  if (!value || typeof value !== "object") return false;
  const video = value as Partial<Video>;
  return (
    typeof video.id === "string" &&
    /^[\w-]{11}$/.test(video.id) &&
    typeof video.title === "string" &&
    typeof video.channel === "string" &&
    typeof video.category === "string" &&
    categories.some((category) => category === video.category) &&
    typeof video.thumbnail === "string" &&
    video.thumbnail === `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` &&
    typeof video.description === "string" &&
    typeof video.publishedAt === "string" &&
    Number.isFinite(Date.parse(video.publishedAt)) &&
    typeof video.views === "number" &&
    Number.isFinite(video.views) &&
    typeof video.avatarColor === "string"
  );
}
export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      window.dispatchEvent(new Event("viewly-storage-error"));
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* Storage may be unavailable in private browsers. */
    }
  },
};
interface AppState {
  theme: "light" | "dark";
  importedVideos: Video[];
  liked: string[];
  watchLater: string[];
  subscriptions: string[];
  history: string[];
  playlists: Playlist[];
  interests: Category[];
  feedSource: "demo" | "popular" | "personal";
  toggleInterest: (category: Category) => void;
  setFeedSource: (source: "demo" | "popular" | "personal") => void;
  toggleTheme: () => void;
  toggleLike: (id: string) => void;
  toggleWatchLater: (id: string) => void;
  toggleSubscription: (channel: string) => void;
  recordWatch: (id: string) => void;
  clearHistory: () => void;
  importVideo: (video: Video) => void;
  removeImport: (id: string) => void;
  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  togglePlaylistVideo: (playlistId: string, videoId: string) => void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "light",
      importedVideos: [],
      liked: [],
      watchLater: [],
      subscriptions: [],
      history: [],
      playlists: [],
      interests: [],
      feedSource: googleConfig.apiKey ? "popular" : "demo",
      toggleInterest: (category) =>
        set((state) => ({
          interests: state.interests.includes(category)
            ? state.interests.filter((item) => item !== category)
            : [...state.interests, category],
        })),
      setFeedSource: (feedSource) => set({ feedSource }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      toggleLike: (id) => set((state) => ({ liked: toggle(state.liked, id) })),
      toggleWatchLater: (id) =>
        set((state) => ({ watchLater: toggle(state.watchLater, id) })),
      toggleSubscription: (channel) =>
        set((state) => ({
          subscriptions: toggle(state.subscriptions, channel),
        })),
      recordWatch: (id) =>
        set((state) => ({
          history: [id, ...state.history.filter((item) => item !== id)].slice(
            0,
            200,
          ),
        })),
      clearHistory: () => set({ history: [] }),
      importVideo: (video) => {
        if (
          [...mockVideos, ...get().importedVideos].some(
            (item) => item.id === video.id,
          )
        )
          throw new Error(
            "This video is already in your library. Try another link.",
          );
        set((state) => ({
          importedVideos: [
            { ...video, imported: true },
            ...state.importedVideos,
          ],
        }));
      },
      removeImport: (id) =>
        set((state) => ({
          importedVideos: state.importedVideos.filter(
            (video) => video.id !== id,
          ),
          liked: state.liked.filter((item) => item !== id),
          watchLater: state.watchLater.filter((item) => item !== id),
          history: state.history.filter((item) => item !== id),
          playlists: state.playlists.map((list) => ({
            ...list,
            videoIds: list.videoIds.filter((item) => item !== id),
          })),
        })),
      createPlaylist: (name) => {
        const trimmed = name.trim();
        if (!trimmed || trimmed.length > 80)
          throw new Error("Use a playlist name between 1 and 80 characters.");
        if (
          get().playlists.some(
            (list) => list.name.toLowerCase() === trimmed.toLowerCase(),
          )
        )
          throw new Error("A playlist with this name already exists.");
        const id = crypto.randomUUID();
        set((state) => ({
          playlists: [...state.playlists, { id, name: trimmed, videoIds: [] }],
        }));
        return id;
      },
      deletePlaylist: (id) =>
        set((state) => ({
          playlists: state.playlists.filter((list) => list.id !== id),
        })),
      togglePlaylistVideo: (playlistId, videoId) =>
        set((state) => ({
          playlists: state.playlists.map((list) =>
            list.id === playlistId
              ? { ...list, videoIds: toggle(list.videoIds, videoId) }
              : list,
          ),
        })),
    }),
    {
      name: "viewly-library",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({
        theme,
        importedVideos,
        liked,
        watchLater,
        subscriptions,
        history,
        playlists,
        interests,
        feedSource,
      }) => ({
        theme,
        importedVideos,
        liked,
        watchLater,
        subscriptions,
        history,
        playlists,
        interests,
        feedSource,
      }),
      merge: (persisted, current) => {
        const saved =
          persisted && typeof persisted === "object"
            ? (persisted as Record<string, unknown>)
            : {};
        return {
          ...current,
          theme: saved.theme === "dark" ? "dark" : "light",
          importedVideos: Array.isArray(saved.importedVideos)
            ? saved.importedVideos
                .filter(isVideo)
                .filter(
                  (video, index, all) =>
                    !mockVideos.some((mock) => mock.id === video.id) &&
                    all.findIndex((item) => item.id === video.id) === index,
                )
            : [],
          liked: strings(saved.liked),
          watchLater: strings(saved.watchLater),
          subscriptions: strings(saved.subscriptions),
          history: strings(saved.history).slice(0, 200),
          interests: strings(saved.interests).filter(
            (item): item is Category =>
              item !== "All" &&
              categories.some((category) => category === item),
          ),
          feedSource:
            saved.feedSource === "demo" ||
            saved.feedSource === "personal" ||
            saved.feedSource === "popular"
              ? saved.feedSource
              : current.feedSource,
          playlists: Array.isArray(saved.playlists)
            ? saved.playlists
                .filter(
                  (item): item is Playlist =>
                    !!item &&
                    typeof item === "object" &&
                    typeof item.id === "string" &&
                    typeof item.name === "string" &&
                    Array.isArray(item.videoIds),
                )
                .map((list) => ({ ...list, videoIds: strings(list.videoIds) }))
            : [],
        };
      },
    },
  ),
);
