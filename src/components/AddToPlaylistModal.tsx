import React, { useState } from "react";
import { Track, Playlist } from "../types";
import { useLibrary } from "../store/useLibraryStore";
import {
  ListPlus,
  Plus,
  Check,
  X,
  Music,
  FolderPlus,
  CheckCircle2,
} from "lucide-react";

interface Props {
  track: Track;
  onClose: () => void;
}

export default function AddToPlaylistModal({ track, onClose }: Props) {
  const { userPlaylists, addTrackToPlaylist, removeTrackFromPlaylist, createPlaylist } = useLibrary();

  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleTrack = (playlist: Playlist) => {
    const isAlreadyIn = playlist.tracks.some((t) => t.id === track.id);
    if (isAlreadyIn) {
      removeTrackFromPlaylist(playlist.id, track.id);
      showToast(`Removed from "${playlist.name}"`);
    } else {
      addTrackToPlaylist(playlist.id, track);
      showToast(`Added to "${playlist.name}"`);
    }
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    const created = createPlaylist(trimmed);
    addTrackToPlaylist(created.id, track);
    setNewPlaylistName("");
    setShowCreate(false);
    showToast(`Created & added to "${created.name}"`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#5EEAD4] text-black text-xs font-display font-bold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Dialog */}
      <div className="relative z-10 w-full sm:max-w-md bg-[#181818] border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5EEAD4]/10 text-[#5EEAD4] flex items-center justify-center">
              <ListPlus className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">Add to Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Track Preview */}
        <div className="flex items-center gap-3 my-3 p-2.5 rounded-xl bg-[#242424] border border-white/5 flex-shrink-0">
          <img
            src={track.coverArt}
            alt={track.title}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-[#121212] shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{track.title}</p>
            <p className="text-xs text-[#a7a7a7] truncate mt-0.5">{track.artist.name}</p>
          </div>
        </div>

        {/* Create Playlist Section */}
        <div className="my-2 flex-shrink-0">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-white/20 text-[#a7a7a7] hover:text-white hover:border-[#5EEAD4] hover:bg-white/[0.02] transition-all text-xs font-semibold cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-[#5EEAD4]" />
              <span>Create New Playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="space-y-2.5 p-3 rounded-xl bg-[#202020] border border-white/10 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#a7a7a7] uppercase tracking-wider">New Playlist</span>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-xs text-[#a7a7a7] hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#5EEAD4] font-medium transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-4 py-2 rounded-lg bg-[#5EEAD4] text-black font-bold text-xs disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0 shadow"
                >
                  Create & Add
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 my-2 pr-1 scrollbar-thin">
          {userPlaylists.length === 0 ? (
            <div className="text-center py-8 text-[#a7a7a7] space-y-2">
              <Music className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">No playlists found. Create one above!</p>
            </div>
          ) : (
            userPlaylists.map((pl) => {
              const isAlreadyIn = pl.tracks.some((t) => t.id === track.id);
              return (
                <div
                  key={pl.id}
                  onClick={() => handleToggleTrack(pl)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isAlreadyIn
                      ? "bg-[#5EEAD4]/10 border-[#5EEAD4]/30 hover:bg-[#5EEAD4]/15"
                      : "bg-[#202020] border-transparent hover:bg-[#282828] hover:border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#242424] flex items-center justify-center">
                      {pl.coverArt ? (
                        <img src={pl.coverArt} alt={pl.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-4 h-4 text-[#a7a7a7]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isAlreadyIn ? "text-[#5EEAD4]" : "text-white"}`}>
                        {pl.name}
                      </p>
                      <p className="text-[11px] text-[#a7a7a7] truncate mt-0.5">
                        {pl.tracks.length} {pl.tracks.length === 1 ? "track" : "tracks"}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Indicator Button */}
                  <div className="flex-shrink-0 ml-3">
                    {isAlreadyIn ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#5EEAD4] text-black shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Added</span>
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-white/5 text-[#a7a7a7] hover:bg-[#5EEAD4] hover:text-black flex items-center justify-center transition-all">
                        <Plus className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Done Button */}
        <div className="pt-3 border-t border-white/5 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-full font-bold text-xs bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
