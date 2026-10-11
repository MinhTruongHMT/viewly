import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MoreVertical,
  Clock,
  ListPlus,
  Trash2,
  CheckCircle2,
  Radio,
} from "lucide-react";
import type { Video } from "../../types";
import { formatViews, publishedTime } from "../../utils/youtube";
import { Avatar } from "../ui/Avatar";
import { useAppStore } from "../../store/useAppStore";
import { useUIStore } from "../../store/useUIStore";

export function VideoCard({
  video,
  compact = false,
}: {
  video: Video;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [menu, setMenu] = useState(false);
  const saved = useAppStore((state) => state.watchLater.includes(video.id));
  const toggleWatchLater = useAppStore((state) => state.toggleWatchLater);
  const removeImport = useAppStore((state) => state.removeImport);
  const notify = useUIStore((state) => state.notify);
  const setPlaylistVideoId = useUIStore((state) => state.setPlaylistVideoId);
  const watchUrl = `/watch?v=${video.id}`;
  return (
    <article className={`video-card ${compact ? "compact" : ""}`}>
      <Link
        to={watchUrl}
        className="thumbnail-link"
        aria-label={`Watch ${video.title}`}
      >
        {failed ? (
          <div className="thumbnail-fallback">
            <span>{video.category}</span>
            <strong>{video.title}</strong>
          </div>
        ) : (
          <img
            className="video-thumbnail"
            src={video.thumbnail}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            onLoad={(event) => {
              if (event.currentTarget.naturalWidth <= 120) setFailed(true);
            }}
          />
        )}
        <span className="thumbnail-play">▶</span>
        {video.duration && (
          <span
            className={`duration ${video.duration === "LIVE" ? "live" : ""}`}
          >
            {video.duration === "LIVE" && <Radio size={11} />}
            {video.duration}
          </span>
        )}
        {video.imported && <span className="imported-badge">Your import</span>}
      </Link>
      <div className="video-info">
        <Avatar name={video.channel} color={video.avatarColor} />
        <div className="video-copy">
          <Link className="video-title" to={watchUrl}>
            {video.title}
          </Link>
          <p className="video-channel">
            {video.channel}
            {!video.imported && video.source !== "youtube" && (
              <CheckCircle2 size={12} />
            )}
          </p>
          <p className="video-meta">
            {formatViews(video.views)} views <span>·</span>{" "}
            {publishedTime(video.publishedAt)}
            {video.source === "youtube" && (
              <span className="real-data-label">YouTube</span>
            )}
          </p>
        </div>
        <div
          className="video-menu-wrap"
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenu(false);
          }}
        >
          <button
            className="icon-button video-menu-trigger"
            aria-label={`Options for ${video.title}`}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <MoreVertical size={18} />
          </button>
          {menu && (
            <>
              <button
                className="menu-dismiss"
                tabIndex={-1}
                aria-label="Close video options"
                onClick={() => setMenu(false)}
              />
              <div
                className="video-menu"
                onKeyDown={(event) => {
                  if (event.key === "Escape") setMenu(false);
                }}
              >
                <button
                  onClick={() => {
                    toggleWatchLater(video.id);
                    notify(
                      saved
                        ? "Removed from Watch later"
                        : "Saved to Watch later",
                    );
                    setMenu(false);
                  }}
                >
                  <Clock size={17} />
                  {saved ? "Remove from Watch later" : "Save to Watch later"}
                </button>
                <button
                  onClick={() => {
                    setPlaylistVideoId(video.id);
                    setMenu(false);
                  }}
                >
                  <ListPlus size={17} />
                  Add to playlist
                </button>
                {video.imported && (
                  <button
                    className="danger"
                    onClick={() => {
                      removeImport(video.id);
                      notify("Imported video removed");
                      setMenu(false);
                    }}
                  >
                    <Trash2 size={17} />
                    Remove import
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
