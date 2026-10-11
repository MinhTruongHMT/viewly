import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useVideos } from "../hooks/useVideos";
import { VideoGrid, VideoGridSkeleton } from "../components/video/VideoGrid";
import { FeedStatus } from "../components/google/FeedStatus";
import { googleConfig } from "../services/googleConfig";
import { useAuthStore } from "../store/useAuthStore";
import { useYouTubeStore } from "../store/useYouTubeStore";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = (params.get("search_query") ?? "").trim();
  const videos = useVideos();
  const token = useAuthStore((state) => state.accessToken);
  const available = !!googleConfig.apiKey || !!token;
  const source =
    params.get("source") === "library" || (!params.has("source") && !available)
      ? "library"
      : "youtube";
  const feed = useYouTubeStore((state) => state.search);
  const searchQuery = useYouTubeStore((state) => state.searchQuery);
  const loadSearch = useYouTubeStore((state) => state.loadSearch);
  const clearSearch = useYouTubeStore((state) => state.clearSearch);
  useEffect(() => {
    // Defer until the effect settles so StrictMode's setup/cleanup does not send duplicate searches.
    const timer = setTimeout(() => {
      if (source === "youtube" && available && query) void loadSearch(query);
    }, 0);
    return () => {
      clearTimeout(timer);
      clearSearch();
    };
  }, [query, source, available, token, loadSearch, clearSearch]);
  const filtered = query
    ? source === "youtube"
      ? searchQuery === query
        ? feed.videos
        : []
      : videos.filter((video) =>
          `${video.title} ${video.channel} ${video.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
    : [];
  const loading = !!query && source === "youtube" && available &&
    (searchQuery !== query || feed.status === "idle" || feed.status === "loading");
  const chooseSource = (value: string) => {
    const next = new URLSearchParams(params);
    next.set("source", value);
    setParams(next);
  };
  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Search size={14} /> THE SEARCH IS PART OF THE FUN
          </div>
          <h1>
            {query ? `Results for “${query}”` : "Find your next favorite"}
          </h1>
          <p role="status">
            {loading
              ? "Đang tìm video trên YouTube…"
              : query
              ? source === "youtube"
                ? `${filtered.length} video từ YouTube`
                : `${filtered.length} video${filtered.length === 1 ? "" : "s"} found in your library`
              : "Search titles, creators, or categories using the search bar."}
          </p>
        </div>
        {query && (
          <button
            className="button"
            onClick={() => {
              const next = new URLSearchParams(params);
              next.delete("search_query");
              setParams(next);
            }}
          >
            <X size={16} />
            Clear search
          </button>
        )}
      </div>
      <div className="source-toolbar">
        <div className="source-options" role="group" aria-label="Nguồn tìm kiếm">
          {([
            ["youtube", "YouTube"],
            ["library", "Trong thư viện"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              className={`source-button ${source === value ? "active" : ""}`}
              aria-pressed={source === value}
              onClick={() => chooseSource(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {source === "library" && !available && (
        <p className="demo-note">
          Đang tìm trong thư viện. Để tìm video trên YouTube,{" "}
          <Link to="/settings">kết nối Google hoặc cấu hình YouTube API key</Link>.
        </p>
      )}
      {query && source === "youtube" && !available ? (
        <FeedStatus error="Kết nối Google hoặc cấu hình YouTube API key để tìm video trên YouTube." />
      ) : (
        <>
          {query && source === "youtube" && searchQuery === query && feed.error && (
            <FeedStatus
              error={feed.error}
              retry={() => void loadSearch(query, true, !!feed.nextPageToken)}
            />
          )}
          {loading ? (
            <VideoGridSkeleton />
          ) : (
            (!query || source === "library" ||
              (searchQuery === query && (!feed.error || filtered.length > 0))) && (
              <VideoGrid
                videos={filtered}
                emptyTitle={query ? "No finds this time" : "A good discovery starts with a search"}
                emptyDescription={query
                  ? source === "youtube"
                    ? "YouTube không có video phù hợp cho phép nhúng. Thử từ khóa khác."
                    : "Try a different title, creator, or category. You can also import a YouTube video."
                  : "Try “music”, “React”, or a favorite creator."}
              />
            )
          )}
          {query && source === "youtube" && searchQuery === query && feed.nextPageToken && (
            <div className="load-more">
              <button
                className="button"
                disabled={feed.loadingMore}
                onClick={() => void loadSearch(query, false, true)}
              >
                {feed.loadingMore ? "Đang tải…" : "Tải thêm kết quả"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
