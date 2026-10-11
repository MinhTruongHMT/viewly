import { useEffect, useState, type FormEvent } from "react";
import { useYouTubeStore } from "../store/useYouTubeStore";
import { useAuthStore } from "../store/useAuthStore";
import { googleConfig } from "../services/googleConfig";
import { VideoGridSkeleton } from "../components/video/VideoGrid";
import { FeedStatus } from "../components/google/FeedStatus";
import { useSearchParams, Link } from "react-router-dom";
import { ExternalLink, ThumbsUp, CheckCircle2 } from "lucide-react";
import { useVideos } from "../hooks/useVideos";
import { useAppStore } from "../store/useAppStore";
import { VideoPlayer } from "../components/video/VideoPlayer";
import { VideoActions } from "../components/video/VideoActions";
import { VideoCard } from "../components/video/VideoCard";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { mockComments } from "../data/mockVideos";
import { formatViews, publishedTime, youtubeWatchUrl } from "../utils/youtube";
import type { Comment, Video } from "../types";

function WatchContent({ video, related }: { video: Video; related: Video[] }) {
  const subscribed = useAppStore((state) =>
    state.subscriptions.includes(video.channel),
  );
  const toggleSubscription = useAppStore((state) => state.toggleSubscription);
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [commentLikes, setCommentLikes] = useState<string[]>([]);
  const addComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = String(
      new FormData(event.currentTarget).get("comment") ?? "",
    ).trim();
    if (!text) return;
    setComments((current) => [
      {
        id: crypto.randomUUID(),
        author: "Jamie (you)",
        text,
        time: "Just now",
        likes: 0,
      },
      ...current,
    ]);
    event.currentTarget.reset();
  };
  return (
    <div className="watch-layout">
      <div className="watch-main">
        <VideoPlayer id={video.id} title={video.title} />
        <h1 className="watch-title">{video.title}</h1>
        <div className="watch-toolbar">
          <div className="watch-channel">
            <Avatar name={video.channel} color={video.avatarColor} />
            <div>
              <strong>
                {video.channel}{" "}
                {!video.imported && video.source !== "youtube" && (
                  <CheckCircle2 size={13} />
                )}
              </strong>
              <span>Creator on YouTube</span>
            </div>
            <button
              className={`button ${subscribed ? "subscribed" : "primary"}`}
              aria-pressed={subscribed}
              onClick={() => toggleSubscription(video.channel)}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>
          <VideoActions video={video} />
        </div>
        <div className="description-box">
          <strong>
            {formatViews(video.views)} views ·{" "}
            {publishedTime(video.publishedAt)}
          </strong>
          <p className={expanded ? "" : "description-truncated"}>
            {video.description}
          </p>
          <button
            className="text-button"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
          <a
            className="external-video-link"
            target="_blank"
            rel="noreferrer"
            href={youtubeWatchUrl(video.id)}
          >
            <ExternalLink size={14} />
            Watch on YouTube
          </a>
        </div>
        <p className="demo-note watch-demo-note">
          Likes, subscriptions, and saves are local demo actions. History
          records videos when playback starts.
        </p>
        <section className="comments-section">
          <h2>
            {comments.length} comments <span className="tiny-tag">DEMO</span>
          </h2>
          <form className="comment-form" onSubmit={addComment}>
            <Avatar name="Jamie" color="#ba775b" />
            <label className="sr-only" htmlFor="comment">
              Add a comment
            </label>
            <input
              id="comment"
              name="comment"
              placeholder="Add to the conversation…"
              maxLength={1000}
              required
            />
            <button className="button" type="submit">
              Comment
            </button>
          </form>
          <p className="field-help">
            Comments are a session-only demo and reset when you leave this
            video.
          </p>
          {comments.map((comment) => (
            <article className="comment" key={comment.id}>
              <Avatar name={comment.author} small color="#7e8c7b" />
              <div>
                <strong>{comment.author}</strong>
                <span className="comment-time">{comment.time}</span>
                <p>{comment.text}</p>
                <button
                  className="comment-like"
                  aria-label={`Like comment by ${comment.author}`}
                  aria-pressed={commentLikes.includes(comment.id)}
                  onClick={() =>
                    setCommentLikes((current) =>
                      current.includes(comment.id)
                        ? current.filter((id) => id !== comment.id)
                        : [...current, comment.id],
                    )
                  }
                >
                  <ThumbsUp size={14} />
                  {comment.likes + Number(commentLikes.includes(comment.id))}
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
      <aside className="related-videos" aria-label="Related videos">
        <div className="related-heading">
          <h2>Keep exploring</h2>
          <Link to="/">See all</Link>
        </div>
        {related.map((item) => (
          <VideoCard key={item.id} video={item} compact />
        ))}
      </aside>
    </div>
  );
}
export default function WatchPage() {
  const [params] = useSearchParams();
  const videos = useVideos();
  const id = params.get("v") ?? "";
  const token = useAuthStore((state) => state.accessToken);
  const lookupError = useYouTubeStore((state) => state.lookupErrors[id]);
  const video = videos.find((item) => item.id === id);
  const canLoad = /^[\w-]{11}$/.test(id) && (!!googleConfig.apiKey || !!token);
  useEffect(() => {
    if (!video && canLoad) void useYouTubeStore.getState().ensureVideos([id]);
  }, [id, video, canLoad]);
  if (!video && canLoad)
    return lookupError ? (
      <FeedStatus
        error={lookupError}
        retry={() => void useYouTubeStore.getState().ensureVideos([id], true)}
      />
    ) : (
      <VideoGridSkeleton />
    );
  if (!video)
    return (
      <EmptyState
        title="We couldn’t find that video"
        description="Import the YouTube link first, or explore something from your home feed."
      />
    );
  const related = videos
    .filter((item) => item.id !== video.id)
    .sort(
      (a, b) =>
        Number(b.category === video.category) -
        Number(a.category === video.category),
    )
    .slice(0, 10);
  return <WatchContent key={video.id} video={video} related={related} />;
}
