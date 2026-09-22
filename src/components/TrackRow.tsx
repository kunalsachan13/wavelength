import { useState, memo } from "react";
import { Track } from "../types";
import { usePlayer } from "../store/usePlayerStore";
import { useLibrary } from "../store/useLibraryStore";
import { useDonations } from "../store/useDonationStore";
import { triggerMp3Download } from "../services/musicApi";
import { Play, Pause, Heart, Sparkles, ListPlus, Download, Check, Loader2 } from "lucide-react";

interface Props {
  track: Track;
  index?: number;
  queue?: Track[];
  showAlbumArt?: boolean;
  showAlbumCol?: boolean;
  compact?: boolean;
}

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function TrackRow({
  track,
  index,
  queue,
  showAlbumArt = true,
  showAlbumCol = true,
  compact = false,
}: Props) {
  const { state, playTrack, pause, resume } = usePlayer();
  const { toggleLike, isLiked, openAddToPlaylist, addDownloaded, isDownloaded } = useLibrary();
  const { openDonationModal } = useDonations();
  const [hovered, setHovered] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const liked = isLiked(track.id);
  const downloaded = isDownloaded(track.id);
  const isCurrent = state.currentTrack?.id === track.id;
  const isPlaying = isCurrent && state.status === "playing";

  const handlePlay = () => {
    if (isCurrent) {
      isPlaying ? pause() : resume();
    } else {
      playTrack(track, queue ?? [track]);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    addDownloaded(track);
    triggerMp3Download(track.title, track.artist.name, track.album);
    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handlePlay}
      className={`group flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer select-none text-sm ${
        isCurrent
          ? "bg-white/10"
          : hovered
          ? "bg-white/[0.07]"
          : "bg-transparent"
      }`}
    >
      {/* Index or Play button */}
      <div className="w-6 text-center flex-shrink-0 flex items-center justify-center">
        {hovered || isPlaying ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="text-white hover:scale-110 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white text-white" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            )}
          </button>
        ) : isCurrent ? (
          <span className="flex items-center gap-0.5">
            {[1, 2, 3].map((bar) => (
              <span
                key={bar}
                className="w-0.5 bg-[#5EEAD4] rounded-full animate-pulse"
                style={{ height: `${8 + bar * 2}px`, animationDelay: `${bar * 0.15}s` }}
              />
            ))}
          </span>
        ) : index !== undefined ? (
          <span className="text-xs font-medium text-[#a7a7a7]">{index}</span>
        ) : null}
      </div>

      {/* Album Cover Art */}
      {showAlbumArt && (
        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#242424] shadow-sm">
          <img
            src={track.coverArt}
            alt={track.album}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title & Artist */}
      <div className="min-w-0 flex-1">
        <p
          className={`font-medium truncate leading-tight transition-colors ${
            isCurrent ? "text-[#5EEAD4]" : "text-white group-hover:text-white"
          }`}
        >
          {track.title}
          {track.isExplicit && (
            <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-white/10 text-[#a7a7a7] rounded uppercase tracking-wide font-bold align-middle">
              E
            </span>
          )}
        </p>
        <p className="text-xs text-[#a7a7a7] truncate mt-0.5 group-hover:text-white transition-colors">
          {track.artist.name}
        </p>
      </div>

      {/* Album column */}
      {showAlbumCol && !compact && track.album && (
        <div className="hidden md:block w-1/4 min-w-0 pr-4">
          <p className="text-xs text-[#a7a7a7] truncate group-hover:text-white transition-colors">
            {track.album}
          </p>
        </div>
      )}

      {/* Right controls: Tip + Heart + Duration */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Tip / Donate Artist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDonationModal(track.artist);
          }}
          className={`p-1.5 rounded-full transition-all cursor-pointer text-[#a7a7a7] hover:text-[#5EEAD4] hover:scale-110 active:scale-95 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
          title={`Tip / Donate to ${track.artist.name}`}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Add to Playlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openAddToPlaylist(track);
          }}
          className={`p-1.5 rounded-full transition-all cursor-pointer text-[#a7a7a7] hover:text-[#5EEAD4] hover:scale-110 active:scale-95 ${
            hovered ? "opacity-100" : "opacity-60 sm:opacity-0"
          }`}
          title="Add to Playlist"
        >
          <ListPlus className="w-4 h-4" />
        </button>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className={`p-1 rounded-full transition-all cursor-pointer ${
            liked
              ? "opacity-100 text-[#5EEAD4]"
              : hovered
              ? "opacity-100 text-[#a7a7a7] hover:text-white"
              : "opacity-60 sm:opacity-0"
          }`}
          title={liked ? "Remove from Liked" : "Like"}
        >
          <Heart
            className="w-4 h-4 hover:scale-110 active:scale-95 transition-transform"
            fill={liked ? "#5EEAD4" : "none"}
            strokeWidth={liked ? 0 : 2}
          />
        </button>

        {/* Download MP3 Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            downloaded
              ? "opacity-100 text-[#5EEAD4]"
              : hovered
              ? "opacity-100 text-[#a7a7a7] hover:text-[#5EEAD4] hover:scale-110 active:scale-95"
              : "opacity-60 sm:opacity-0 text-[#a7a7a7]"
          }`}
          title={
            downloading
              ? "Preparing MP3 download..."
              : downloaded
              ? "Downloaded as MP3 (Click to download again)"
              : "Download as MP3"
          }
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#5EEAD4]" />
          ) : downloaded ? (
            <Check className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        <span className="text-xs text-[#a7a7a7] font-medium tabular-nums w-10 text-right">
          {fmt(track.duration)}
        </span>
      </div>
    </div>
  );
}

export default memo(TrackRow);

