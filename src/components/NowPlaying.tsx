import { useState } from "react";
import { usePlayer, usePlayerProgress } from "../store/usePlayerStore";
import { useLibrary } from "../store/useLibraryStore";
import { useDonations } from "../store/useDonationStore";
import WaveformDisplay from "./WaveformDisplay";
import {
  ChevronDown,
  ListMusic,
  ListPlus,
  Shuffle,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Radio,
  Sparkles,
} from "lucide-react";

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function NowPlaying() {
  const {
    state,
    pause,
    resume,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    closeNowPlaying,
  } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const { toggleLike, isLiked, openAddToPlaylist } = useLibrary();
  const { openDonationModal } = useDonations();

  const { currentTrack, status, volume, isMuted, isShuffled, repeatMode } = state;
  const [showQueue, setShowQueue] = useState(false);
  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  if (!currentTrack) return null;

  const isPlaying = status === "playing";
  const progress = duration > 0 ? currentTime / duration : 0;

  const handleSeek = (p: number) => seek(p * duration);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-slide-up select-none"
      style={{ backgroundColor: "#0B0B0E" }}
    >
      {/* Blurred album art backdrop */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `url(${currentTrack.coverArt})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(80px) saturate(1.8)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: "rgba(11,11,14,0.75)" }} />

      <div className="relative z-10 flex flex-col h-full max-w-lg mx-auto w-full px-4 sm:px-6 py-2 sm:py-4 justify-between overflow-y-auto overscroll-contain scrollbar-none">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1 pb-2 sm:pb-4 flex-shrink-0">
          <button
            onClick={closeNowPlaying}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-wl-muted hover:text-wl-text transition-all cursor-pointer"
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="text-center">
            <span className="text-[10px] sm:text-[11px] font-display font-700 tracking-widest uppercase text-wl-muted block">
              Now Playing
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">
                Spotify High Quality 320kbps
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer"
            style={{
              backgroundColor: showQueue ? "rgba(94,234,212,0.15)" : "rgba(255,255,255,0.05)",
              color: showQueue ? "#5EEAD4" : "#8A8A8E",
            }}
          >
            <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {showQueue ? (
          /* Queue panel */
          <div className="flex-1 overflow-y-auto my-2 space-y-2 pr-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-wl-muted uppercase tracking-wider font-semibold">
                Playing Queue ({state.queue.length})
              </p>
            </div>
            {state.queue.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-2.5 rounded-2xl transition-colors"
                style={{
                  backgroundColor: i === state.queueIndex ? "rgba(94,234,212,0.08)" : "rgba(255,255,255,0.02)",
                  border: i === state.queueIndex ? "1px solid rgba(94,234,212,0.2)" : "1px solid transparent",
                }}
              >
                <img src={t.coverArt} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-wl-surface-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-wl-text truncate" style={{ color: i === state.queueIndex ? "#5EEAD4" : undefined }}>
                    {t.title}
                  </p>
                  <p className="text-xs text-wl-muted truncate">{t.artist.name}</p>
                </div>
                {i === state.queueIndex && (
                  <div className="flex items-end gap-[2px] h-3.5 flex-shrink-0">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className={`w-[2.5px] rounded-full wave-bar-${n}`}
                        style={{ height: "12px", backgroundColor: "#5EEAD4", transformOrigin: "bottom" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Main Now Playing View */
          <div className="flex-1 flex flex-col justify-between my-auto py-1">
            {/* Responsive Artwork: scales with viewport height/width */}
            <div className="flex items-center justify-center my-auto py-1 sm:py-2">
              <div className="relative group">
                <div
                  className="absolute -inset-3 sm:-inset-4 rounded-3xl opacity-30 blur-2xl transition-all"
                  style={{
                    backgroundImage: `url(${currentTrack.coverArt})`,
                    backgroundSize: "cover",
                  }}
                />
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.album}
                  className={`relative w-48 h-48 xs:w-56 xs:h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 max-h-[36vh] max-w-[75vw] aspect-square rounded-2xl sm:rounded-3xl object-cover shadow-2xl border border-white/10 ${isPlaying ? "animate-breathe" : ""}`}
                />
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold border border-emerald-500/40 text-emerald-400 bg-black/60 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                  <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 animate-pulse" />
                  Spotify Master
                </div>
              </div>
            </div>

            {/* Track Info & Like / Donate Button */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 mt-2 sm:mt-5 gap-2 sm:gap-3 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-1">
                <h2 className="font-display font-800 text-lg sm:text-2xl text-wl-text truncate leading-tight">
                  {currentTrack.title}
                </h2>
                <p className="text-xs sm:text-sm text-wl-muted truncate mt-0.5 sm:mt-1 font-medium">
                  {currentTrack.artist.name} {currentTrack.album ? `· ${currentTrack.album}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => openDonationModal(currentTrack.artist)}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 text-black font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title={`Tip / Donate to ${currentTrack.artist.name}`}
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span className="text-[11px] sm:text-xs">Donate</span>
                </button>

                <button
                  onClick={() => currentTrack && openAddToPlaylist(currentTrack)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-wl-muted hover:text-[#5EEAD4] transition-all cursor-pointer flex-shrink-0"
                  title="Add to Playlist"
                >
                  <ListPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  onClick={() => currentTrack && toggleLike(currentTrack)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex-shrink-0"
                  title={liked ? "Remove from Liked" : "Like"}
                >
                  <Heart
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-125"
                    style={{
                      color: liked ? "#5EEAD4" : "#8A8A8E",
                      fill: liked ? "#5EEAD4" : "none",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Waveform Visualizer */}
            <div className="mb-2 sm:mb-4 flex-shrink-0">
              <WaveformDisplay
                waveform={currentTrack.waveform}
                progress={progress}
                isPlaying={isPlaying}
                onSeek={handleSeek}
                height={42}
                barCount={56}
              />
              <div className="flex justify-between mt-1.5 text-[11px] text-wl-muted font-medium tabular-nums">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between my-1 sm:my-2 flex-shrink-0">
              <button
                onClick={toggleShuffle}
                style={{ color: isShuffled ? "#5EEAD4" : "#8A8A8E" }}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer"
                title={isShuffled ? "Shuffle on" : "Shuffle off"}
              >
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={isShuffled ? 2.5 : 2} />
              </button>

              <button
                onClick={prev}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-wl-text hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Previous"
              >
                <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              </button>

              <button
                onClick={isPlaying ? pause : resume}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #5EEAD4 0%, #14B8A6 100%)",
                  boxShadow: "0 0 30px rgba(94,234,212,0.4)",
                }}
                title={isPlaying ? "Pause" : "Play"}
              >
                {status === "loading" ? (
                  <span className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-wl-bg border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 text-wl-bg fill-current" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 text-wl-bg fill-current ml-1" />
                )}
              </button>

              <button
                onClick={next}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-wl-text hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Next"
              >
                <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              </button>

              <button
                onClick={toggleRepeat}
                style={{ color: repeatMode !== "none" ? "#5EEAD4" : "#8A8A8E" }}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer"
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                ) : (
                  <Repeat className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={repeatMode === "all" ? 2.5 : 2} />
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2.5 mt-2 sm:mt-4 mb-1 flex-shrink-0">
              <button
                onClick={toggleMute}
                className="text-wl-muted hover:text-wl-text transition-colors p-1 cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #5EEAD4 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(isMuted ? 0 : volume) * 100}%)`,
                  accentColor: "#5EEAD4",
                }}
              />
            </div>
          </div>
        )}

        <div className="pt-1 pb-1 sm:pb-2 text-center flex-shrink-0">
          <p className="text-[10px] sm:text-[11px] text-wl-muted/60 font-medium">
            Swipe down or tap arrow to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
