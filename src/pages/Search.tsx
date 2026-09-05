import { useState, useMemo, useEffect, useRef } from "react";
import { tracks as localTracks } from "../data/mockData";
import { Track, SpotifyPlaylist } from "../types";
import TrackRow from "../components/TrackRow";
import { searchTracks, RemoteTrack, RemoteArtist } from "../services/musicApi";
import { genWaveform } from "../data/mockData";
import { useNav } from "../store/useNavigation";
import { usePlayer } from "../store/usePlayerStore";
import { Search as SearchIcon, X, Sparkles, Music2, Radio, ListMusic, Play, Pause } from "lucide-react";

interface GenreTile {
  label: string;
  color: string;
  img: string;
}

const GENRE_TILES: GenreTile[] = [
  { label: "Pop", color: "#8c1932", img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80" },
  { label: "Hip-Hop", color: "#bc5900", img: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80" },
  { label: "Rock", color: "#e61e32", img: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80" },
  { label: "Electronic", color: "#1e3264", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80" },
  { label: "R&B", color: "#777777", img: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=300&auto=format&fit=crop&q=80" },
  { label: "Jazz", color: "#056952", img: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&auto=format&fit=crop&q=80" },
  { label: "Ambient", color: "#477d95", img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80" },
  { label: "Lo-Fi", color: "#503750", img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80" },
  { label: "Afrobeats", color: "#d84000", img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80" },
  { label: "Latin", color: "#e1118c", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80" },
  { label: "Classical", color: "#7d4b32", img: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&auto=format&fit=crop&q=80" },
  { label: "K-Pop", color: "#2d46b9", img: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=300&auto=format&fit=crop&q=80" },
];

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

export default function Search() {
  const { navigate } = useNav();
  const { playTrack, pause, resume, state } = usePlayer();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "tracks" | "playlists" | "artists">("all");
  const [remoteTracks, setRemoteTracks] = useState<Track[]>([]);
  const [remoteArtists, setRemoteArtists] = useState<RemoteArtist[]>([]);
  const [remotePlaylists, setRemotePlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setRemoteTracks([]);
      setRemoteArtists([]);
      setRemotePlaylists([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchTracks(q, 24);
        setRemoteTracks(res.tracks.map(remoteToTrack));
        setRemoteArtists(res.artists || []);
        setRemotePlaylists(res.playlists || []);
      } catch {
        setRemoteTracks([]);
        setRemoteArtists([]);
        setRemotePlaylists([]);
      } finally {
        setIsLoading(false);
      }
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const localResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return localTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.name.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
    );
  }, [query]);

  const visibleTracks = useMemo(() => {
    const remoteIds = new Set(remoteTracks.map((t) => t.id));
    return [...remoteTracks, ...localResults.filter((t) => !remoteIds.has(t.id))];
  }, [remoteTracks, localResults]);

  const hasResults =
    visibleTracks.length > 0 || remoteArtists.length > 0 || remotePlaylists.length > 0;

  const topTrack = visibleTracks[0];
  const isTopPlaying = topTrack && state.currentTrack?.id === topTrack.id && state.status === "playing";

  return (
    <div className="p-3.5 sm:p-6 space-y-6 sm:space-y-8 animate-fade-up max-w-[1400px] mx-auto select-none">
      {/* ─── SEARCH INPUT ─── */}
      <div className="max-w-md">
        <div className="relative group">
          <SearchIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a7a7a7] group-focus-within:text-white transition-colors pointer-events-none"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="What do you want to play?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-12 pr-11 py-3 rounded-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#242424] border border-transparent focus:border-white text-sm text-white placeholder-[#a7a7a7] outline-none transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a7a7a7] hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ─── CATEGORY FILTER CHIPS ─── */}
      {query && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {(["all", "tracks", "playlists", "artists"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {cat === "all" ? "All" : cat === "tracks" ? "Songs" : cat}
            </button>
          ))}
          {isLoading && (
            <span className="text-[#a7a7a7] text-xs flex items-center gap-1.5 ml-2">
              <span className="w-3 h-3 rounded-full border-2 border-[#5EEAD4] border-t-transparent animate-spin inline-block" />
              Searching Spotify…
            </span>
          )}
        </div>
      )}

      {/* ─── SEARCH RESULTS ─── */}
      {query ? (
        hasResults ? (
          <div className="space-y-8 sm:space-y-10">
            {/* Split Top Result + Songs (iconic Spotify layout) */}
            {(activeCategory === "all" || activeCategory === "tracks") && topTrack && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                {/* Top Result Card (Left 2 cols) */}
                <div className="lg:col-span-2">
                  <h2 className="font-display font-bold text-lg sm:text-xl text-white mb-3">Top result</h2>
                  <div
                    onClick={() => playTrack(topTrack, visibleTracks)}
                    className="p-4 sm:p-5 rounded-xl bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer relative shadow-lg flex flex-col justify-between min-h-[190px] sm:h-[240px]"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shadow-md bg-[#242424]">
                      <img
                        src={topTrack.coverArt}
                        alt={topTrack.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white truncate leading-tight group-hover:text-[#5EEAD4] transition-colors">
                        {topTrack.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white">
                          Song
                        </span>
                        <span className="text-xs text-[#a7a7a7] font-medium truncate">
                          {topTrack.artist.name}
                        </span>
                      </div>
                    </div>

                    {/* Floating Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (state.currentTrack?.id === topTrack.id) {
                          isTopPlaying ? pause() : resume();
                        } else {
                          playTrack(topTrack, visibleTracks);
                        }
                      }}
                      className="absolute bottom-4 right-4 w-11 h-11 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform bg-[#5EEAD4] text-black cursor-pointer hover:scale-105 active:scale-95"
                      title={isTopPlaying ? "Pause" : "Play"}
                    >
                      {isTopPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Top 4 Matching Songs (Right 3 cols) */}
                <div className="lg:col-span-3">
                  <h2 className="font-display font-bold text-lg sm:text-xl text-white mb-3">Songs</h2>
                  <div className="space-y-0.5">
                    {visibleTracks.slice(0, 4).map((t, idx) => (
                      <TrackRow key={t.id} track={t} index={idx + 1} queue={visibleTracks} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Matching Playlists */}
            {remotePlaylists.length > 0 && (activeCategory === "all" || activeCategory === "playlists") && (
              <section>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="font-display font-bold text-lg sm:text-xl text-white">Playlists</h2>
                  <span className="text-xs font-semibold text-[#5EEAD4]">
                    {remotePlaylists.length} from Spotify
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
                  {remotePlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => navigate({ id: "playlist", playlistId: pl.spotifyId || pl.id })}
                      className="p-2.5 sm:p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer flex flex-col relative shadow-md"
                    >
                      <div className="aspect-square w-full rounded-md overflow-hidden mb-2 sm:mb-3 relative shadow-md bg-[#242424]">
                        {pl.coverArt ? (
                          <img
                            src={pl.coverArt}
                            alt={pl.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#242424] text-[#a7a7a7]">
                            <ListMusic className="w-8 h-8 opacity-40" />
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 transform opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 bg-[#5EEAD4] text-black">
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-white truncate leading-tight group-hover:text-[#5EEAD4] transition-colors">
                        {pl.title}
                      </p>
                      <p className="text-[11px] sm:text-xs text-[#a7a7a7] truncate mt-0.5 sm:mt-1">
                        {pl.owner ? `By ${pl.owner}` : "Spotify Playlist"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Matching Artists */}
            {remoteArtists.length > 0 && (activeCategory === "all" || activeCategory === "artists") && (
              <section>
                <h2 className="font-display font-bold text-lg sm:text-xl text-white mb-3 sm:mb-4">Artists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
                  {remoteArtists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => navigate({ id: "artist", artistId: artist.spotifyId || artist.id })}
                      className="p-2.5 sm:p-3.5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all group cursor-pointer flex flex-col items-center text-center shadow-md relative"
                    >
                      <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-36 sm:h-36 rounded-full overflow-hidden mb-2 sm:mb-3 relative shadow-lg bg-[#242424] ring-1 ring-white/10 group-hover:ring-[#5EEAD4]/40 transition-all">
                        {artist.avatarUrl ? (
                          <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
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

            {/* All Remaining Songs */}
            {visibleTracks.length > 4 && activeCategory === "all" && (
              <section>
                <h2 className="font-display font-bold text-lg sm:text-xl text-white mb-3 sm:mb-4">More Tracks</h2>
                <div className="space-y-0.5">
                  {visibleTracks.slice(4).map((t, idx) => (
                    <TrackRow key={t.id} track={t} index={idx + 5} queue={visibleTracks} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : !isLoading ? (
          <div className="text-center py-20">
            <p className="text-[#a7a7a7] text-sm sm:text-base">
              No results found for <span className="text-white font-semibold">&ldquo;{query}&rdquo;</span>
            </p>
            <p className="text-[#a7a7a7] text-xs mt-1">Please check your spelling or use different keywords</p>
          </div>
        ) : null
      ) : (
        /* ─── BROWSE ALL GENRE TILES (SPOTIFY REDESIGN SPEC) ─── */
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4 sm:mb-5">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {GENRE_TILES.map(({ label, color, img }) => (
              <button
                key={label}
                onClick={() => setQuery(label)}
                className="relative rounded-xl overflow-hidden h-28 sm:h-48 p-3 sm:p-4 text-left group cursor-pointer shadow-md transition-transform hover:scale-[1.02] active:scale-98"
                style={{ backgroundColor: color }}
              >
                <h3 className="font-display font-black text-base sm:text-2xl text-white leading-tight break-words max-w-[80%]">
                  {label}
                </h3>
                {/* 3D Angled Artwork on bottom right */}
                <div className="absolute -bottom-2 -right-3 w-16 h-16 sm:w-28 sm:h-28 rounded-md overflow-hidden shadow-2xl transform rotate-[25deg] group-hover:rotate-[20deg] group-hover:scale-105 transition-all duration-300">
                  <img src={img} alt={label} className="w-full h-full object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
