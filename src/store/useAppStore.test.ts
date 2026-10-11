import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "./useAppStore";
import { mockVideos } from "../data/mockVideos";
import type { Video } from "../types";

const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});
const imported: Video = {
  ...mockVideos[0],
  id: "abcdefghijk",
  title: "My import",
  imported: true,
  thumbnail: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
};
beforeEach(() => {
  storage.clear();
  useAppStore.setState({
    theme: "light",
    importedVideos: [],
    liked: [],
    watchLater: [],
    subscriptions: [],
    history: [],
    playlists: [],
  });
});
describe("local library", () => {
  it("rejects duplicate imports including mock videos", () => {
    useAppStore.getState().importVideo(imported);
    expect(() => useAppStore.getState().importVideo(imported)).toThrow(
      "already",
    );
    expect(() => useAppStore.getState().importVideo(mockVideos[0])).toThrow(
      "already",
    );
  });
  it("removes an import from all local collections", () => {
    const state = useAppStore.getState();
    state.importVideo(imported);
    state.toggleLike(imported.id);
    state.toggleWatchLater(imported.id);
    state.recordWatch(imported.id);
    const list = state.createPlaylist("Research");
    state.togglePlaylistVideo(list, imported.id);
    state.removeImport(imported.id);
    expect(useAppStore.getState()).toMatchObject({
      importedVideos: [],
      liked: [],
      watchLater: [],
      history: [],
      playlists: [{ id: list, name: "Research", videoIds: [] }],
    });
  });
  it("deduplicates and orders watch history by most recent playback", () => {
    const state = useAppStore.getState();
    state.recordWatch("first");
    state.recordWatch("second");
    state.recordWatch("first");
    expect(useAppStore.getState().history).toEqual(["first", "second"]);
  });
  it("validates playlist names and rejects duplicates case-insensitively", () => {
    const state = useAppStore.getState();
    expect(() => state.createPlaylist("   ")).toThrow();
    state.createPlaylist("  Study  ");
    expect(useAppStore.getState().playlists[0].name).toBe("Study");
    expect(() => state.createPlaylist("study")).toThrow("already");
  });
  it("restores persisted imports, theme and collections", async () => {
    const state = useAppStore.getState();
    state.importVideo(imported);
    state.toggleLike(imported.id);
    state.toggleTheme();
    const saved = storage.get("viewly-library")!;
    useAppStore.setState({ importedVideos: [], liked: [], theme: "light" });
    storage.set("viewly-library", saved);
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState()).toMatchObject({
      importedVideos: [imported],
      liked: [imported.id],
      theme: "dark",
    });
  });
  it("ignores malformed persisted collections and thumbnail URLs", async () => {
    storage.set(
      "viewly-library",
      JSON.stringify({
        version: 1,
        state: {
          importedVideos: [{ ...imported, thumbnail: "javascript:bad" }],
          history: "invalid",
          liked: [42, "valid", "valid"],
          playlists: [null, { id: 123 }],
        },
      }),
    );
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState()).toMatchObject({
      importedVideos: [],
      history: [],
      liked: ["valid"],
      playlists: [],
    });
  });
  it("retains usable defaults when stored JSON is corrupt", async () => {
    storage.set("viewly-library", "{corrupt");
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().importedVideos).toEqual([]);
    expect(typeof useAppStore.getState().toggleLike).toBe("function");
  });
});
