import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useYouTubeStore } from "./useYouTubeStore";
import { useAuthStore } from "./useAuthStore";
import { useAppStore } from "./useAppStore";
import { youtubeApi, YouTubeApiError, type VideoPage } from "../services/youtubeApi";
import { normalizeVideo } from "../services/youtubeApi";
import { fixtureVideo } from "../../tests/fixtures/youtube";

vi.mock("../services/googleConfig", () => ({
  googleConfig: { apiKey: "", clientId: "", region: "VN" },
}));

const storage = new Map<string, string>();
beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  storage.clear();
  useYouTubeStore.getState().clearSearch();
  useAuthStore.getState().disconnect();
  useAppStore.setState({
    liked: [],
    watchLater: [],
    history: [],
    playlists: [],
  });
  useYouTubeStore.setState({
    catalog: {},
    subscribed: {
      videos: [],
      status: "idle",
      error: null,
      fetchedAt: 0,
      loadingMore: false,
    },
    channels: [],
    privateOwner: null,
    lookups: {},
    lookupErrors: {},
  });
});
afterEach(() => {
  useYouTubeStore.getState().clearSearch();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("YouTube search", () => {
  it("cancels outdated searches and ignores their late responses", async () => {
    let resolveOld!: (page: VideoPage) => void;
    const search = vi.spyOn(youtubeApi, "search")
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce({ videos: [normalizeVideo(fixtureVideo("second00001"))!] });
    const oldRequest = useYouTubeStore.getState().loadSearch("old query");
    const oldSignal = search.mock.calls[0][4]!;
    await useYouTubeStore.getState().loadSearch("new query");
    resolveOld({ videos: [normalizeVideo(fixtureVideo())!] });
    await oldRequest;
    expect(oldSignal.aborted).toBe(true);
    expect(useYouTubeStore.getState().searchQuery).toBe("new query");
    expect(useYouTubeStore.getState().search.videos.map((video) => video.id)).toEqual(["second00001"]);
    expect(useYouTubeStore.getState().catalog.abcdefghijk).toBeUndefined();
  });
  it("keeps previous results after pagination errors and retries without duplicates", async () => {
    const first = normalizeVideo(fixtureVideo())!;
    const second = normalizeVideo(fixtureVideo("second00001"))!;
    const search = vi.spyOn(youtubeApi, "search")
      .mockResolvedValueOnce({ videos: [first], nextPageToken: "next" })
      .mockRejectedValueOnce(new YouTubeApiError("quota", 403, "quotaExceeded"))
      .mockResolvedValueOnce({ videos: [first, second] });
    await useYouTubeStore.getState().loadSearch("React");
    await useYouTubeStore.getState().loadSearch("React", false, true);
    expect(useYouTubeStore.getState().search).toMatchObject({
      videos: [first], error: "quota", nextPageToken: "next", loadingMore: false,
    });
    await useYouTubeStore.getState().loadSearch("React", true, true);
    expect(search.mock.calls[2][2]).toBe("next");
    expect(useYouTubeStore.getState().search.videos).toEqual([first, second]);
    expect(useYouTubeStore.getState().search.error).toBeNull();
    expect(JSON.parse(storage.get("viewly-youtube-catalog")!).state.catalog).toEqual({});
  });
  it("searches with a live OAuth token and ignores responses after clearing", async () => {
    useAuthStore.getState().accept("live-token", 3600);
    let resolve!: (page: VideoPage) => void;
    const search = vi.spyOn(youtubeApi, "search")
      .mockImplementation(() => new Promise((done) => { resolve = done; }));
    const request = useYouTubeStore.getState().loadSearch("React");
    expect(search.mock.calls[0][3]).toBe("live-token");
    useYouTubeStore.getState().clearSearch();
    resolve({ videos: [normalizeVideo(fixtureVideo())!] });
    await request;
    expect(useYouTubeStore.getState().searchQuery).toBe("");
    expect(useYouTubeStore.getState().search.videos).toEqual([]);
  });
});
describe("YouTube library privacy", () => {
  it("persists only public metadata deliberately retained by a local action", () => {
    const video = normalizeVideo(fixtureVideo())!;
    useYouTubeStore.getState().remember([video]);
    expect(
      JSON.parse(storage.get("viewly-youtube-catalog")!).state.catalog,
    ).toEqual({});
    useAppStore.getState().toggleWatchLater(video.id);
    expect(
      JSON.parse(storage.get("viewly-youtube-catalog")!).state.catalog[video.id]
        .video.title,
    ).toBe(video.title);
    useAppStore.getState().toggleWatchLater(video.id);
    expect(
      JSON.parse(storage.get("viewly-youtube-catalog")!).state.catalog,
    ).toEqual({});
  });
  it("ignores expired cached metadata and corrupted snapshots", async () => {
    const video = normalizeVideo(fixtureVideo())!;
    storage.set(
      "viewly-youtube-catalog",
      JSON.stringify({
        version: 1,
        state: {
          catalog: {
            [video.id]: { video, fetchedAt: Date.now() - 8 * 86400000 },
            bad: { video: {}, fetchedAt: Date.now() },
          },
        },
      }),
    );
    await useYouTubeStore.persist.rehydrate();
    expect(useYouTubeStore.getState().catalog).toEqual({});
  });
  it("clears a Google subscription feed immediately on logout", () => {
    useAuthStore.getState().accept("account-a", 3600);
    const video = normalizeVideo(fixtureVideo())!;
    useYouTubeStore.getState().remember([video]);
    useYouTubeStore.setState({
      channels: [{ id: "channel", name: "Private choice" }],
      privateOwner: "account-a",
      subscribed: {
        videos: [video],
        status: "ready",
        error: null,
        fetchedAt: Date.now(),
        loadingMore: false,
      },
    });
    useAuthStore.getState().disconnect();
    expect(useYouTubeStore.getState().channels).toEqual([]);
    expect(useYouTubeStore.getState().privateOwner).toBeNull();
    expect(useYouTubeStore.getState().catalog[video.id]).toBeUndefined();
    expect(storage.get("viewly-youtube-catalog")).not.toContain("account-a");
    expect(storage.get("viewly-youtube-catalog")).not.toContain(
      "Private choice",
    );
  });
  it("discards subscription results arriving after logout", async () => {
    useAuthStore.getState().accept("account-a", 3600);
    let resolve!: (page: { channels: { id: string; name: string }[] }) => void;
    vi.spyOn(youtubeApi, "subscriptions").mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    vi.spyOn(youtubeApi, "subscriptionVideos").mockResolvedValue({
      videos: [normalizeVideo(fixtureVideo())!],
      failedChannels: 0,
    });
    const request = useYouTubeStore.getState().loadSubscriptions("account-a");
    useAuthStore.getState().disconnect();
    resolve({ channels: [{ id: "channel", name: "Old account" }] });
    await request;
    expect(useYouTubeStore.getState().channels).toEqual([]);
    expect(useYouTubeStore.getState().subscribed.videos).toEqual([]);
  });
});
