import { useState, useEffect } from "react";
import { usePlayer } from "../store/usePlayerStore";
import { useNav } from "../store/useNavigation";
import { useLibrary } from "../store/useLibraryStore";
import {
  getChartTracks,
  getChartArtists,
  getChartAlbums,
  getSpotifyPlaylists,
  RemoteTrack,
  ChartArtist,
  ChartAlbum,
} from "../services/musicApi";
import { Track, SpotifyPlaylist } from "../types";
import { genWaveform } from "../data/mockData";
import { Play, Pause, TrendingUp, Sparkles, AlertCircle, Compass, Radio, Disc, ListMusic, Heart } from "lucide-react";

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
  genres: [] as string[],
  stripeConnected: false,
};

function remoteToTrack(r: RemoteTrack): Track {
  return {
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
  };
}

export default function Home() {
  const { playTrack, pause, resume, state } = usePlayer();
  const { navigate } = useNav();
  const { likedTracks } = useLibrary();

  const [chartTracks, setChartTracks] = useState<RemoteTrack[]>([]);
  const [chartArtists, setChartArtists] = useState<ChartArtist[]>([]);
  const [chartAlbums, setChartAlbums] = useState<ChartAlbum[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getChartTracks(20),
      getChartArtists(10),
      getChartAlbums(8),
      getSpotifyPlaylists().catch(() => []),
    ])
      .then(([t, a, al, pls]) => {
        if (cancelled) return;
        setChartTracks(t);
        setChartArtists(a);
        setChartAlbums(al);
        setPlaylists(pls);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allTracks = chartTracks.map(remoteToTrack);

  // Greeting based on hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-[#a7a7a7]" />
        <p className="text-[#a7a7a7] text-sm">Could not load SpotAPI chart catalog.</p>
        <button
          onClick={() => {
            setError(false);
            setLoading(true);
            window.location.reload();
          }}
          className="px-5 py-2 rounded-full text-xs font-bold text-black cursor-pointer shadow-lg"
          style={{ backgroundColor: "#5EEAD4" }}
        >
          Try again
        </button>
      </div>
    );
  }

  // Quick access cards (Liked Songs + first 5 chart tracks)
  const quickAccess = [
    {
      id: "liked-songs",
      title: "Liked Songs",
      subtitle: `${likedTracks.length} tracks`,
      coverArt: "",
      isLiked: true,
      onClick: () => navigate({ id: "library" }),
      onPlay: (e: React.MouseEvent) => {
        e.stopPropagation();
        if (likedTracks.length > 0) playTrack(likedTracks[0], likedTracks);
      },
    },
    ...allTracks.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.artist.name,
      coverArt: t.coverArt,
      isLiked: false,
      onClick: () => playTrack(t, allTracks),
      onPlay: (e: React.MouseEvent) => {
        e.stopPropagation();
        if (state.currentTrack?.id === t.id && state.status === "playing") {
          pause();
        } else if (state.currentTrack?.id === t.id) {
          resume();
        } else {
          playTrack(t, allTracks);
        }
      },
    })),
  ];

  return (
    <div className="p-3.5 sm:p-6 space-y-6 sm:space-y-9 animate-fade-up max-w-[1400px] mx-auto select-none">
      {/* ─── GREETING HEADER ─── */}
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
          {greeting}
        </h1>
      </div>

      {/* ─── QUICK ACCESS 6-GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-14 sm:h-20 rounded-md bg-white/5 animate-pulse flex items-center"
              >
                <div className="w-14 sm:w-20 h-full bg-white/10 rounded-l-md flex-shrink-0" />
                <div className="ml-3 sm:ml-4 h-4 w-32 bg-white/10 rounded" />
              </div>
            ))
          : quickAccess.map((item) => {
              const isCurrent = state.currentTrack?.id === item.id;
              const isPlaying = isCurrent && state.status === "playing";
              return (
                <div
                  key={item.id}
                  onClick={item.onClick}
                  className="h-14 sm:h-20 rounded-md bg-white/[0.07] hover:bg-white/[0.14] transition-all flex items-center overflow-hidden group cursor-pointer shadow-md relative"
                >
                  {/* Thumbnail */}
                  <div className="w-14 sm:w-20 h-full flex-shrink-0 bg-[#181818] shadow-sm relative">
                    {item.isLiked ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-700 to-teal-400">
                        <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-white fill-white shadow-md" />
                      </div>
                    ) : (
                      <img src={item.coverArt} alt={item.title} className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0 px-3 sm:px-4">
                    <p className="font-bold text-xs sm:text-base text-white truncate group-hover:text-[#5EEAD4] transition-colors leading-tight">
                      {item.title}
                    </p>
                  </div>

                  {/* Hover Play Button */}
                  <button
                    onClick={item.onPlay}
                    className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center mr-2.5 sm:mr-4 flex-shrink-0 shadow-2xl transition-all duration-200 transform cursor-pointer ${
                      isPlaying || isCurrent
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100"
                    }`}
                    style={{ backgroundColor: "#5EEAD4", color: "#000000" }}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
      </div>

      {/* ─── SECTION 1: TOP GLOBAL HITS TODAY ─── */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-2xl text-white hover:underline cursor-pointer">
              Top Global Tracks
            </h2>
            <p className="text-[11px] sm:text-xs text-[#a7a7a7] mt-0.5">Spotify Top 50 Global • 320kbps streams</p>
          </div>
          <button
            onClick={() => navigate({ id: "search" })}
            className="text-[11px] sm:text-xs font-bold text-[#a7a7a7] hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
          >
            Show all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-2.5 sm:p-3.5 rounded-lg bg-[#181818] animate-pulse space-y-2.5">
                  <div className="aspect-square w-full rounded-md bg-white/10" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="h-3 w-1/2 bg-white/10 rounded" />
                </div>
              ))
            : allTracks.slice(0, 6).map((track) => {
                const isCurrent = state.currentTrack?.id === track.id;
                const isPlaying = isCurrent && state.status === "playing";
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, allTracks)}
                    className="p-2.5 sm:p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer flex flex-col relative shadow-md"
                  >
                    <div className="aspect-square w-full rounded-md overflow-hidden mb-2 sm:mb-3 relative shadow-md bg-[#242424]">
                      <img
                        src={track.coverArt}
                        alt={track.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Floating Play Button on Image */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrent) {
                            isPlaying ? pause() : resume();
                          } else {
                            playTrack(track, allTracks);
                          }
                        }}
                        className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform cursor-pointer ${
                          isPlaying || isCurrent
                            ? "opacity-100 translate-y-0 scale-100"
                            : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100"
                        }`}
                        style={{ backgroundColor: "#5EEAD4", color: "#000000" }}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    <p
                      className={`font-bold text-xs sm:text-sm truncate leading-tight transition-colors ${
                        isCurrent ? "text-[#5EEAD4]" : "text-white group-hover:text-[#5EEAD4]"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#a7a7a7] truncate mt-0.5 sm:mt-1">
                      {track.artist.name}
                    </p>
                  </div>
                );
              })}
        </div>
      </section>

      {/* ─── SECTION 2: CURATED PLAYLISTS ─── */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="font-display font-bold text-lg sm:text-2xl text-white hover:underline cursor-pointer">
                Featured Playlists
              </h2>
              <p className="text-[11px] sm:text-xs text-[#a7a7a7] mt-0.5">Curated mixes powered by SpotAPI</p>
            </div>
            <button
              onClick={() => navigate({ id: "library" })}
              className="text-[11px] sm:text-xs font-bold text-[#a7a7a7] hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
            >
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {playlists.slice(0, 6).map((pl) => (
              <div
                key={pl.id}
                onClick={() => navigate({ id: "playlist", playlistId: pl.spotifyId || pl.id })}
                className="p-2.5 sm:p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer flex flex-col relative shadow-md"
              >
                <div className="aspect-square w-full rounded-md overflow-hidden mb-2 sm:mb-3 relative shadow-md bg-[#242424]">
                  <img
                    src={pl.coverArt}
                    alt={pl.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 bg-[#5EEAD4] text-black">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <p className="font-bold text-xs sm:text-sm text-white truncate leading-tight group-hover:text-[#5EEAD4] transition-colors">
                  {pl.title}
                </p>
                <p className="text-[11px] sm:text-xs text-[#a7a7a7] line-clamp-2 mt-0.5 sm:mt-1">
                  {pl.description || `Playlist • ${pl.trackCount} tracks`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── SECTION 3: POPULAR ARTISTS ─── */}
      {chartArtists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="font-display font-bold text-lg sm:text-2xl text-white hover:underline cursor-pointer">
                Popular Artists
              </h2>
              <p className="text-[11px] sm:text-xs text-[#a7a7a7] mt-0.5">Top artists on Spotify charts</p>
            </div>
            <button
              onClick={() => navigate({ id: "search" })}
              className="text-[11px] sm:text-xs font-bold text-[#a7a7a7] hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
            >
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {chartArtists.slice(0, 6).map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigate({ id: "artist", artistId: artist.spotifyId || artist.id })}
                className="p-2.5 sm:p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer flex flex-col items-center text-center shadow-md relative"
              >
                <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-36 sm:h-36 rounded-full overflow-hidden mb-2 sm:mb-3 relative shadow-lg bg-[#242424] ring-1 ring-white/10 group-hover:ring-[#5EEAD4]/40 transition-all">
                  {artist.avatarUrl ? (
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl font-bold text-[#a7a7a7]">
                      {artist.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 bg-[#5EEAD4] text-black">
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                  </div>
                </div>

                <p className="font-bold text-xs sm:text-sm text-white truncate w-full group-hover:text-[#5EEAD4] transition-colors">
                  {artist.name}
                </p>
                <p className="text-[10px] sm:text-xs text-[#a7a7a7] mt-0.5">Artist</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── SECTION 4: NEW RELEASES / ALBUMS ─── */}
      {chartAlbums.length > 0 && (
        <section className="pb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="font-display font-bold text-lg sm:text-2xl text-white hover:underline cursor-pointer">
                New Releases & Albums
              </h2>
              <p className="text-[11px] sm:text-xs text-[#a7a7a7] mt-0.5">Trending albums across Spotify</p>
            </div>
            <button
              onClick={() => navigate({ id: "search" })}
              className="text-[11px] sm:text-xs font-bold text-[#a7a7a7] hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
            >
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {chartAlbums.slice(0, 6).map((album) => (
              <div
                key={album.id}
                onClick={() => navigate({ id: "search" })}
                className="p-2.5 sm:p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer flex flex-col relative shadow-md"
              >
                <div className="aspect-square w-full rounded-md overflow-hidden mb-2 sm:mb-3 relative shadow-md bg-[#242424]">
                  <img
                    src={album.coverArt}
                    alt={album.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 bg-[#5EEAD4] text-black">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <p className="font-bold text-xs sm:text-sm text-white truncate leading-tight group-hover:text-[#5EEAD4] transition-colors">
                  {album.title}
                </p>
                <p className="text-[11px] sm:text-xs text-[#a7a7a7] truncate mt-0.5 sm:mt-1">
                  {album.artistName} {album.year ? `• ${album.year}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
