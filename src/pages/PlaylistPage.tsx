import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ListVideo, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useUIStore } from "../store/useUIStore";
import { useVideos } from "../hooks/useVideos";
import { VideoCard } from "../components/video/VideoCard";
import { EmptyState } from "../components/ui/EmptyState";

export default function PlaylistPage() {
  const { playlistId } = useParams();
  const playlists = useAppStore((state) => state.playlists);
  const createPlaylist = useAppStore((state) => state.createPlaylist);
  const deletePlaylist = useAppStore((state) => state.deletePlaylist);
  const toggleVideo = useAppStore((state) => state.togglePlaylistVideo);
  const notify = useUIStore((state) => state.notify);
  const videos = useVideos();
  const [error, setError] = useState("");
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      createPlaylist(
        String(new FormData(event.currentTarget).get("name") ?? ""),
      );
      event.currentTarget.reset();
      setError("");
      notify("Playlist created");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create playlist.",
      );
    }
  };
  const playlist = playlists.find((list) => list.id === playlistId);
  if (playlistId && !playlist)
    return (
      <EmptyState
        title="This playlist isn’t here"
        description="It may have been removed from this browser."
      />
    );
  const items =
    playlist?.videoIds
      .map((id) => videos.find((video) => video.id === id))
      .filter((video) => video !== undefined) ?? [];
  return (
    <div>
      {playlist && (
        <Link className="back-link" to="/playlists">
          <ArrowLeft size={16} />
          All playlists
        </Link>
      )}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ListVideo size={14} /> GOOD FINDS BELONG TOGETHER
          </div>
          <h1>{playlist?.name ?? "Curated by you"}</h1>
          <p>
            {playlist
              ? `${items.length} videos · Saved in this browser`
              : "A playlist for every mood, project, and late-night rabbit hole."}
          </p>
        </div>
      </div>
      {playlist ? (
        items.length ? (
          <div className="video-grid">
            {items.map((video) => (
              <div key={video.id}>
                <VideoCard video={video} />
                <button
                  className="text-button remove-playlist-video"
                  onClick={() => toggleVideo(playlist.id, video.id)}
                >
                  <Trash2 size={14} />
                  Remove from playlist
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Room for your next favorites"
            description="Open a video’s options menu and choose Add to playlist to fill this collection."
          />
        )
      ) : (
        <>
          <form
            className="playlist-create page-playlist-create"
            onSubmit={create}
          >
            <input
              name="name"
              aria-label="New playlist name"
              placeholder="Name your next collection…"
              required
              maxLength={80}
            />
            <button className="button primary" type="submit">
              <Plus size={18} />
              Create playlist
            </button>
          </form>
          <p className="form-error" role="alert">
            {error}
          </p>
          {playlists.length ? (
            <div className="playlist-grid">
              {playlists.map((list) => {
                const cover = videos.find((video) =>
                  list.videoIds.includes(video.id),
                );
                return (
                  <article className="playlist-card" key={list.id}>
                    <Link to={`/playlists/${list.id}`}>
                      <div className="playlist-cover">
                        {cover ? (
                          <img src={cover.thumbnail} alt="" />
                        ) : (
                          <ListVideo size={45} />
                        )}
                        <span>
                          <ListVideo size={16} />
                          {list.videoIds.length} videos
                        </span>
                      </div>
                      <h2>{list.name}</h2>
                      <p>Your local collection</p>
                    </Link>
                    <button
                      className="icon-button"
                      aria-label={`Delete playlist ${list.name}`}
                      onClick={() => {
                        deletePlaylist(list.id);
                        notify("Playlist deleted");
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Make a little collection"
              description="Create your first playlist above, then add videos from their options menus."
            />
          )}
        </>
      )}
    </div>
  );
}
