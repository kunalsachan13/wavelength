import { useState, useEffect } from "react";
import { useNav } from "../store/useNavigation";
import { usePlayer } from "../store/usePlayerStore";
import { useDonations } from "../store/useDonationStore";
import TrackRow from "../components/TrackRow";
import DonationModal from "../components/DonationModal";
import { getArtistProfile } from "../services/musicApi";
import { Track, RemoteArtistProfile, Artist } from "../types";
import { genWaveform } from "../data/mockData";
import {
  Play,
  Pause,
  UserCheck,
  UserPlus,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Heart,
  DollarSign,
  Coffee,
} from "lucide-react";

function fmtNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

export default function ArtistProfile({ artistId }: { artistId: string }) {
  const { playTrack, state, pause, resume } = usePlayer();
  const { getArtistDonations } = useDonations();
  const [profile, setProfile] = useState<RemoteArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const cleanId = artistId.replace(/^sp-artist-/, "").replace(/^dz-artist-/, "").replace(/^arc-artist-/, "");
    getArtistProfile(cleanId)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [artistId]);

  const artistTracks: Track[] = (profile?.topTracks || []).map((r) => ({
    id: r.id,
    title: r.title,
    artist: {
      id: profile?.id || r.artistId,
      name: profile?.name || r.artistName,
      avatarUrl: profile?.avatarUrl || r.artistAvatar,
      coverUrl: profile?.coverUrl || profile?.avatarUrl || "",
      bio: profile?.bio || "",
      isVerified: profile?.isVerified ?? true,
      totalPlays: 0,
      monthlyListeners: profile?.monthlyListeners || 0,
      followers: profile?.followers || 0,
      genres: profile?.genres || [],
      stripeConnected: false,
    },
    album: r.album,
    duration: r.duration,
    coverArt: r.coverArt,
    audioUrl: r.audioUrl,
    genre: r.genre || (profile?.genres?.[0] ?? ""),
    playCount: r.rank || 0,
    isExplicit: r.isExplicit,
    source: "spotify",
    waveform: genWaveform(r.id.charCodeAt(4) % 20),
    releaseYear: 0,
    liked: false,
    spotifyId: r.spotifyId,
    needsResolve: r.needsResolve,
  }));

  const isCurrentArtistPlaying =
    state.status === "playing" &&
    artistTracks.some((t) => t.id === state.currentTrack?.id);

  const handleMainPlay = () => {
    if (isCurrentArtistPlaying) {
      pause();
    } else if (state.currentTrack && artistTracks.some((t) => t.id === state.currentTrack?.id)) {
      resume();
    } else if (artistTracks.length > 0) {
      playTrack(artistTracks[0], artistTracks);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="w-full h-72 rounded-2xl bg-[#181818]" />
        <div className="h-10 w-64 rounded-xl bg-[#181818]" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-[#181818]" />
          ))}
        </div>
      </div>
    );
  }

  const displayName = profile?.name || "Artist";
  const displayAvatar = profile?.avatarUrl || "";
  const displayCover = profile?.coverUrl || profile?.avatarUrl || "";
  const monthlyListeners = profile?.monthlyListeners || 0;
  const followers = profile?.followers || 0;
  const visibleTracks = showAll ? artistTracks : artistTracks.slice(0, 5);

  const currentArtistObj: Artist = {
    id: profile?.id || artistId,
    name: displayName,
    avatarUrl: displayAvatar,
    coverUrl: displayCover,
    bio: profile?.bio || "",
    isVerified: profile?.isVerified ?? true,
    totalPlays: 0,
    monthlyListeners,
    followers,
    genres: profile?.genres || [],
    stripeConnected: true,
  };

  const artistDonations = getArtistDonations(artistId);

  return (
    <div className="animate-fade-up pb-16">
      {/* Big Hero Banner */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden flex flex-col justify-end p-4 sm:p-8">
        {displayCover ? (
          <img
            src={displayCover}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#282828] to-[#121212]" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(18,18,18,0.7) 60%, #121212 100%)",
          }}
        />

        {/* Hero Meta */}
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold text-[#5EEAD4] bg-[#5EEAD4]/10 backdrop-blur-md border border-[#5EEAD4]/20 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 fill-[#5EEAD4] text-black" />
              Verified Artist
            </span>
            {profile?.worldRank && (
              <span className="text-[#a7a7a7] text-[11px] sm:text-xs font-semibold">
                #{profile.worldRank} in the world
              </span>
            )}
          </div>

          <h1 className="font-display font-900 text-3xl xs:text-5xl sm:text-7xl lg:text-8xl text-white tracking-tight leading-tight sm:leading-none drop-shadow-lg break-words">
            {displayName}
          </h1>

          <p className="text-xs sm:text-base text-[#e0e0e0] font-medium drop-shadow flex items-center gap-1.5 flex-wrap">
            {monthlyListeners > 0 ? (
              <span className="text-white font-semibold">{fmtNum(monthlyListeners)}</span>
            ) : null}
            {monthlyListeners > 0 ? " monthly listeners" : null}
            {followers > 0 && ` · ${fmtNum(followers)} followers`}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-3 sm:gap-4 flex-wrap">
        <button
          onClick={handleMainPlay}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5EEAD4] text-black shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
          title={isCurrentArtistPlaying ? "Pause" : "Play"}
        >
          {isCurrentArtistPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black" />
          ) : (
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black ml-0.5 sm:ml-1" />
          )}
        </button>

        <button
          onClick={() => setFollowed(!followed)}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-display font-bold text-xs tracking-wider uppercase transition-all cursor-pointer border ${
            followed
              ? "border-[#5EEAD4] text-[#5EEAD4] bg-[#5EEAD4]/10"
              : "border-white/30 text-white hover:border-white hover:scale-105"
          }`}
        >
          {followed ? (
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Following
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Follow
            </span>
          )}
        </button>

        {/* Tip / Support Button */}
        <button
          onClick={() => setShowDonate(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-[#5EEAD4] to-[#2DD4BF] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(94,234,212,0.3)]"
        >
          <Heart className="w-3.5 h-3.5 fill-black" />
          <span>Support Artist</span>
        </button>

        <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white transition-colors cursor-pointer">
          <MoreHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>


      {/* Main Content Area */}
      <div className="px-3 sm:px-8 space-y-8 sm:space-y-10">
        {/* Popular Tracks Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-2xl text-white">Popular</h2>
            <span className="text-xs text-[#5EEAD4] font-semibold bg-[#5EEAD4]/10 px-3 py-1 rounded-full border border-[#5EEAD4]/20">
              Full Length · 320kbps
            </span>
          </div>

          {artistTracks.length > 0 ? (
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#a7a7a7] uppercase tracking-wider border-b border-white/5 mb-1">
                <div className="w-6 text-center">#</div>
                <div className="w-10 flex-shrink-0" />
                <div className="flex-1">Title</div>
                <div className="hidden md:block w-1/4 pr-4">Album</div>
                <div className="flex items-center justify-end w-16">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-0.5">
                {visibleTracks.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i + 1} queue={artistTracks} />
                ))}
              </div>

              {artistTracks.length > 5 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-4 px-3 py-1 text-xs font-bold text-[#a7a7a7] hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {showAll ? "Show less" : "See more"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#a7a7a7]">No tracks available for this artist.</p>
          )}
        </section>

        {/* Genres */}
        {profile?.genres && profile.genres.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-lg text-white mb-3">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {profile.genres.map((g) => (
                <span
                  key={g}
                  className="px-3.5 py-1.5 rounded-full text-xs font-display font-semibold uppercase tracking-wider bg-[#181818] border border-white/10 text-[#5EEAD4]"
                >
                  {g}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* About Section */}
        {profile?.bio && (
          <section>
            <h2 className="font-display font-bold text-2xl text-white mb-4">About</h2>
            <div className="relative rounded-2xl overflow-hidden bg-[#181818] hover:bg-[#202020] transition-colors p-8 max-w-3xl border border-white/5 group cursor-pointer shadow-lg">
              {displayAvatar && (
                <div className="flex items-center gap-6 mb-6">
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-24 h-24 rounded-full object-cover shadow-2xl border-2 border-[#5EEAD4]/40"
                  />
                  <div>
                    <p className="text-2xl font-bold text-white mb-1">{displayName}</p>
                    {monthlyListeners > 0 && (
                      <p className="text-sm font-semibold text-[#5EEAD4]">
                        {monthlyListeners.toLocaleString()} monthly listeners
                      </p>
                    )}
                    {followers > 0 && (
                      <p className="text-xs text-[#a7a7a7] mt-0.5">
                        {followers.toLocaleString()} followers
                      </p>
                    )}
                  </div>
                </div>
              )}
              <p className="text-[#b3b3b3] text-sm leading-relaxed whitespace-pre-line font-medium">
                {profile.bio}
              </p>
            </div>
          </section>
        )}

        {/* Supporters Wall */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-2xl text-white">Recent Supporters</h2>
              <p className="text-xs text-[#a7a7a7] mt-0.5">Direct listener tips supporting this artist</p>
            </div>
            <button
              onClick={() => setShowDonate(true)}
              className="text-xs font-bold text-[#5EEAD4] hover:underline cursor-pointer"
            >
              + Send a Tip
            </button>
          </div>

          {artistDonations.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {artistDonations.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#181818] hover:bg-[#202020] p-4 rounded-2xl border border-white/5 transition-colors space-y-2.5 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {d.donorAvatar ? (
                      <img
                        src={d.donorAvatar}
                        alt={d.donorName}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#282828] text-white font-bold text-sm">
                        {d.donorName[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{d.donorName}</p>
                      <span className="text-[10px] font-semibold text-[#5EEAD4] flex items-center gap-1">
                        <span>{d.tierIcon || "💖"}</span>
                        <span>{d.tierTitle || "Patron"}</span>
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-display font-bold text-[#5EEAD4] text-sm">
                        ${(d.amountCents / 100).toFixed(2)}
                      </span>
                      <p className="text-[10px] text-[#a7a7a7]">{d.date}</p>
                    </div>
                  </div>
                  {d.message && (
                    <p className="text-xs text-[#d1d1d6] italic bg-[#242424] p-2.5 rounded-xl">
                      &ldquo;{d.message}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 flex items-center justify-between gap-4 max-w-xl">
              <div>
                <p className="text-sm font-bold text-white mb-0.5">Be the first to tip {displayName}!</p>
                <p className="text-xs text-[#a7a7a7]">
                  Help fuel their music production and earn a digital supporter badge.
                </p>
              </div>
              <button
                onClick={() => setShowDonate(true)}
                className="px-4 py-2 rounded-full font-display font-bold text-xs uppercase tracking-wider text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-md flex-shrink-0"
              >
                Tip Now
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Donation Modal */}
      {showDonate && (
        <DonationModal
          artist={currentArtistObj}
          onClose={() => setShowDonate(false)}
        />
      )}
    </div>
  );
}


