import type { Video } from "../../types";
import { VideoCard } from "./VideoCard";
import { EmptyState } from "../ui/EmptyState";

export function VideoGrid({
  videos,
  emptyTitle = "Nothing here just yet",
  emptyDescription = "Explore a few videos and make this space your own.",
}: {
  videos: Video[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return videos.length ? (
    <div className="video-grid">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  ) : (
    <EmptyState title={emptyTitle} description={emptyDescription} />
  );
}
export function VideoGridSkeleton() {
  return (
    <div
      className="video-grid skeleton-grid"
      aria-label="Loading videos"
      aria-busy="true"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index}>
          <div className="skeleton skeleton-thumbnail" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
