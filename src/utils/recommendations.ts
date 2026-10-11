import type { Category, Video } from "../types";

export interface Preferences {
  liked: string[];
  history: string[];
  subscriptions: string[];
  interests: Category[];
}
export function preferredTopics(
  videos: Video[],
  preferences: Preferences,
): Category[] {
  const counts = new Map<Category, number>();
  for (const category of preferences.interests) counts.set(category, 20);
  for (const id of preferences.history.slice(0, 20)) {
    const video = videos.find((item) => item.id === id);
    if (video)
      counts.set(video.category, (counts.get(video.category) ?? 0) + 1);
  }
  for (const id of preferences.liked) {
    const video = videos.find((item) => item.id === id);
    if (video)
      counts.set(video.category, (counts.get(video.category) ?? 0) + 3);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
    .slice(0, 2);
}
export function recommendVideos(
  videos: Video[],
  preferences: Preferences,
  limit = 48,
): Video[] {
  const topics = preferredTopics(videos, preferences);
  const watched = new Set(preferences.history);
  const liked = new Set(preferences.liked);
  const likedChannels = new Set(
    videos
      .filter((video) => liked.has(video.id))
      .map((video) => video.channelId ?? video.channel),
  );
  // This ordering uses Viewly actions only; it does not reconstruct YouTube's recommendation feed.
  const ranked = [...new Map(videos.map((video) => [video.id, video])).values()]
    .map((video, index) => ({
      video,
      index,
      priority:
        (preferences.interests.includes(video.category)
          ? 8
          : topics.includes(video.category)
            ? 4
            : 0) +
        (preferences.subscriptions.includes(video.channel) ||
        likedChannels.has(video.channelId ?? video.channel)
          ? 3
          : 0) -
        (watched.has(video.id) ? 10 : 0) -
        (liked.has(video.id) ? 2 : 0),
    }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index);
  const selected: Video[] = [],
    deferred: Video[] = [];
  const channelCounts = new Map<string, number>();
  for (const { video } of ranked) {
    const channel = video.channelId ?? video.channel;
    const count = channelCounts.get(channel) ?? 0;
    if (count >= 2) deferred.push(video);
    else {
      selected.push(video);
      channelCounts.set(channel, count + 1);
    }
  }
  return [...selected, ...deferred].slice(0, limit);
}
