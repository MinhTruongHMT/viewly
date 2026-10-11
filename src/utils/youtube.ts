const allowedHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);
const validId = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeId(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Paste a complete YouTube URL, including https://.");
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    !allowedHosts.has(url.hostname.toLowerCase()) ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("Please use a link from youtube.com or youtu.be.");
  }
  const segments = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (url.hostname.endsWith("youtu.be") && segments.length === 1)
    id = segments[0];
  else if (url.pathname === "/watch") id = url.searchParams.get("v");
  else if (
    segments.length === 2 &&
    ["shorts", "embed", "live"].includes(segments[0])
  )
    id = segments[1];
  if (!id || !validId.test(id))
    throw new Error(
      "This link does not contain a valid 11-character YouTube video ID.",
    );
  return id;
}

export const youtubeThumbnail = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeWatchUrl = (id: string) =>
  `https://www.youtube.com/watch?v=${id}`;
export function formatViews(views: number) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(views);
}
export function publishedTime(date: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 86400000),
  );
  if (!days) return "Today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
