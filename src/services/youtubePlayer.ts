export interface YouTubePlayer {
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
}
interface PlayerOptions {
  events: {
    onReady: () => void;
    onError: (event: { data: number }) => void;
    onStateChange: (event: { data: number }) => void;
  };
}
interface YouTubeAPI {
  Player: new (
    element: HTMLIFrameElement,
    options: PlayerOptions,
  ) => YouTubePlayer;
}
declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}
let loading: Promise<YouTubeAPI> | null = null;
export function loadYouTubeAPI(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = setTimeout(() => {
      loading = null;
      reject(
        new Error(
          "YouTube did not respond. Check your connection or open the video on YouTube.",
        ),
      );
    }, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      clearTimeout(timeout);
      loading = null;
      script.remove();
      reject(
        new Error(
          "Could not connect to YouTube. Please check your network or content blocker.",
        ),
      );
    };
    document.head.appendChild(script);
  });
  return loading;
}
export function playerError(code: number) {
  if (code === 101 || code === 150)
    return "The creator has disabled embedded playback for this video.";
  if (code === 100)
    return "This video is unavailable, private, or has been removed.";
  if (code === 153)
    return "YouTube could not verify this player. Open the video on YouTube instead.";
  return "YouTube could not play this video in your browser.";
}
