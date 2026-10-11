import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useYouTubeStore } from "../store/useYouTubeStore";
import { googleConfig } from "../services/googleConfig";
import { GoogleConnection } from "../components/google/GoogleConnection";
import { FeedStatus } from "../components/google/FeedStatus";
import { VideoGrid, VideoGridSkeleton } from "../components/video/VideoGrid";
import LibraryPage from "./LibraryPage";

export default function SubscriptionsPage() {
  const [params] = useSearchParams();
  const [source, setSource] = useState<"local" | "youtube">(
    params.get("channel") || !googleConfig.clientId ? "local" : "youtube",
  );
  const [selectedChannel, setSelectedChannel] = useState("");
  const token = useAuthStore((state) => state.accessToken);
  const feed = useYouTubeStore((state) => state.subscribed);
  const channels = useYouTubeStore((state) => state.channels);
  const failedChannels = useYouTubeStore((state) => state.failedChannels);
  const load = useYouTubeStore((state) => state.loadSubscriptions);
  useEffect(() => {
    if (source === "youtube" && token) void load(token);
  }, [source, token, load]);
  const effectiveChannel = channels.some(
    (channel) => channel.id === selectedChannel,
  )
    ? selectedChannel
    : "";
  const filtered = feed.videos.filter(
    (video) => !effectiveChannel || video.channelId === effectiveChannel,
  );
  return (
    <div>
      <div className="source-toolbar">
        <div
          className="source-options"
          role="group"
          aria-label="Nguồn kênh đăng ký"
        >
          <button
            className={`source-button ${source === "youtube" ? "active" : ""}`}
            aria-pressed={source === "youtube"}
            onClick={() => setSource("youtube")}
          >
            Từ tài khoản YouTube
          </button>
          <button
            className={`source-button ${source === "local" ? "active" : ""}`}
            aria-pressed={source === "local"}
            onClick={() => setSource("local")}
          >
            Theo dõi trong Viewly
          </button>
        </div>
      </div>
      {source === "local" ? (
        <LibraryPage kind="subscriptions" />
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <Users size={14} /> YOUR YOUTUBE CREATORS
              </div>
              <h1>Video từ kênh đã đăng ký</h1>
              <p>
                Video công khai mới nhất từ các kênh bạn đăng ký trên YouTube.
              </p>
            </div>
            {token && (
              <button
                className="button"
                disabled={feed.status === "loading" || feed.loadingMore}
                onClick={() => void load(token, true)}
              >
                <RefreshCw size={16} />
                Làm mới danh sách
              </button>
            )}
          </div>
          {!token ? (
            <GoogleConnection />
          ) : (
            <>
              <p className="library-note">
                Đã tải {channels.length} kênh · Tối đa 4 video mới nhất mỗi kênh
                · Chỉ đọc, không thay đổi tài khoản.
              </p>
              {channels.length > 0 && (
                <label className="channel-filter">
                  Lọc theo kênh
                  <select
                    value={effectiveChannel}
                    onChange={(event) => setSelectedChannel(event.target.value)}
                  >
                    <option value="">Tất cả kênh đã tải</option>
                    {channels.map((channel) => (
                      <option value={channel.id} key={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {feed.error && (
                <FeedStatus
                  error={feed.error}
                  retry={() => void load(token, true)}
                />
              )}
              {failedChannels > 0 && (
                <p className="demo-note">
                  Có {failedChannels} kênh chưa tải được video. Các kênh còn lại
                  vẫn được hiển thị; hãy làm mới để thử lại.
                </p>
              )}
              {feed.status === "loading" && !feed.videos.length ? (
                <VideoGridSkeleton />
              ) : (
                <VideoGrid
                  videos={filtered}
                  emptyTitle="Chưa có video trong danh sách này"
                  emptyDescription="Tài khoản có thể chưa đăng ký kênh, các kênh không có video công khai cho phép nhúng, hoặc bạn chưa tải thêm các kênh còn lại."
                />
              )}
              {feed.nextPageToken && (
                <div className="load-more">
                  <button
                    className="button"
                    disabled={feed.loadingMore}
                    onClick={() => void load(token, false, true)}
                  >
                    {feed.loadingMore
                      ? "Đang tải…"
                      : "Tải thêm kênh đã đăng ký"}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
