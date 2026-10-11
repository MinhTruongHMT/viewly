import { useState, type FormEvent } from "react";
import { Plus, ListVideo } from "lucide-react";
import { Modal } from "./Modal";
import { useAppStore } from "../../store/useAppStore";
import { useUIStore } from "../../store/useUIStore";

function Picker({ videoId }: { videoId: string }) {
  const playlists = useAppStore((state) => state.playlists);
  const toggleVideo = useAppStore((state) => state.togglePlaylistVideo);
  const createPlaylist = useAppStore((state) => state.createPlaylist);
  const [error, setError] = useState("");
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const name = String(new FormData(event.currentTarget).get("name") ?? "");
      const id = createPlaylist(name);
      toggleVideo(id, videoId);
      event.currentTarget.reset();
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create playlist.",
      );
    }
  };
  return (
    <>
      <p className="muted">
        Keep your favorite finds together. Changes save automatically.
      </p>
      <div className="playlist-checks">
        {playlists.map((list) => (
          <label key={list.id}>
            <ListVideo size={20} />
            <span>{list.name}</span>
            <input
              type="checkbox"
              checked={list.videoIds.includes(videoId)}
              onChange={() => toggleVideo(list.id, videoId)}
            />
          </label>
        ))}
      </div>
      <form onSubmit={create} className="playlist-create">
        <input
          name="name"
          aria-label="New playlist name"
          placeholder="New playlist name"
          maxLength={80}
          required
        />
        <button className="button primary" type="submit">
          <Plus size={18} />
          Create
        </button>
      </form>
      <p className="form-error" role="alert">
        {error}
      </p>
    </>
  );
}
export function PlaylistPicker() {
  const videoId = useUIStore((state) => state.playlistVideoId);
  const setVideoId = useUIStore((state) => state.setPlaylistVideoId);
  return (
    <Modal
      open={videoId !== null}
      onClose={() => setVideoId(null)}
      title="Save to a playlist"
    >
      {videoId && <Picker videoId={videoId} />}
    </Modal>
  );
}
