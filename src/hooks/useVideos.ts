import { mockVideos } from "../data/mockVideos";
import { useAppStore } from "../store/useAppStore";
import { useEffect, useMemo } from "react";
import { useYouTubeStore } from "../store/useYouTubeStore";
import { useAuthStore } from "../store/useAuthStore";

export function useVideos() {
  const imported = useAppStore((state) => state.importedVideos);
  const catalog = useYouTubeStore((state) => state.catalog);
  const history = useAppStore((state) => state.history);
  const liked = useAppStore((state) => state.liked);
  const watchLater = useAppStore((state) => state.watchLater);
  const playlists = useAppStore((state) => state.playlists);
  const token = useAuthStore((state) => state.accessToken);
  useEffect(() => {
    const local = new Set(
      [...mockVideos, ...imported].map((video) => video.id),
    );
    const ids = [
      ...history,
      ...liked,
      ...watchLater,
      ...playlists.flatMap((list) => list.videoIds),
    ].filter((id) => !local.has(id));
    void useYouTubeStore.getState().ensureVideos(ids);
  }, [imported, history, liked, watchLater, playlists, token]);
  return useMemo(() => {
    const combined = new Map(
      [
        ...mockVideos,
        ...Object.values(catalog).map((entry) => entry.video),
        ...imported,
      ].map((video) => [video.id, video]),
    );
    return [
      ...imported,
      ...[...combined.values()].filter(
        (video) => !imported.some((item) => item.id === video.id),
      ),
    ];
  }, [imported, catalog]);
}
