import { useSearchParams } from "react-router-dom";
import {
  Clock,
  History,
  ThumbsUp,
  Users,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useVideos } from "../hooks/useVideos";
import { useAppStore } from "../store/useAppStore";
import { useUIStore } from "../store/useUIStore";
import { VideoGrid } from "../components/video/VideoGrid";

const configuration: Record<
  string,
  { title: string; description: string; icon: LucideIcon }
> = {
  history: {
    title: "Your watch history",
    description:
      "The rabbit holes you’ve wandered down. History updates when playback starts.",
    icon: History,
  },
  later: {
    title: "Good things can wait",
    description: "Your saved videos, ready whenever you are.",
    icon: Clock,
  },
  liked: {
    title: "A collection of favorites",
    description: "The videos you gave a little love.",
    icon: ThumbsUp,
  },
  subscriptions: {
    title: "Your favorite creators",
    description: "Keep up with the channels that keep you curious.",
    icon: Users,
  },
};
export default function LibraryPage({
  kind,
}: {
  kind: "history" | "later" | "liked" | "subscriptions";
}) {
  const videos = useVideos();
  const history = useAppStore((state) => state.history);
  const liked = useAppStore((state) => state.liked);
  const later = useAppStore((state) => state.watchLater);
  const subscriptions = useAppStore((state) => state.subscriptions);
  const clearHistory = useAppStore((state) => state.clearHistory);
  const notify = useUIStore((state) => state.notify);
  const [params] = useSearchParams();
  const channel = params.get("channel");
  const config = configuration[kind];
  const Icon = config.icon;
  const ids = kind === "history" ? history : kind === "liked" ? liked : later;
  const filtered =
    kind === "subscriptions"
      ? videos.filter(
          (video) =>
            subscriptions.includes(video.channel) &&
            (!channel || video.channel === channel),
        )
      : ids
          .map((id) => videos.find((video) => video.id === id))
          .filter((video) => video !== undefined);
  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Icon size={14} /> YOUR LITTLE CORNER
          </div>
          <h1>
            {kind === "subscriptions" && channel ? channel : config.title}
          </h1>
          <p>{config.description}</p>
        </div>
        {kind === "history" && history.length > 0 && (
          <button
            className="button"
            onClick={() => {
              clearHistory();
              notify("Watch history cleared");
            }}
          >
            <Trash2 size={16} />
            Clear history
          </button>
        )}
      </div>
      <div className="library-note">
        Saved locally in this browser · {filtered.length} video
        {filtered.length === 1 ? "" : "s"}
      </div>
      <VideoGrid
        videos={filtered}
        emptyTitle={
          kind === "subscriptions"
            ? "Find your people"
            : "Your collection starts here"
        }
        emptyDescription={
          kind === "history"
            ? "Play a video and it will appear here."
            : kind === "subscriptions"
              ? "Subscribe to a channel on a watch page to see its videos here."
              : kind === "liked"
                ? "Like a video on its watch page to add it to your favorites."
                : "Use a video’s options menu or Watch later button to save it here."
        }
      />
    </div>
  );
}
