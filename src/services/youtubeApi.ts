import type { Category, Video } from "../types";
import { googleConfig } from "./googleConfig";
import { youtubeThumbnail } from "../utils/youtube";

export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly reason: string,
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}
export interface VideoPage {
  videos: Video[];
  nextPageToken?: string;
}
export interface SubscriptionChannel {
  id: string;
  name: string;
}
export interface SubscriptionPage {
  channels: SubscriptionChannel[];
  nextPageToken?: string;
}
const categoryMap: Record<string, Category> = {
  "10": "Music",
  "20": "Gaming",
  "27": "Education",
  "28": "Technology",
};
export const topicQueries: Partial<Record<Category, string>> = {
  Music: "music",
  Gaming: "gaming",
  Programming: "programming tutorial",
  Technology: "technology",
  Live: "live stream",
  Podcasts: "podcast",
  Education: "education learning",
  Other: "documentary",
};
const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const string = (value: unknown) => (typeof value === "string" ? value : "");
const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const nextToken = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;

export function formatDuration(value: string): string | undefined {
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return undefined;
  const total =
    Number(match[1] ?? 0) * 86400 +
    Number(match[2] ?? 0) * 3600 +
    Number(match[3] ?? 0) * 60 +
    Number(match[4] ?? 0);
  const hours = Math.floor(total / 3600),
    minutes = Math.floor((total % 3600) / 60),
    seconds = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}
export function normalizeVideo(value: unknown): Video | null {
  const item = object(value),
    snippet = object(item.snippet),
    status = object(item.status);
  const id = string(item.id),
    publishedAt = string(snippet.publishedAt),
    channelId = string(snippet.channelId);
  // Only publicly available videos are candidates or cached. Restricted embeds are omitted.
  if (
    !/^[\w-]{11}$/.test(id) ||
    !string(snippet.title) ||
    !channelId ||
    !Number.isFinite(Date.parse(publishedAt)) ||
    status.privacyStatus !== "public" ||
    status.embeddable === false
  )
    return null;
  const categoryId = string(snippet.categoryId);
  const tags = array(snippet.tags)
    .filter((tag): tag is string => typeof tag === "string")
    .slice(0, 30);
  const topicText = `${string(snippet.title)} ${tags.join(" ")}`;
  const category: Category =
    snippet.liveBroadcastContent === "live"
      ? "Live"
      : /\bpodcast\b/i.test(topicText)
        ? "Podcasts"
        : ["27", "28"].includes(categoryId) &&
            /\b(react|typescript|javascript|python|programming|coding|html|css|java|vue|angular|rust)\b|lập trình/i.test(
              topicText,
            )
          ? "Programming"
          : (categoryMap[categoryId] ?? "Other");
  const views = Number(object(item.statistics).viewCount ?? 0);
  return {
    id,
    title: string(snippet.title),
    channel: string(snippet.channelTitle) || "YouTube creator",
    channelId,
    categoryId,
    category,
    tags,
    source: "youtube",
    thumbnail: youtubeThumbnail(id),
    avatarColor: "#657f61",
    views: Number.isFinite(views) && views >= 0 ? views : 0,
    publishedAt,
    duration:
      snippet.liveBroadcastContent === "live"
        ? "LIVE"
        : formatDuration(string(object(item.contentDetails).duration)),
    description: string(snippet.description),
  };
}
export function apiError(status: number, reason: string): YouTubeApiError {
  if (status === 401 || reason === "authError")
    return new YouTubeApiError(
      "Phiên Google đã hết hạn. Hãy kết nối lại tài khoản.",
      401,
      reason,
    );
  if (
    ["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"].includes(
      reason,
    )
  )
    return new YouTubeApiError(
      "Đã hết hạn mức YouTube API. Thử lại sau hoặc chuyển sang dữ liệu demo.",
      status,
      reason,
    );
  if (
    [
      "keyInvalid",
      "API_KEY_INVALID",
      "accessNotConfigured",
      "ipRefererBlocked",
      "forbidden",
    ].includes(reason)
  )
    return new YouTubeApiError(
      "Không thể truy cập YouTube API. Kiểm tra API key, quyền truy cập và cấu hình Google Cloud.",
      status,
      reason,
    );
  if (reason === "insufficientPermissions")
    return new YouTubeApiError(
      "Tài khoản chưa cấp quyền đọc YouTube. Hãy kết nối lại và đồng ý quyền youtube.readonly.",
      status,
      reason,
    );
  return new YouTubeApiError(
    "YouTube chưa thể trả dữ liệu. Hãy thử lại sau.",
    status,
    reason,
  );
}

export class YouTubeApi {
  constructor(private readonly apiKey = googleConfig.apiKey) {}
  private async request(
    resource:
      | "videos"
      | "subscriptions"
      | "channels"
      | "playlistItems"
      | "search",
    parameters: Record<string, string>,
    token?: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    if (!token && !this.apiKey)
      throw new YouTubeApiError(
        "Chưa cấu hình YouTube API key. Mở Settings để xem hướng dẫn.",
        0,
        "notConfigured",
      );
    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
    for (const [name, value] of Object.entries(parameters))
      if (value) url.searchParams.set(name, value);
    if (!token) url.searchParams.set("key", this.apiKey);
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, 15000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      let payload: Record<string, unknown>;
      try {
        payload = object(await response.json());
      } catch {
        throw new YouTubeApiError(
          "YouTube trả về dữ liệu không hợp lệ. Hãy thử lại.",
          response.status,
          "invalidResponse",
        );
      }
      if (!response.ok) {
        const error = object(payload.error),
          first = object(array(error.errors)[0]);
        throw apiError(
          response.status,
          string(first.reason) || string(error.status),
        );
      }
      if (!Array.isArray(payload.items))
        throw new YouTubeApiError(
          "YouTube trả về dữ liệu không hợp lệ. Hãy thử lại.",
          response.status,
          "invalidResponse",
        );
      return payload;
    } catch (error) {
      if (error instanceof YouTubeApiError) throw error;
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      throw new YouTubeApiError(
        controller.signal.aborted
          ? "YouTube phản hồi quá chậm. Hãy thử lại."
          : "Không thể kết nối YouTube. Kiểm tra mạng hoặc trình chặn nội dung.",
        0,
        "network",
      );
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }
  async popular(
    region: string,
    pageToken = "",
    token?: string,
  ): Promise<VideoPage> {
    const payload = await this.request(
      "videos",
      {
        part: "snippet,contentDetails,statistics,status",
        chart: "mostPopular",
        regionCode: region,
        maxResults: "24",
        pageToken,
      },
      token,
    );
    return {
      videos: array(payload.items)
        .map(normalizeVideo)
        .filter((video): video is Video => video !== null),
      nextPageToken: nextToken(payload.nextPageToken),
    };
  }
  async videos(
    ids: string[],
    token?: string,
    signal?: AbortSignal,
  ): Promise<Video[]> {
    const unique = [...new Set(ids.filter((id) => /^[\w-]{11}$/.test(id)))];
    const result: Video[] = [];
    for (let offset = 0; offset < unique.length; offset += 50) {
      const payload = await this.request(
        "videos",
        {
          part: "snippet,contentDetails,statistics,status",
          id: unique.slice(offset, offset + 50).join(","),
        },
        token,
        signal,
      );
      result.push(
        ...array(payload.items)
          .map(normalizeVideo)
          .filter((video): video is Video => video !== null),
      );
    }
    return result;
  }
  async subscriptions(
    token: string,
    pageToken = "",
    signal?: AbortSignal,
  ): Promise<SubscriptionPage> {
    const payload = await this.request(
      "subscriptions",
      {
        part: "snippet",
        mine: "true",
        maxResults: "12",
        pageToken,
        order: "alphabetical",
      },
      token,
      signal,
    );
    const channels = array(payload.items)
      .map((value) => {
        const snippet = object(object(value).snippet);
        return {
          id: string(object(snippet.resourceId).channelId),
          name: string(snippet.title),
        };
      })
      .filter((channel) => /^UC[\w-]{22}$/.test(channel.id));
    return { channels, nextPageToken: nextToken(payload.nextPageToken) };
  }
  async subscriptionVideos(
    channels: SubscriptionChannel[],
    token: string,
    signal?: AbortSignal,
  ): Promise<{ videos: Video[]; failedChannels: number }> {
    if (!channels.length) return { videos: [], failedChannels: 0 };
    const payload = await this.request(
      "channels",
      {
        part: "contentDetails",
        id: channels.map((channel) => channel.id).join(","),
      },
      token,
      signal,
    );
    const playlists = array(payload.items)
      .map((value) =>
        string(
          object(object(object(value).contentDetails).relatedPlaylists).uploads,
        ),
      )
      .filter(Boolean);
    const ids: string[] = [];
    let failedChannels = channels.length - playlists.length;
    // Bounded concurrency: 12 channels per page, four recent uploads per channel.
    for (let offset = 0; offset < playlists.length; offset += 3) {
      const results = await Promise.allSettled(
        playlists
          .slice(offset, offset + 3)
          .map((playlistId) =>
            this.request(
              "playlistItems",
              { part: "contentDetails", playlistId, maxResults: "4" },
              token,
              signal,
            ),
          ),
      );
      for (const result of results) {
        if (result.status === "fulfilled")
          ids.push(
            ...array(result.value.items)
              .map((value) =>
                string(object(object(value).contentDetails).videoId),
              )
              .filter(Boolean),
          );
        else if (
          result.reason instanceof YouTubeApiError &&
          (result.reason.status === 401 ||
            [
              "quotaExceeded",
              "dailyLimitExceeded",
              "insufficientPermissions",
            ].includes(result.reason.reason))
        )
          throw result.reason;
        else if (signal?.aborted)
          throw new DOMException("Cancelled", "AbortError");
        else failedChannels++;
      }
    }
    return {
      videos: (await this.videos(ids, token, signal)).sort(
        (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
      ),
      failedChannels,
    };
  }
  async search(
    query: string,
    region: string,
    pageToken = "",
    token?: string,
    signal?: AbortSignal,
  ): Promise<VideoPage> {
    if (!query.trim()) return { videos: [] };
    const payload = await this.request(
      "search",
      {
        part: "snippet",
        type: "video",
        q: query.trim(),
        videoEmbeddable: "true",
        videoSyndicated: "true",
        maxResults: "24",
        regionCode: region,
        relevanceLanguage: "vi",
        order: "relevance",
        pageToken,
      },
      token,
      signal,
    );
    const ids = [
      ...new Set(
        array(payload.items)
          .map((value) => string(object(object(value).id).videoId))
          .filter((id) => /^[\w-]{11}$/.test(id)),
      ),
    ];
    const videos = await this.videos(ids, token, signal);
    const byId = new Map(videos.map((video) => [video.id, video]));
    return {
      // videos.list does not guarantee the relevance order from search.list.
      videos: ids.flatMap((id) => byId.get(id) ?? []),
      nextPageToken: nextToken(payload.nextPageToken),
    };
  }
  async discover(
    topics: Category[],
    region: string,
    token?: string,
  ): Promise<Video[]> {
    const ids: string[] = [];
    // Search is expensive: at most two topic queries per explicit refresh, never per keystroke.
    for (const topic of [...new Set(topics)].slice(0, 2)) {
      const payload = await this.request(
        "search",
        {
          part: "snippet",
          type: "video",
          q: topicQueries[topic] ?? topic,
          videoEmbeddable: "true",
          videoSyndicated: "true",
          maxResults: "20",
          regionCode: region,
          relevanceLanguage: "vi",
          order: "relevance",
        },
        token,
      );
      ids.push(
        ...array(payload.items)
          .map((value) => string(object(object(value).id).videoId))
          .filter(Boolean),
      );
    }
    return this.videos(ids, token);
  }
}
export const youtubeApi = new YouTubeApi();
