import { useUIStore } from "../store/useUIStore";
import { youtubeWatchUrl } from "./youtube";

export async function shareVideo(id: string, title: string) {
  const url = youtubeWatchUrl(id);
  try {
    if (navigator.share) await navigator.share({ title, url });
    else {
      await navigator.clipboard.writeText(url);
      useUIStore.getState().notify("YouTube link copied to clipboard");
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    useUIStore
      .getState()
      .notify(
        "Could not copy the link. Use the “Watch on YouTube” link to share this video.",
      );
  }
}
