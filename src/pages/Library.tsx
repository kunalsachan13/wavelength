import { useState, useEffect } from "react";
import { useNav } from "../store/useNavigation";
import { useLibrary } from "../store/useLibraryStore";
import { usePlayer } from "../store/usePlayerStore";
import { getSpotifyPlaylists } from "../services/musicApi";
import { SpotifyPlaylist } from "../types";
import TrackRow from "../components/TrackRow";
import {
  ListMusic,
  Heart,
  Clock,
  Plus,
  Play,
  Pause,
  Shuffle,
  Trash2,
  Music2,
  X,
  Music,
} from "lucide-react";

type Tab = "playlists" | "liked" | "recent";

function EmptyState({
  icon,
  title,
  sub,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl bg-[#181818]/50 border border-white/5 px-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
        {icon}
      </div>
      <div>
        <p className="font-display font-bold text-white text-lg">{title}</p>
        <p className="text-[#a7a7a7] text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">{sub}</p>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-6 py-2.5 rounded-full text-xs font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          style={{ backgroundColor: "#5EEAD4" }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

export default function Library() {
  const [tab, setTab] = useState<Tab>("playlists");
  const { navigate } = useNav();
  const {
    likedTracks,
    recentTracks,
    userPlaylists,
    clearLiked,
    clearRecent,
    createPlaylist,
  } = useLibrary();
  const { playTrack, pause, resume, state } = usePlayer();

  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlName, setNewPlName] = useState("");
  const [newPlDesc, setNewPlDesc] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingPlaylists(true);
    getSpotifyPlaylists()
      .then((data) => {
        if (active) setSpotifyPlaylists(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingPlaylists(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePlayQueue = (tracks: typeof likedTracks, shuffle = false) => {
    if (tracks.length === 0) return;
    const queue = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    playTrack(queue[0], queue);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    const created = createPlaylist(newPlName, newPlDesc);
    setShowCreateModal(false);
    setNewPlName("");
    setNewPlDesc("");
    navigate({ id: "playlist", playlistId: created.id });
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-6 sm:space-y-8 animate-fade-up max-w-[1400px] mx-auto select-none">
      {/* ─── HEADER & CREATE BUTTON ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Your Library
          </h1>
          <p className="text-xs text-[#a7a7a7] mt-1">Playlists, liked tracks, and listening history</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          style={{ backgroundColor: "#5EEAD4" }}
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Create Playlist
        </button>
      </div>

      {/* ─── FILTER CHIPS (SPOTIFY REDESIGN SPEC) ─── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setTab("playlists")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            tab === "playlists"
              ? "bg-white text-black"
              : "bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          <ListMusic className="w-4 h-4" />
          Playlists
          <span className="text-[10px] opacity-70 px-1.5 py-0.2 rounded-full bg-black/20">
            {userPlaylists.length + spotifyPlaylists.length}
          </span>
        </button>

        <button
          onClick={() => setTab("liked")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            tab === "liked"
              ? "bg-white text-black"
              : "bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          <Heart className="w-4 h-4" />
          Liked Songs
          {likedTracks.length > 0 && (
            <span className="text-[10px] opacity-70 px-1.5 py-0.2 rounded-full bg-black/20">
              {likedTracks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("recent")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            tab === "recent"
              ? "bg-white text-black"
              : "bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          <Clock className="w-4 h-4" />
          Recently Played
          {recentTracks.length > 0 && (
            <span className="text-[10px] opacity-70 px-1.5 py-0.2 rounded-full bg-black/20">
              {recentTracks.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: PLAYLISTS ─── */}
      {tab === "playlists" && (
        <div className="space-y-10">
          {/* Custom Playlists */}
          <section>
            <h2 className="font-display font-bold text-xl text-white mb-4">
              Custom Playlists ({userPlaylists.length})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {/* New playlist card */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-4 rounded-lg flex flex-col items-center justify-center text-center group cursor-pointer transition-all hover:bg-[#282828] bg-[#181818] border border-dashed border-white/20 min-h-[220px]"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-white/5 group-hover:bg-[#5EEAD4]/20 transition-colors text-[#a7a7a7] group-hover:text-[#5EEAD4]">
                  <Plus className="w-7 h-7" />
                </div>
                <p className="font-bold text-sm text-white group-hover:text-[#5EEAD4] transition-colors">
                  Create Playlist
                </p>
                <p className="text-xs text-[#a7a7a7] mt-1">Add custom mix</p>
              </button>

              {userPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => navigate({ id: "playlist", playlistId: pl.id })}
                  className="p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer flex flex-col relative shadow-md"
                >
                  <div className="aspect-square w-full rounded-md overflow-hidden mb-3 relative shadow-md bg-[#242424]">
                    {pl.coverArt ? (
                      <img
                        src={pl.coverArt}
                        alt={pl.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <Music className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 w-11 h-11 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 bg-[#5EEAD4] text-black">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <p className="font-bold text-sm text-white truncate leading-tight group-hover:text-[#5EEAD4] transition-colors">
                    {pl.name}
                  </p>
                  <p className="text-xs text-[#a7a7a7] truncate mt-1">
                    {pl.tracks.length} {pl.tracks.length === 1 ? "track" : "tracks"} • Custom
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Curated Spotify Playlists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-xl text-white">Curated Playlists</h2>
                <p className="text-xs text-[#a7a7a7] mt-0.5">Top charts and curated mixes from Spotify</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {spotifyPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => navigate({ id: "playlist", playlistId: pl.spotifyId || pl.id })}
                  className="p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer flex flex-col relative shadow-md"
                >
                  <div className="aspect-square w-full rounded-md overflow-hidden mb-3 relative shadow-md bg-[#242424]">
                    <img
                      src={pl.coverArt}
                      alt={pl.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 right-2 w-11 h-11 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 bg-[#5EEAD4] text-black">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <p className="font-bold text-sm text-white truncate leading-tight group-hover:text-[#5EEAD4] transition-colors">
                    {pl.title}
                  </p>
                  <p className="text-xs text-[#a7a7a7] truncate mt-1">
                    {pl.trackCount > 0 ? `${pl.trackCount} tracks` : "Playlist"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ─── TAB 2: LIKED SONGS ─── */}
      {tab === "liked" && (
        <div>
          {likedTracks.length > 0 ? (
            <div>
              {/* Hero Banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-8 p-4 sm:p-8 rounded-xl bg-gradient-to-b from-indigo-900/60 via-[#1e252a] to-[#121212]">
                <div className="w-28 h-28 xs:w-36 xs:h-36 sm:w-48 sm:h-48 rounded-lg flex items-center justify-center shadow-2xl flex-shrink-0 bg-gradient-to-br from-indigo-700 to-teal-400">
                  <Heart className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 text-white fill-white shadow-xl" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5EEAD4] sm:text-white mb-1.5 sm:mb-2">
                    Auto Collection
                  </p>
                  <h2 className="font-display font-black text-2xl sm:text-5xl text-white mb-2 sm:mb-3">
                    Liked Songs
                  </h2>
                  <p className="text-xs sm:text-sm text-[#a7a7a7] mb-4 sm:mb-5 font-medium">
                    {likedTracks.length} {likedTracks.length === 1 ? "song" : "songs"} saved across Wavelength
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-4">
                    <button
                      onClick={() => handlePlayQueue(likedTracks, false)}
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      style={{ backgroundColor: "#5EEAD4", color: "#000000" }}
                      title="Play All"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                    <button
                      onClick={() => handlePlayQueue(likedTracks, true)}
                      className="p-2 text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
                      title="Shuffle"
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={clearLiked}
                      className="p-2 text-[#a7a7a7] hover:text-red-400 transition-colors cursor-pointer ml-auto"
                      title="Clear Liked Songs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Songs Table */}
              <div className="space-y-0.5">
                {likedTracks.map((t, idx) => (
                  <TrackRow key={t.id} track={t} index={idx + 1} queue={likedTracks} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Heart className="w-8 h-8 text-[#5EEAD4]" />}
              title="No liked songs yet"
              sub="Heart any song while streaming to save it to your personal favorites collection."
              action="Find Songs to Like"
              onAction={() => navigate({ id: "search" })}
            />
          )}
        </div>
      )}

      {/* ─── TAB 3: RECENTLY PLAYED ─── */}
      {tab === "recent" && (
        <div>
          {recentTracks.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-white">Listening History</h2>
                  <p className="text-xs text-[#a7a7a7]">Tracks played across your recent sessions</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayQueue(recentTracks, false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black shadow-md hover:scale-105 transition-transform cursor-pointer"
                    style={{ backgroundColor: "#5EEAD4" }}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    Play All
                  </button>
                  <button
                    onClick={clearRecent}
                    className="p-2 rounded-full text-[#a7a7a7] hover:text-red-400 transition-colors cursor-pointer"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                {recentTracks.map((t, idx) => (
                  <TrackRow key={t.id} track={t} index={idx + 1} queue={recentTracks} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="w-8 h-8 text-[#5EEAD4]" />}
              title="No listening history"
              sub="Tracks you stream will appear here automatically so you can get back to them anytime."
              action="Explore Discover"
              onAction={() => navigate({ id: "home" })}
            />
          )}
        </div>
      )}

      {/* ─── CREATE PLAYLIST MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#282828] border border-white/10 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-white">New Playlist</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-[#a7a7a7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="My Playlist #1"
                  value={newPlName}
                  onChange={(e) => setNewPlName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-[#3e3e3e] border border-transparent focus:border-white text-sm text-white placeholder-[#a7a7a7] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Give your playlist a vibe or description"
                  value={newPlDesc}
                  onChange={(e) => setNewPlDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md bg-[#3e3e3e] border border-transparent focus:border-white text-sm text-white placeholder-[#a7a7a7] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#a7a7a7] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlName.trim()}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-black shadow-lg hover:scale-105 disabled:opacity-40 transition-all cursor-pointer"
                  style={{ backgroundColor: "#5EEAD4" }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
