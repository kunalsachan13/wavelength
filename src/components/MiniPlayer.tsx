import React, { useState } from "react";
import { usePlayer, usePlayerProgress } from "../store/usePlayerStore";
import { useLibrary } from "../store/useLibraryStore";
import { useDonations } from "../store/useDonationStore";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  ListPlus,
  Sparkles,
} from "lucide-react";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MiniPlayer() {
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
    openNowPlaying,
  } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const { toggleLike, isLiked, openAddToPlaylist } = useLibrary();
  const { openDonationModal } = useDonations();

  const { currentTrack, status, volume, isMuted, isShuffled, repeatMode } = state;
  const [isHoveringBar, setIsHoveringBar] = useState(false);

  const isPlaying = status === "playing";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  // On mobile (<md), if no track is playing, hide the player so it doesn't take up space
  if (!currentTrack) {
    return (
      <footer className="hidden md:flex h-[84px] bg-[#000000] border-t border-white/5 px-4 items-center justify-between z-40 flex-shrink-0 select-none">
        <div className="flex items-center gap-3 opacity-40">
          <div className="w-14 h-14 rounded-md bg-[#181818] flex items-center justify-center text-white/30">
            <ListMusic className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">No track playing</p>
            <p className="text-xs text-[#b3b3b3]">Choose a track to stream</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="relative h-16 md:h-[84px] bg-[#000000] border-t border-white/5 px-3 sm:px-4 flex items-center justify-between z-40 flex-shrink-0 select-none transition-all"
    >
      {/* Mobile top progress line (2px) */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 md:hidden overflow-hidden">
        <div
          className="h-full bg-[#5EEAD4] transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ─── LEFT: TRACK INFO (flex on mobile, 30% on desktop) ─── */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 md:flex-initial md:w-[30%] min-w-0 pr-2">
        <div
          onClick={openNowPlaying}
          className="relative w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-md overflow-hidden flex-shrink-0 group cursor-pointer shadow-md bg-[#181818]"
        >
          <img
            src={currentTrack.coverArt}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="min-w-0 flex-1" onClick={openNowPlaying}>
          <p className="text-xs sm:text-sm font-semibold text-white truncate hover:underline cursor-pointer leading-snug">
            {currentTrack.title}
          </p>
          <p className="text-[11px] sm:text-xs text-[#b3b3b3] truncate mt-0.5 hover:underline cursor-pointer">
            {currentTrack.artist.name}
          </p>
        </div>

        {/* Tip Button */}
        <button
          onClick={() => openDonationModal(currentTrack.artist)}
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold bg-[#5EEAD4]/15 text-[#5EEAD4] border border-[#5EEAD4]/30 hover:bg-[#5EEAD4]/25 transition-all cursor-pointer flex-shrink-0 shadow-sm"
          title={`Tip / Donate to ${currentTrack.artist.name}`}
        >
          <Sparkles className="w-3.5 h-3.5 fill-[#5EEAD4]" />
          <span className="hidden sm:inline">Tip</span>
        </button>

        {/* Like Button */}
        <button
          onClick={() => toggleLike(currentTrack)}
          className="p-1.5 rounded-full hover:scale-110 active:scale-95 transition-all text-[#b3b3b3] hover:text-white cursor-pointer flex-shrink-0"
          style={{ color: liked ? "#5EEAD4" : undefined }}
          title={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
        >
          <Heart
            className="w-4 h-4"
            fill={liked ? "#5EEAD4" : "none"}
            strokeWidth={liked ? 0 : 2}
          />
        </button>

        {/* Add to Playlist Button */}
        <button
          onClick={() => openAddToPlaylist(currentTrack)}
          className="p-1.5 rounded-full hover:scale-110 active:scale-95 transition-all text-[#b3b3b3] hover:text-[#5EEAD4] cursor-pointer flex-shrink-0"
          title="Add to Playlist"
        >
          <ListPlus className="w-4 h-4" />
        </button>
      </div>

      {/* ─── MOBILE-ONLY QUICK CONTROLS (RIGHT on mobile, hidden on desktop) ─── */}
      <div className="flex items-center gap-2 md:hidden flex-shrink-0">
        <button
          onClick={next}
          className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          title="Next Track"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>

        <button
          onClick={isPlaying ? pause : resume}
          className="w-9 h-9 rounded-full bg-[#5EEAD4] text-black flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {status === "loading" ? (
            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-black text-black" />
          ) : (
            <Play className="w-4 h-4 fill-black text-black ml-0.5" />
          )}
        </button>
      </div>

      {/* ─── DESKTOP CENTER: CONTROLS & TIMELINE (40%, hidden on mobile) ─── */}
      <div className="hidden md:flex flex-col items-center gap-1.5 w-[40%] max-w-xl">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isShuffled ? "text-[#5EEAD4]" : "text-[#b3b3b3] hover:text-white"
            }`}
            title={isShuffled ? "Shuffle on" : "Shuffle off"}
          >
            <Shuffle className="w-4 h-4" strokeWidth={isShuffled ? 2.5 : 2} />
          </button>

          <button
            onClick={prev}
            className="p-1 text-[#b3b3b3] hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={isPlaying ? pause : resume}
            className="w-8 h-8 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-all cursor-pointer shadow-md"
            style={{
              backgroundColor: "#5EEAD4",
              boxShadow: "0 0 16px rgba(94, 234, 212, 0.3)",
            }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {status === "loading" ? (
              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            className="p-1 text-[#b3b3b3] hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              repeatMode !== "none" ? "text-[#5EEAD4]" : "text-[#b3b3b3] hover:text-white"
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === "one" ? (
              <Repeat1 className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <Repeat className="w-4 h-4" strokeWidth={repeatMode === "all" ? 2.5 : 2} />
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2.5 w-full text-[11px] text-[#b3b3b3] font-medium tabular-nums">
          <span className="w-9 text-right">{fmt(currentTime)}</span>
          <div
            onClick={handleSeek}
            onMouseEnter={() => setIsHoveringBar(true)}
            onMouseLeave={() => setIsHoveringBar(false)}
            className="flex-1 h-3 flex items-center cursor-pointer group relative"
          >
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden relative group-hover:h-1.5 transition-all">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${progress}%`,
                  backgroundColor: isHoveringBar ? "#5EEAD4" : "#ffffff",
                }}
              />
            </div>
            {/* Grab dot */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md pointer-events-none transition-opacity ${
                isHoveringBar ? "opacity-100" : "opacity-0"
              }`}
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <span className="w-9 text-left">{fmt(duration)}</span>
        </div>
      </div>

      {/* ─── DESKTOP RIGHT: VOLUME & UTILS (30%, hidden on mobile) ─── */}
      <div className="hidden md:flex items-center justify-end gap-3 w-[30%] min-w-0">
        <button
          onClick={() => openDonationModal(currentTrack.artist)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-black bg-[#5EEAD4] hover:bg-[#86efac] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md mr-1 flex-shrink-0"
          title={`Donate to ${currentTrack.artist.name}`}
        >
          <Sparkles className="w-3.5 h-3.5 fill-black" />
          <span>Donate</span>
        </button>

        <button
          onClick={openNowPlaying}
          className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          title="Lyrics & Now Playing"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 group">
          <button
            onClick={toggleMute}
            className="p-1 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <div className="w-24 h-3 flex items-center cursor-pointer relative">
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden group-hover:h-1.5 transition-all relative">
              <div
                className="h-full bg-white group-hover:bg-[#5EEAD4] transition-colors rounded-full"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>

        <button
          onClick={openNowPlaying}
          className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
          title="Fullscreen Player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}
