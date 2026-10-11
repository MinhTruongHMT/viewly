import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Category, Video } from "../types";
import { isVideo, safeStorage, useAppStore } from "./useAppStore";
import { useAuthStore } from "./useAuthStore";
import { googleConfig } from "../services/googleConfig";
import {
  youtubeApi,
  YouTubeApiError,
  type SubscriptionChannel,
} from "../services/youtubeApi";

export interface Feed {
  videos: Video[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  nextPageToken?: string;
  fetchedAt: number;
  loadingMore: boolean;
}
interface CatalogEntry {
  video: Video;
  fetchedAt: number;
}
const emptyFeed = (): Feed => ({
  videos: [],
  status: "idle",
  error: null,
  fetchedAt: 0,
  loadingMore: false,
});
const uniqueVideos = (videos: Video[]) => [
  ...new Map(videos.map((video) => [video.id, video])).values(),
];
const cacheLife = 7 * 86400000;
let privateController: AbortController | null = null;
let searchController: AbortController | null = null;
function accessToken() {
  const state = useAuthStore.getState();
  return state.expiresAt > Date.now()
    ? (state.accessToken ?? undefined)
    : undefined;
}
function handleError(error: unknown, token?: string) {
  if (
    error instanceof YouTubeApiError &&
    error.status === 401 &&
    token === useAuthStore.getState().accessToken
  )
    useAuthStore.getState().disconnect(error.message);
  return error instanceof Error
    ? error.message
    : "Không tải được dữ liệu YouTube. Hãy thử lại.";
}
interface YouTubeState {
  catalog: Record<string, CatalogEntry>;
  popular: Feed;
  personal: Feed;
  search: Feed;
  searchQuery: string;
  subscribed: Feed;
  channels: SubscriptionChannel[];
  failedChannels: number;
  privateOwner: string | null;
  lookups: Record<string, number>;
  lookupErrors: Record<string, string>;
  remember: (videos: Video[]) => void;
  loadPopular: (refresh?: boolean, append?: boolean) => Promise<void>;
  loadPersonal: (topics: Category[], refresh?: boolean) => Promise<void>;
  loadSearch: (query: string, refresh?: boolean, append?: boolean) => Promise<void>;
  clearSearch: () => void;
  loadSubscriptions: (
    token: string,
    refresh?: boolean,
    append?: boolean,
  ) => Promise<void>;
  clearPrivate: () => void;
  ensureVideos: (ids: string[], refresh?: boolean) => Promise<void>;
}
export const useYouTubeStore = create<YouTubeState>()(
  persist(
    (set, get) => ({
      catalog: {},
      popular: emptyFeed(),
      personal: emptyFeed(),
      search: emptyFeed(),
      searchQuery: "",
      subscribed: emptyFeed(),
      channels: [],
      failedChannels: 0,
      privateOwner: null,
      lookups: {},
      lookupErrors: {},
      remember: (videos) =>
        set((state) => {
          const catalog = { ...state.catalog };
          for (const video of videos)
            catalog[video.id] = { video, fetchedAt: Date.now() };
          return {
            catalog: Object.fromEntries(
              Object.entries(catalog)
                .filter(([, entry]) => Date.now() - entry.fetchedAt < cacheLife)
                .sort((a, b) => b[1].fetchedAt - a[1].fetchedAt)
                .slice(0, 400),
            ),
          };
        }),
      loadPopular: async (refresh = false, append = false) => {
        const feed = get().popular;
        if (
          feed.status === "loading" ||
          feed.loadingMore ||
          (!refresh &&
            !append &&
            (feed.status === "error" ||
              (feed.status === "ready" &&
                Date.now() - feed.fetchedAt < 300000)))
        )
          return;
        if (append && !feed.nextPageToken) return;
        const token = googleConfig.apiKey ? undefined : accessToken();
        set({
          popular: {
            ...feed,
            status: append ? feed.status : "loading",
            loadingMore: append,
            error: null,
          },
        });
        try {
          const page = await youtubeApi.popular(
            googleConfig.region,
            append ? feed.nextPageToken : "",
            token,
          );
          get().remember(page.videos);
          set({
            popular: {
              videos: uniqueVideos(
                append ? [...feed.videos, ...page.videos] : page.videos,
              ),
              nextPageToken: page.nextPageToken,
              status: "ready",
              error: null,
              fetchedAt: Date.now(),
              loadingMore: false,
            },
          });
        } catch (error) {
          set({
            popular: {
              ...feed,
              status: "error",
              error: handleError(error, token),
              loadingMore: false,
            },
          });
        }
      },
      loadPersonal: async (topics, refresh = false) => {
        if (!topics.length) return;
        const feed = get().personal;
        if (
          feed.status === "loading" ||
          (!refresh &&
            feed.status === "ready" &&
            Date.now() - feed.fetchedAt < 300000)
        )
          return;
        const token = googleConfig.apiKey ? undefined : accessToken();
        set({ personal: { ...feed, status: "loading", error: null } });
        try {
          const videos = await youtubeApi.discover(
            topics,
            googleConfig.region,
            token,
          );
          get().remember(videos);
          set({
            personal: {
              ...emptyFeed(),
              videos,
              status: "ready",
              fetchedAt: Date.now(),
            },
          });
        } catch (error) {
          set({
            personal: {
              ...feed,
              status: "error",
              error: handleError(error, token),
            },
          });
        }
      },
      clearSearch: () => {
        searchController?.abort();
        searchController = null;
        set({ search: emptyFeed(), searchQuery: "" });
      },
      loadSearch: async (input, refresh = false, append = false) => {
        const query = input.trim();
        if (!query) {
          get().clearSearch();
          return;
        }
        const sameQuery = get().searchQuery === query;
        const feed = sameQuery ? get().search : emptyFeed();
        if (sameQuery && (feed.status === "loading" || feed.loadingMore)) return;
        if (
          !refresh && !append && feed.status === "ready" &&
          Date.now() - feed.fetchedAt < 300000
        ) return;
        if (append && (!sameQuery || !feed.nextPageToken)) return;
        searchController?.abort();
        const controller = new AbortController();
        searchController = controller;
        const token = googleConfig.apiKey ? undefined : accessToken();
        set({
          searchQuery: query,
          search: {
            ...(append ? feed : emptyFeed()),
            status: append ? feed.status : "loading",
            loadingMore: append,
            error: null,
          },
        });
        try {
          const page = await youtubeApi.search(
            query,
            googleConfig.region,
            append ? feed.nextPageToken : "",
            token,
            controller.signal,
          );
          if (controller.signal.aborted || searchController !== controller) return;
          get().remember(page.videos);
          set({
            search: {
              videos: uniqueVideos(append ? [...feed.videos, ...page.videos] : page.videos),
              status: "ready",
              error: null,
              nextPageToken: page.nextPageToken,
              fetchedAt: Date.now(),
              loadingMore: false,
            },
          });
        } catch (error) {
          if (controller.signal.aborted || searchController !== controller) return;
          const message = handleError(error, token);
          set({
            search: {
              ...(append ? feed : emptyFeed()),
              status: "error",
              error: message,
              loadingMore: false,
            },
          });
        } finally {
          if (searchController === controller) searchController = null;
        }
      },
      loadSubscriptions: async (token, refresh = false, append = false) => {
        if (
          token !== useAuthStore.getState().accessToken ||
          useAuthStore.getState().expiresAt <= Date.now()
        )
          return;
        const feed = get().subscribed;
        if (
          get().privateOwner === token &&
          (feed.status === "loading" ||
            feed.loadingMore ||
            (!refresh && !append && feed.status !== "idle"))
        )
          return;
        if (append && !feed.nextPageToken) return;
        privateController?.abort();
        const controller = new AbortController();
        privateController = controller;
        set({
          privateOwner: token,
          subscribed: {
            ...feed,
            status: append ? feed.status : "loading",
            loadingMore: append,
            error: null,
          },
        });
        try {
          const page = await youtubeApi.subscriptions(
            token,
            append ? feed.nextPageToken : "",
            controller.signal,
          );
          const result = await youtubeApi.subscriptionVideos(
            page.channels,
            token,
            controller.signal,
          );
          if (
            controller.signal.aborted ||
            token !== useAuthStore.getState().accessToken
          )
            return;
          get().remember(result.videos);
          set((state) => ({
            channels: append
              ? [
                  ...new Map(
                    [...state.channels, ...page.channels].map((channel) => [
                      channel.id,
                      channel,
                    ]),
                  ).values(),
                ]
              : page.channels,
            failedChannels: append
              ? state.failedChannels + result.failedChannels
              : result.failedChannels,
            subscribed: {
              videos: uniqueVideos(
                append ? [...feed.videos, ...result.videos] : result.videos,
              ).sort(
                (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
              ),
              nextPageToken: page.nextPageToken,
              status: "ready",
              error: null,
              fetchedAt: Date.now(),
              loadingMore: false,
            },
          }));
        } catch (error) {
          if (
            controller.signal.aborted ||
            token !== useAuthStore.getState().accessToken
          )
            return;
          const message = handleError(error, token);
          if (token === useAuthStore.getState().accessToken)
            set({
              subscribed: {
                ...feed,
                status: "error",
                error: message,
                loadingMore: false,
              },
            });
        }
      },
      clearPrivate: () => {
        privateController?.abort();
        privateController = null;
        const local = useAppStore.getState();
        set((state) => {
          const retained = new Set([
            ...local.liked,
            ...local.history,
            ...local.watchLater,
            ...local.playlists.flatMap((list) => list.videoIds),
            ...state.popular.videos.map((video) => video.id),
            ...state.personal.videos.map((video) => video.id),
            ...state.search.videos.map((video) => video.id),
          ]);
          const subscriptionIds = new Set(
            state.subscribed.videos.map((video) => video.id),
          );
          return {
            catalog: Object.fromEntries(
              Object.entries(state.catalog).filter(
                ([id]) => !subscriptionIds.has(id) || retained.has(id),
              ),
            ),
            subscribed: emptyFeed(),
            channels: [],
            failedChannels: 0,
            privateOwner: null,
          };
        });
      },
      ensureVideos: async (ids, refresh = false) => {
        const missing = [...new Set(ids)].filter(
          (id) =>
            /^[\w-]{11}$/.test(id) &&
            (refresh ||
              !get().catalog[id] ||
              Date.now() - get().catalog[id].fetchedAt >= cacheLife) &&
            ((refresh && !!get().lookupErrors[id]) ||
              !(get().lookups[id] && Date.now() - get().lookups[id] < 300000)),
        );
        if (!missing.length || (!googleConfig.apiKey && !accessToken())) return;
        const token = googleConfig.apiKey ? undefined : accessToken();
        set((state) => ({
          lookups: {
            ...state.lookups,
            ...Object.fromEntries(missing.map((id) => [id, Date.now()])),
          },
          lookupErrors: Object.fromEntries(
            Object.entries(state.lookupErrors).filter(
              ([id]) => !missing.includes(id),
            ),
          ),
        }));
        try {
          const videos = await youtubeApi.videos(missing, token);
          get().remember(videos);
          const found = new Set(videos.map((video) => video.id));
          set((state) => ({
            lookupErrors: {
              ...state.lookupErrors,
              ...Object.fromEntries(
                missing
                  .filter((id) => !found.has(id))
                  .map((id) => [
                    id,
                    "Video đã bị xóa, không công khai hoặc không cho phép nhúng.",
                  ]),
              ),
            },
          }));
        } catch (error) {
          const message = handleError(error, token);
          set((state) => ({
            lookupErrors: {
              ...state.lookupErrors,
              ...Object.fromEntries(missing.map((id) => [id, message])),
            },
          }));
        }
      },
    }),
    {
      name: "viewly-youtube-catalog",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => {
        const library = useAppStore.getState();
        const retained = new Set([
          ...library.liked,
          ...library.watchLater,
          ...library.history,
          ...library.playlists.flatMap((list) => list.videoIds),
        ]);
        return {
          catalog: Object.fromEntries(
            Object.entries(state.catalog).filter(
              ([id, entry]) =>
                retained.has(id) && Date.now() - entry.fetchedAt < cacheLife,
            ),
          ),
        };
      },
      merge: (saved, current) => {
        const catalog: Record<string, CatalogEntry> = {};
        const raw =
          saved && typeof saved === "object"
            ? (saved as { catalog?: unknown }).catalog
            : undefined;
        if (raw && typeof raw === "object")
          for (const [id, value] of Object.entries(raw).slice(0, 400)) {
            if (!value || typeof value !== "object") continue;
            const entry = value as Partial<CatalogEntry>;
            if (
              typeof entry.fetchedAt !== "number" ||
              entry.fetchedAt > Date.now() ||
              Date.now() - entry.fetchedAt >= cacheLife ||
              !isVideo(entry.video) ||
              entry.video.id !== id ||
              entry.video.source !== "youtube" ||
              typeof entry.video.channelId !== "string"
            )
              continue;
            const video = entry.video;
            catalog[id] = {
              fetchedAt: entry.fetchedAt,
              video: {
                id,
                title: video.title,
                channel: video.channel,
                channelId: video.channelId,
                category: video.category,
                categoryId:
                  typeof video.categoryId === "string"
                    ? video.categoryId
                    : undefined,
                thumbnail: video.thumbnail,
                avatarColor: "#657f61",
                views: video.views,
                publishedAt: video.publishedAt,
                description: video.description,
                duration:
                  typeof video.duration === "string"
                    ? video.duration
                    : undefined,
                source: "youtube",
                tags: Array.isArray(video.tags)
                  ? video.tags.filter((tag) => typeof tag === "string")
                  : [],
              },
            };
          }
        return { ...current, catalog };
      },
    },
  ),
);
// Persist only public metadata explicitly retained by a local action. Private account lists stay in memory.
const unsubscribeLibrary = useAppStore.subscribe((state, previous) => {
  if (
    state.liked !== previous.liked ||
    state.watchLater !== previous.watchLater ||
    state.history !== previous.history ||
    state.playlists !== previous.playlists
  )
    useYouTubeStore.setState({
      catalog: { ...useYouTubeStore.getState().catalog },
    });
});
const unsubscribeAuth = useAuthStore.subscribe((state, previous) => {
  if (state.accessToken !== previous.accessToken)
    useYouTubeStore.getState().clearPrivate();
});
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    unsubscribeLibrary();
    unsubscribeAuth();
    privateController?.abort();
    searchController?.abort();
  });
