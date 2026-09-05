import { useEffect, useState } from "react";
import { useNav } from "../store/useNavigation";
import { useLibrary } from "../store/useLibraryStore";
import { usePlayer } from "../store/usePlayerStore";
import { getPlaylist } from "../services/musicApi";
import { Track, SpotifyPlaylist } from "../types";
import TrackRow from "../components/TrackRow";
import { genWaveform } from "../data/mockData";
import { ArrowLeft, Play, Pause, Shuffle, Trash2, Music2, Clock, ListMusic } from "lucide-react";

interface Props {
  playlistId: string;
}

const SPOTIFY_ARTIST_STUB = {
  id: "sp-stub",
  name: "",
  avatarUrl: "",
  coverUrl: "",
  bio: "",
  isVerified: false,
  totalPlays: 0,
  monthlyListeners: 0,
  followers: 0,
  genres: [],
  stripeConnected: false,
};

function fmtTotalDuration(tracks: Track[]) {
  const totalSecs = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
}

export default function PlaylistPage({ playlistId }: Props) {
  const { navigate, back } = useNav();
  const { getPlaylistById, deletePlaylist } = useLibrary();
  const { playTrack, pause, resume, state } = usePlayer();

  const userPlaylist = getPlaylistById(playlistId);
  const [spotifyPlaylist, setSpotifyPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userPlaylist) return;

    let active = true;
    setLoading(true);
    setError(null);

    getPlaylist(playlistId)
      .then((data) => {
        if (!active) return;
        if (data) {
          setSpotifyPlaylist(data);
        } else {
          setError("Playlist not found or unavailable.");
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load playlist.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [playlistId, userPlaylist]);

  // Loading state
  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="flex flex-col sm:flex-row items-end gap-6 pb-6">
          <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white/10 rounded-lg shadow-2xl" />
          <div className="space-y-4 flex-1">
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-10 w-3/4 bg-white/10 rounded" />
            <div className="h-4 w-1/2 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || (!userPlaylist && !spotifyPlaylist)) {
    return (
      <div className="p-16 text-center max-w-md mx-auto">
        <ListMusic className="w-16 h-16 text-[#a7a7a7] mx-auto mb-4 opacity-50" />
        <h2 className="font-display font-bold text-2xl text-white mb-2">Playlist Unavailable</h2>
        <p className="text-sm text-[#a7a7a7] mb-6">{error || "Could not retrieve playlist from Spotify."}</p>
        <button
          onClick={back}
          className="px-6 py-2.5 rounded-full text-xs font-bold text-black shadow-lg hover:scale-105 transition-transform"
          style={{ backgroundColor: "#5EEAD4" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Data normalization
  const title = userPlaylist ? userPlaylist.name : spotifyPlaylist!.title;
  const description = userPlaylist ? userPlaylist.description : spotifyPlaylist!.description;
  const coverArt = userPlaylist
    ? userPlaylist.coverArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
    : spotifyPlaylist!.coverArt;
  const owner = userPlaylist ? userPlaylist.createdBy || "You" : spotifyPlaylist!.owner || "Spotify";
  const badge = userPlaylist ? "Custom Playlist" : "Public Playlist";

  const tracks: Track[] = userPlaylist
    ? userPlaylist.tracks
    : (spotifyPlaylist!.tracks || []).map((r) => ({
        id: r.id,
        title: r.title,
        artist: {
          ...SPOTIFY_ARTIST_STUB,
          id: r.artistId ? `sp-artist-${r.artistId}` : `sp-artist-${r.id}`,
          name: r.artistName,
          avatarUrl: r.artistAvatar ?? "",
          coverUrl: r.artistAvatar ?? "",
        },
        album: r.album,
        duration: r.duration,
        coverArt: r.coverArt,
        audioUrl: r.audioUrl,
        genre: r.genre ?? "",
        playCount: r.rank ?? 0,
        isExplicit: r.isExplicit,
        source: "spotify",
        waveform: genWaveform(r.id.charCodeAt(4) % 20),
        releaseYear: 0,
        liked: false,
        spotifyId: r.spotifyId,
        needsResolve: r.needsResolve,
      }));

  const isPlaylistActive = tracks.some((t) => t.id === state.currentTrack?.id);
  const isPlaylistPlaying = isPlaylistActive && state.status === "playing";

  const handlePlayAll = (shuffle = false) => {
    if (tracks.length === 0) return;
    if (isPlaylistPlaying) {
      pause();
      return;
    }
    if (isPlaylistActive && state.status === "paused") {
      resume();
      return;
    }
    const queue = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks;
    playTrack(queue[0], queue);
  };

  const handleDelete = () => {
    if (userPlaylist && confirm(`Delete playlist "${userPlaylist.name}"?`)) {
      deletePlaylist(userPlaylist.id);
      navigate({ id: "library" });
    }
  };

  return (
    <div className="select-none">
      {/* ─── HERO HEADER BANNER (SPOTIFY REDESIGN SPEC) ─── */}
      <div className="relative p-4 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 bg-gradient-to-b from-[#243c36] via-[#1a2522] to-[#121212]">
        {/* Responsive Square Artwork */}
        <div className="w-36 h-36 xs:w-44 xs:h-44 sm:w-56 sm:h-56 lg:w-60 lg:h-60 rounded-md overflow-hidden flex-shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.6)] bg-[#242424] ring-1 ring-white/10">
          <img src={coverArt} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Header Metadata */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#5EEAD4] sm:text-white mb-1.5 sm:mb-2">
            {badge}
          </p>

          <h1 className="font-display font-black text-2xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-2.5 sm:mb-4 break-words">
            {title}
          </h1>

          {description && (
            <p
              className="text-xs sm:text-sm text-[#a7a7a7] max-w-2xl mb-3 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-white font-medium flex-wrap">
            <span className="font-bold">{owner}</span>
            <span>•</span>
            <span>{tracks.length} {tracks.length === 1 ? "song" : "songs"}</span>
            {tracks.length > 0 && (
              <>
                <span>•</span>
                <span className="text-[#a7a7a7]">{fmtTotalDuration(tracks)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── ACTION BAR (SPOTIFY 56px BUTTON) ─── */}
      <div className="p-4 sm:px-8 flex items-center gap-4 sm:gap-6 bg-gradient-to-b from-[#121212] to-[#121212]/80">
        <button
          disabled={tracks.length === 0}
          onClick={() => handlePlayAll(false)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-40 flex-shrink-0"
          style={{ backgroundColor: "#5EEAD4", color: "#000000" }}
          title={isPlaylistPlaying ? "Pause" : "Play"}
        >
          {isPlaylistPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black" />
          ) : (
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black ml-0.5 sm:ml-1" />
          )}
        </button>

        <button
          disabled={tracks.length === 0}
          onClick={() => handlePlayAll(true)}
          className="p-2 text-[#a7a7a7] hover:text-white transition-colors cursor-pointer disabled:opacity-30"
          title="Shuffle"
        >
          <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {userPlaylist && (
          <button
            onClick={handleDelete}
            className="p-2 text-[#a7a7a7] hover:text-red-400 transition-colors cursor-pointer ml-auto"
            title="Delete Playlist"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ─── TRACK TABLE ─── */}
      <div className="px-3 sm:px-8 pb-12">
        {tracks.length > 0 ? (
          <div>
            {/* Table Header */}
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#a7a7a7] border-b border-white/10 uppercase tracking-wider mb-2">
              <span className="w-6 text-center">#</span>
              <span className="flex-1">Title</span>
              <span className="hidden md:block w-1/4">Album</span>
              <span className="w-10 text-right">
                <Clock className="w-4 h-4 ml-auto" />
              </span>
            </div>

            {/* Song rows */}
            <div className="space-y-0.5">
              {tracks.map((t, idx) => (
                <TrackRow key={t.id} track={t} index={idx + 1} queue={tracks} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 px-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Music2 className="w-12 h-12 text-[#a7a7a7] mx-auto mb-3 opacity-40" />
            <h3 className="font-display font-bold text-white text-lg mb-1">
              This playlist is empty
            </h3>
            <p className="text-xs text-[#a7a7a7] max-w-sm mx-auto mb-5">
              Search for songs to add tracks to your playlist.
            </p>
            <button
              onClick={() => navigate({ id: "search" })}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-black shadow-lg hover:scale-105 transition-transform"
              style={{ backgroundColor: "#5EEAD4" }}
            >
              Search Songs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
