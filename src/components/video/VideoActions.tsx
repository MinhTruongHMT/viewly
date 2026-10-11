import { ThumbsUp, Share2, Clock, ListPlus } from "lucide-react";
import type { Video } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { useUIStore } from "../../store/useUIStore";
import { shareVideo } from "../../utils/share";

export function VideoActions({ video }: { video: Video }) {
  const liked = useAppStore((state) => state.liked.includes(video.id));
  const saved = useAppStore((state) => state.watchLater.includes(video.id));
  const toggleLike = useAppStore((state) => state.toggleLike);
  const toggleSaved = useAppStore((state) => state.toggleWatchLater);
  const setPlaylistVideoId = useUIStore((state) => state.setPlaylistVideoId);
  return (
    <div className="video-actions">
      <button
        className={`button pill ${liked ? "selected" : ""}`}
        aria-pressed={liked}
        onClick={() => toggleLike(video.id)}
      >
        <ThumbsUp size={18} />
        {liked ? "Liked" : "Like"}
      </button>
      <button
        className="button pill"
        onClick={() => void shareVideo(video.id, video.title)}
      >
        <Share2 size={18} />
        Share
      </button>
      <button
        className={`button pill ${saved ? "selected" : ""}`}
        aria-pressed={saved}
        onClick={() => toggleSaved(video.id)}
      >
        <Clock size={18} />
        {saved ? "Saved" : "Watch later"}
      </button>
      <button
        className="button pill"
        onClick={() => setPlaylistVideoId(video.id)}
      >
        <ListPlus size={18} />
        Playlist
      </button>
    </div>
  );
}
