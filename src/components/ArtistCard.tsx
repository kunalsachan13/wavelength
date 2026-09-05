import { Artist } from "../types";
import { useNav } from "../store/useNavigation";
import { CheckCircle2 } from "lucide-react";

interface Props {
  artist: Artist;
}

function fmtListeners(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

export default function ArtistCard({ artist }: Props) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate({ id: "artist", artistId: artist.id })}
      className="group flex flex-col items-center gap-3 p-4 rounded-xl transition-all text-left bg-[#181818] hover:bg-[#282828] cursor-pointer shadow-md w-40 flex-shrink-0"
    >
      <div className="relative w-28 h-28">
        <img
          src={artist.avatarUrl}
          alt={artist.name}
          className="w-full h-full rounded-full object-cover bg-[#242424] transition-transform group-hover:scale-105 shadow-lg"
        />
        {artist.isVerified && (
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center bg-black/80 shadow-md"
            title="Verified artist"
          >
            <CheckCircle2 className="w-4 h-4 fill-[#5EEAD4] text-black" />
          </div>
        )}
      </div>
      <div className="text-center w-full min-w-0">
        <p className="text-sm font-display font-bold text-white leading-tight truncate">
          {artist.name}
        </p>
        <p className="text-xs text-[#a7a7a7] mt-1 font-medium truncate">
          {artist.monthlyListeners ? `${fmtListeners(artist.monthlyListeners)} listeners` : "Artist"}
        </p>
      </div>
    </button>
  );
}

