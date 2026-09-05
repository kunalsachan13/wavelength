import { Playlist } from "../types";
import { usePlayer } from "../store/usePlayerStore";
import { Play, Music } from "lucide-react";

interface Props {
  playlist: Playlist;
  size?: "sm" | "md";
}

export default function PlaylistCard({ playlist, size = "md" }: Props) {
  const { playTrack } = usePlayer();

  const dim = size === "sm" ? "w-32 h-32" : "w-40 h-40";

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.tracks[0]) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  return (
    <div
      onClick={handlePlay}
      className="group flex flex-col p-4 rounded-xl transition-all duration-300 text-left bg-[#181818] hover:bg-[#282828] cursor-pointer shadow-md w-48 flex-shrink-0"
    >
      <div className={`${dim} mx-auto rounded-lg overflow-hidden bg-[#242424] relative flex-shrink-0 shadow-lg`}>
        {playlist.tracks.length >= 4 ? (
          <div className="grid grid-cols-2 w-full h-full">
            {playlist.tracks.slice(0, 4).map((t, i) => (
              <img key={i} src={t.coverArt} alt="" className="w-full h-full object-cover" />
            ))}
          </div>
        ) : playlist.tracks.length > 0 ? (
          <img src={playlist.coverArt} alt={playlist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#a7a7a7]">
            <Music className="w-10 h-10 opacity-40" />
          </div>
        )}

        {/* Hover slide-up Spotify play button */}
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#5EEAD4] text-black shadow-2xl flex items-center justify-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          title={`Play ${playlist.name}`}
        >
          <Play className="w-5 h-5 fill-black text-black ml-0.5" />
        </button>
      </div>

      <div className="mt-3 w-full min-w-0">
        <p className="text-sm font-display font-bold text-white truncate">{playlist.name}</p>
        <p className="text-xs text-[#a7a7a7] line-clamp-2 mt-1 font-medium leading-relaxed">
          {playlist.description || `${playlist.tracks.length} songs`}
        </p>
      </div>
    </div>
  );
}

