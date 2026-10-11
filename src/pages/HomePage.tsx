import { useEffect, useState } from "react";
import { Sparkles, ArrowUpRight, Plus, Compass, RefreshCw } from "lucide-react";
import { categories } from "../types";
import { useVideos } from "../hooks/useVideos";
import { VideoGrid, VideoGridSkeleton } from "../components/video/VideoGrid";
import { useUIStore } from "../store/useUIStore";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import { useYouTubeStore } from "../store/useYouTubeStore";
import { mockVideos } from "../data/mockVideos";
import { googleConfig } from "../services/googleConfig";
import { preferredTopics, recommendVideos } from "../utils/recommendations";
import { InterestPicker } from "../components/google/InterestPicker";
import { FeedStatus } from "../components/google/FeedStatus";
import { useShallow } from "zustand/react/shallow";

export default function HomePage({ explore = false }: { explore?: boolean }) {
  const videos = useVideos();
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const setImportOpen = useUIStore((state) => state.setImportOpen);
  const source = useAppStore((state) => state.feedSource);
  const setSource = useAppStore((state) => state.setFeedSource);
  const imported = useAppStore((state) => state.importedVideos);
  const preferences = useAppStore(
    useShallow((state) => ({
      liked: state.liked,
      history: state.history,
      subscriptions: state.subscriptions,
      interests: state.interests,
    })),
  );
  const token = useAuthStore((state) => state.accessToken);
  const popular = useYouTubeStore((state) => state.popular);
  const personal = useYouTubeStore((state) => state.personal);
  const loadPopular = useYouTubeStore((state) => state.loadPopular);
  const loadPersonal = useYouTubeStore((state) => state.loadPersonal);
  const available = !!googleConfig.apiKey || !!token;
  useEffect(() => {
    if (source !== "demo" && available) void loadPopular();
  }, [source, available, loadPopular]);
  const demo = [
    ...imported,
    ...mockVideos.filter(
      (video) => !imported.some((item) => item.id === video.id),
    ),
  ];
  const candidates =
    source === "demo"
      ? demo
      : source === "popular"
        ? [
            ...imported,
            ...popular.videos.filter(
              (video) => !imported.some((item) => item.id === video.id),
            ),
          ]
        : recommendVideos(
            [
              ...imported,
              ...personal.videos,
              ...popular.videos,
              ...videos.filter((video) => video.source === "youtube"),
              ...(!available ? mockVideos : []),
            ],
            preferences,
          );
  const topics = preferredTopics(videos, preferences);
  const filtered = candidates.filter(
    (video) => category === "All" || video.category === category,
  );
  return (
    <div className="home-page">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> A LITTLE CURIOSITY GOES A LONG WAY
          </div>
          <h1>
            {explore
              ? "Go beyond your usual."
              : "What will you discover today?"}
          </h1>
          <p>
            {explore
              ? "New interests. Different perspectives. Your next favorite thing."
              : "Fresh perspectives, familiar favorites, and a few happy accidents."}
          </p>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-card card-one">
            <span>✦</span>
            <span>STAY CURIOUS</span>
          </div>
          <div className="art-card card-two">
            <div className="art-play">▶</div>
            <span>One more good find.</span>
          </div>
          <span className="art-spark spark-one">✦</span>
          <span className="art-spark spark-two">✧</span>
        </div>
      </section>
      <div className="source-toolbar">
        <div className="source-options" role="group" aria-label="Nguồn video">
          {(
            [
              ["popular", "Phổ biến trên YouTube"],
              ["personal", "Dành cho bạn"],
              ["demo", "Thư viện demo"],
            ] as const
          ).map(([value, label]) => (
            <button
              className={`source-button ${source === value ? "active" : ""}`}
              key={value}
              aria-pressed={source === value}
              onClick={() => setSource(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {source === "popular" && available && (
          <button
            className="button"
            disabled={popular.status === "loading" || popular.loadingMore}
            onClick={() => void loadPopular(true)}
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
        )}
      </div>
      {source === "personal" && (
        <>
          <InterestPicker />
          <p className="demo-note recommendation-note">
            Gợi ý dựa trên sở thích, lượt thích và lịch sử trong Viewly. Đây
            không phải danh sách đề xuất của tài khoản YouTube.
          </p>
          {available && (
            <button
              className="button discovery-button"
              disabled={!topics.length || personal.status === "loading"}
              onClick={() => void loadPersonal(topics, true)}
            >
              <Sparkles size={16} />
              {personal.status === "loading"
                ? "Đang tìm video…"
                : "Tìm video theo sở thích"}
            </button>
          )}
        </>
      )}
      {source !== "demo" && !available && (
        <FeedStatus error="Chưa kết nối nguồn dữ liệu YouTube. Cấu hình API key hoặc kết nối Google trong Settings; thư viện demo vẫn hoạt động." />
      )}
      {source !== "demo" && popular.error && (
        <FeedStatus
          error={popular.error}
          retry={() => void loadPopular(true)}
        />
      )}
      {source === "personal" && personal.error && (
        <FeedStatus
          error={personal.error}
          retry={() => void loadPersonal(topics, true)}
        />
      )}
      <div
        className="category-bar"
        role="group"
        aria-label="Filter videos by category"
      >
        {categories.map((item) => (
          <button
            className={`category-chip ${category === item ? "active" : ""}`}
            key={item}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item === "All" && <Compass size={15} />}
            {item}
          </button>
        ))}
      </div>
      <div className="feed-heading">
        <div>
          <h2>
            {category === "All"
              ? explore
                ? "Worth exploring"
                : source === "popular"
                  ? `Phổ biến tại ${googleConfig.region}`
                  : source === "personal"
                    ? "Gợi ý dành cho bạn"
                    : "Picked for your curiosity"
              : `${category} for your curiosity`}
          </h2>
          <p>
            {category === "All"
              ? source === "popular"
                ? "Dữ liệu thật từ YouTube · Video công khai cho phép nhúng"
                : source === "personal"
                  ? "Khám phá chủ đề và những người sáng tạo phù hợp với bạn."
                  : "A little bit of everything. A whole lot to explore."
              : `Find your next favorite in ${category.toLowerCase()}.`}
          </p>
        </div>
        <span className="feed-count">
          {filtered.length} videos <ArrowUpRight size={16} />
        </span>
      </div>
      {source !== "demo" &&
      popular.status === "loading" &&
      !candidates.length ? (
        <VideoGridSkeleton />
      ) : (
        <VideoGrid
          videos={filtered}
          emptyTitle={
            source === "demo"
              ? "Nothing here just yet"
              : "Chưa có video phù hợp"
          }
          emptyDescription={
            source === "personal"
              ? "Chọn sở thích và bấm Tìm video theo sở thích, hoặc xem và thích một vài video để Viewly hiểu bạn hơn."
              : "Thử danh mục khác, kết nối nguồn YouTube hoặc chuyển sang thư viện demo."
          }
        />
      )}
      {source === "popular" && popular.nextPageToken && (
        <div className="load-more">
          <button
            className="button"
            disabled={popular.loadingMore}
            onClick={() => void loadPopular(false, true)}
          >
            {popular.loadingMore ? "Đang tải…" : "Tải thêm video"}
          </button>
        </div>
      )}
      <div className="feed-end">
        <span>There’s always room for one more good find.</span>
        <button className="button" onClick={() => setImportOpen(true)}>
          <Plus size={16} />
          Import a video
        </button>
      </div>
    </div>
  );
}
