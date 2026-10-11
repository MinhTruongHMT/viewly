import { useState, type FormEvent } from "react";
import { Link2, Plus, ArrowUpRight } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useUIStore } from "../../store/useUIStore";
import { useAppStore } from "../../store/useAppStore";
import { extractYouTubeId, youtubeThumbnail } from "../../utils/youtube";
import { categories, type Category } from "../../types";
import { useVideos } from "../../hooks/useVideos";

function ImportForm({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const importVideo = useAppStore((state) => state.importVideo);
  const notify = useUIStore((state) => state.notify);
  const videos = useVideos();
  let preview: string | null = null;
  try {
    preview = extractYouTubeId(url);
  } catch {
    /* Preview only valid URLs. */
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const id = extractYouTubeId(url);
      if (videos.some((video) => video.id === id))
        throw new Error(
          "This video is already in your library. Try another link.",
        );
      const title = String(form.get("title") ?? "").trim();
      const channel = String(form.get("channel") ?? "").trim();
      if (!title || !channel)
        throw new Error("Please enter a video title and channel name.");
      importVideo({
        id,
        title,
        channel,
        category: String(form.get("category")) as Category,
        thumbnail: youtubeThumbnail(id),
        avatarColor: "#bb795e",
        views: 0,
        publishedAt: new Date().toISOString(),
        description:
          "Imported by you. Title and channel are provided locally; no YouTube metadata is fetched.",
        imported: true,
      });
      notify("Video imported. Find it at the top of your home feed.");
      onDone();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not import this video. Please try again.",
      );
    }
  };
  return (
    <form onSubmit={submit} className="stack-form">
      <p className="muted">
        Found something good? Bring it into your collection.
      </p>
      <label>
        YouTube URL
        <div className="input-with-icon">
          <Link2 size={18} />
          <input
            name="url"
            type="url"
            required
            autoFocus
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError("");
            }}
            aria-describedby="import-help import-error"
          />
        </div>
      </label>
      <p id="import-help" className="field-help">
        Watch, Shorts, youtu.be, embed, and live links are supported.
      </p>
      {preview && (
        <div className="import-preview">
          <img
            src={youtubeThumbnail(preview)}
            alt="YouTube video thumbnail preview"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <span>
            Ready to add to your library
            <ArrowUpRight size={17} />
          </span>
        </div>
      )}
      <label>
        Video title
        <input
          name="title"
          placeholder="Give this video a title"
          required
          maxLength={160}
        />
      </label>
      <div className="form-two-columns">
        <label>
          Channel name
          <input
            name="channel"
            placeholder="Creator or channel"
            required
            maxLength={80}
          />
        </label>
        <label>
          Category
          <select name="category" defaultValue="Technology">
            {categories
              .filter((category) => category !== "All")
              .map((category) => (
                <option key={category}>{category}</option>
              ))}
          </select>
        </label>
      </div>
      <p id="import-error" className="form-error" role="alert">
        {error}
      </p>
      <p className="demo-note">
        Saved in this browser. Playback depends on the creator’s YouTube
        embedding permissions.
      </p>
      <button className="button primary full-width" type="submit">
        <Plus size={18} />
        Import video
      </button>
    </form>
  );
}
export function ImportVideoModal() {
  const open = useUIStore((state) => state.importOpen);
  const setOpen = useUIStore((state) => state.setImportOpen);
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="A new find for your collection"
    >
      <ImportForm onDone={() => setOpen(false)} />
    </Modal>
  );
}
