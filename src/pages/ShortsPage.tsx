import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ThumbsUp,
  MessageCircle,
  Share2,
  ExternalLink,
} from "lucide-react";
import { mockShorts, mockComments } from "../data/mockVideos";
import { VideoPlayer } from "../components/video/VideoPlayer";
import { Modal } from "../components/ui/Modal";
import { Avatar } from "../components/ui/Avatar";
import { useAppStore } from "../store/useAppStore";
import { shareVideo } from "../utils/share";
import { youtubeWatchUrl } from "../utils/youtube";

export default function ShortsPage() {
  const [index, setIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const video = mockShorts[index];
  const liked = useAppStore((state) => state.liked.includes(video.id));
  const subscribed = useAppStore((state) =>
    state.subscriptions.includes(video.channel),
  );
  const toggleLike = useAppStore((state) => state.toggleLike);
  const toggleSubscription = useAppStore((state) => state.toggleSubscription);
  return (
    <div className="shorts-page">
      <div className="shorts-top">
        <h1>Small watch. Big discovery.</h1>
        <p>
          Shorts · {index + 1} of {mockShorts.length} · Local demo
        </p>
      </div>
      <div className="shorts-stage">
        <div className="short-video">
          <VideoPlayer
            key={video.id}
            id={video.id}
            title={video.title}
            vertical
          />
          <div className="short-caption">
            <h2>{video.title}</h2>
            <div>
              <Avatar name={video.channel} color={video.avatarColor} small />
              <strong>{video.channel}</strong>
              <button
                className="button"
                aria-pressed={subscribed}
                onClick={() => toggleSubscription(video.channel)}
              >
                {subscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>
          </div>
        </div>
        <div className="short-actions">
          <button
            aria-label={liked ? "Unlike short" : "Like short"}
            aria-pressed={liked}
            onClick={() => toggleLike(video.id)}
          >
            <ThumbsUp size={24} />
            <span>{liked ? "Liked" : "Like"}</span>
          </button>
          <button
            aria-label="Show short comments"
            onClick={() => setCommentsOpen(true)}
          >
            <MessageCircle size={24} />
            <span>Comments</span>
          </button>
          <button
            aria-label="Share short"
            onClick={() => void shareVideo(video.id, video.title)}
          >
            <Share2 size={24} />
            <span>Share</span>
          </button>
          <a
            href={youtubeWatchUrl(video.id)}
            target="_blank"
            rel="noreferrer"
            aria-label="Watch short on YouTube"
          >
            <ExternalLink size={23} />
            <span>YouTube</span>
          </a>
        </div>
        <div className="short-navigation">
          <button
            className="icon-button"
            aria-label="Previous short"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            <ChevronUp size={24} />
          </button>
          <button
            className="icon-button"
            aria-label="Next short"
            disabled={index === mockShorts.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            <ChevronDown size={24} />
          </button>
        </div>
      </div>
      <Modal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        title="Short conversations"
      >
        <p className="demo-note">Mock comments for this demo.</p>
        {mockComments.map((comment) => (
          <div className="comment" key={comment.id}>
            <Avatar name={comment.author} small />
            <div>
              <strong>{comment.author}</strong>
              <p>{comment.text}</p>
            </div>
          </div>
        ))}
      </Modal>
    </div>
  );
}
