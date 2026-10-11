import { afterEach, describe, expect, it, vi } from "vitest";
import {
  YouTubeApi,
  normalizeVideo,
  formatDuration,
  YouTubeApiError,
} from "./youtubeApi";

import { fixtureVideo } from "../../tests/fixtures/youtube";
afterEach(() => vi.unstubAllGlobals());
describe("YouTube API adapter", () => {
  it("searches Unicode queries, preserves relevance order, and returns pagination", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [
          { id: { videoId: "abcdefghijk" } },
          { id: { videoId: "second00001" } },
          { id: { videoId: "abcdefghijk" } },
          { id: { channelId: "not-a-video" } },
        ],
        nextPageToken: "search-next",
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [fixtureVideo("second00001"), fixtureVideo()],
      })));
    vi.stubGlobal("fetch", fetcher);
    const page = await new YouTubeApi("public-key").search("  nhạc Việt & chill  ", "VN", "previous");
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get("q")).toBe("nhạc Việt & chill");
    expect(url.searchParams.get("type")).toBe("video");
    expect(url.searchParams.get("videoEmbeddable")).toBe("true");
    expect(url.searchParams.get("pageToken")).toBe("previous");
    expect(page.videos.map((video) => video.id)).toEqual(["abcdefghijk", "second00001"]);
    expect(page.nextPageToken).toBe("search-next");
  });
  it("does not send requests for blank searches or load details for no matches", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] })));
    vi.stubGlobal("fetch", fetcher);
    const api = new YouTubeApi("key");
    expect(await api.search("   ", "VN")).toEqual({ videos: [] });
    expect(fetcher).not.toHaveBeenCalled();
    expect((await api.search("no matches", "VN")).videos).toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    ["PT2M8S", "2:08"],
    ["PT1H2M3S", "1:02:03"],
    ["P1DT1H", "25:00:00"],
    ["PT0S", "0:00"],
    ["invalid", undefined],
  ])("formats duration %s", (input, result) =>
    expect(formatDuration(input!)).toBe(result),
  );
  it("normalizes real metadata without interpreting HTML", () => {
    expect(normalizeVideo(fixtureVideo())).toMatchObject({
      id: "abcdefghijk",
      views: 12345,
      duration: "1:02:03",
      source: "youtube",
      category: "Programming",
      categoryId: "28",
      channelId: "UCabcdefghijklmnopqrstuv",
    });
    expect(
      normalizeVideo({
        ...fixtureVideo(),
        snippet: { ...fixtureVideo().snippet, title: "<script>bad</script>" },
      })?.title,
    ).toBe("<script>bad</script>");
  });
  it.each([
    null,
    {},
    { ...fixtureVideo(), id: "short" },
    {
      ...fixtureVideo(),
      status: { privacyStatus: "private", embeddable: true },
    },
    {
      ...fixtureVideo(),
      status: { privacyStatus: "public", embeddable: false },
    },
  ])("omits malformed or restricted media", (value) =>
    expect(normalizeVideo(value)).toBeNull(),
  );
  it("uses regional popular pagination and public API key", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [fixtureVideo()],
            nextPageToken: "next-page",
          }),
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    const page = await new YouTubeApi("public-key").popular(
      "VN",
      "previous-page",
    );
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get("chart")).toBe("mostPopular");
    expect(url.searchParams.get("regionCode")).toBe("VN");
    expect(url.searchParams.get("pageToken")).toBe("previous-page");
    expect(url.searchParams.get("key")).toBe("public-key");
    expect(page.nextPageToken).toBe("next-page");
    expect(page.videos).toHaveLength(1);
  });
  it("sends OAuth in a header and never puts the token in the URL", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ items: [] })));
    vi.stubGlobal("fetch", fetcher);
    await new YouTubeApi("public-key").subscriptions("private-token");
    const [url, options] = fetcher.mock.calls[0];
    expect(String(url)).not.toContain("private-token");
    expect(String(url)).not.toContain("public-key");
    expect(options.headers.Authorization).toBe("Bearer private-token");
  });
  it("batches up to 50 video IDs and avoids duplicate requests", async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ items: [] }))),
      );
    vi.stubGlobal("fetch", fetcher);
    await new YouTubeApi("key").videos([
      ...Array.from({ length: 51 }, (_, i) => String(i).padStart(11, "0")),
      "00000000000",
      "bad",
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(
      new URL(fetcher.mock.calls[0][0]).searchParams.get("id")?.split(","),
    ).toHaveLength(50);
  });
  it("limits preference discovery to two topics and requests embeddable videos", async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ items: [] }))),
      );
    vi.stubGlobal("fetch", fetcher);
    await new YouTubeApi("key").discover(
      ["Music", "Gaming", "Programming"],
      "VN",
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
    for (const [value] of fetcher.mock.calls)
      expect(new URL(value).searchParams.get("videoEmbeddable")).toBe("true");
  });
  it("rejects missing configuration without making a request", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(new YouTubeApi("").popular("VN")).rejects.toMatchObject({
      reason: "notConfigured",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    [403, "quotaExceeded"],
    [401, "authError"],
    [403, "insufficientPermissions"],
  ])("reports HTTP %s / %s", async (status, reason) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: { errors: [{ reason }] } }), {
            status,
          }),
        ),
    );
    await expect(new YouTubeApi("key").popular("VN")).rejects.toMatchObject({
      status,
      reason,
    });
  });
  it("reports malformed responses and network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json")));
    await expect(new YouTubeApi("key").popular("VN")).rejects.toBeInstanceOf(
      YouTubeApiError,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );
    await expect(new YouTubeApi("key").popular("VN")).rejects.toMatchObject({
      reason: "network",
    });
  });
  it("uses uploads playlists and tolerates one unavailable channel", async () => {
    const fetcher = vi.fn().mockImplementation((input: URL) => {
      const url = new URL(input);
      if (url.pathname.endsWith("/channels"))
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  contentDetails: {
                    relatedPlaylists: { uploads: "uploads-one" },
                  },
                },
                {
                  contentDetails: {
                    relatedPlaylists: { uploads: "uploads-two" },
                  },
                },
              ],
            }),
          ),
        );
      if (url.pathname.endsWith("/playlistItems"))
        return Promise.resolve(
          url.searchParams.get("playlistId") === "uploads-one"
            ? new Response(
                JSON.stringify({
                  items: [{ contentDetails: { videoId: "abcdefghijk" } }],
                }),
              )
            : new Response(
                JSON.stringify({
                  error: { errors: [{ reason: "playlistNotFound" }] },
                }),
                { status: 404 },
              ),
        );
      return Promise.resolve(
        new Response(JSON.stringify({ items: [fixtureVideo()] })),
      );
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await new YouTubeApi("").subscriptionVideos(
      [
        { id: "UCabcdefghijklmnopqrstuv", name: "One" },
        { id: "UCabcdefghijklmnopqrstuw", name: "Two" },
      ],
      "token",
    );
    expect(result.failedChannels).toBe(1);
    expect(result.videos).toHaveLength(1);
  });
});
