import { useEffect, useRef, useState } from "react";
import { ExternalLink, AlertCircle } from "lucide-react";
import {
  loadYouTubeAPI,
  playerError,
  type YouTubePlayer,
} from "../../services/youtubePlayer";
import { youtubeWatchUrl } from "../../utils/youtube";
import { useAppStore } from "../../store/useAppStore";

export function VideoPlayer({
  id,
  title,
  vertical = false,
}: {
  id: string;
  title: string;
  vertical?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const recordWatch = useAppStore((state) => state.recordWatch);
  useEffect(() => {
    let disposed = false;
    let player: YouTubePlayer | undefined;
    const iframe = document.createElement("iframe");
    const params = new URLSearchParams({
      enablejsapi: "1",
      origin: window.location.origin,
      playsinline: "1",
      rel: "0",
    });
    iframe.src = `https://www.youtube.com/embed/${id}?${params}`;
    iframe.title = title;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    host.current?.appendChild(iframe);
    const timer = setTimeout(() => {
      if (!disposed)
        setError(
          "YouTube is taking longer than expected. Check your connection or watch on YouTube.",
        );
    }, 20000);
    loadYouTubeAPI()
      .then((api) => {
        if (disposed) return;
        player = new api.Player(iframe, {
          events: {
            onReady: () => {
              clearTimeout(timer);
              if (!disposed) setError(null);
            },
            onError: (event) => {
              clearTimeout(timer);
              if (!disposed) setError(playerError(event.data));
            },
            onStateChange: (event) => {
              if (!disposed && event.data === 1) recordWatch(id);
            },
          },
        });
      })
      .catch((reason: unknown) => {
        clearTimeout(timer);
        if (!disposed)
          setError(
            reason instanceof Error
              ? reason.message
              : "YouTube could not load.",
          );
      });
    return () => {
      disposed = true;
      clearTimeout(timer);
      player?.destroy();
      iframe.remove();
    };
  }, [id, title, recordWatch]);
  return (
    <div className={`player-wrapper ${vertical ? "vertical-player" : ""}`}>
      <div className="player-host" ref={host} />
      {error && (
        <div className="player-error" role="alert">
          <AlertCircle size={30} />
          <strong>Let’s take this to YouTube</strong>
          <p>{error}</p>
          <a
            className="button primary"
            href={youtubeWatchUrl(id)}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={17} />
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}
