import React, { useState, useEffect } from "react";
import { useNav } from "../store/useNavigation";
import { useAuth } from "../store/useAuthStore";
import { useLibrary } from "../store/useLibraryStore";
import { getSpotifyPlaylists } from "../services/musicApi";
import { SpotifyPlaylist, Page } from "../types";
import {
  Compass,
  Search as SearchIcon,
  Library as LibraryIcon,
  Plus,
  UploadCloud,
  LayoutDashboard,
  LogOut,
  ListMusic,
  Heart,
  Music,
  Search,
  X,
  User,
} from "lucide-react";

type LibraryFilter = "all" | "playlists" | "liked";

export default function Sidebar() {
  const { page, navigate } = useNav();
  const { userName, logout } = useAuth();
  const { userPlaylists, likedTracks, createPlaylist } = useLibrary();

  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);

  useEffect(() => {
    getSpotifyPlaylists()
      .then((data) => setSpotifyPlaylists(data.slice(0, 4)))
      .catch(() => {});
  }, []);

  const filteredUserPlaylists = userPlaylists.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className="hidden lg:flex flex-col w-[300px] xl:w-[320px] h-full gap-2 flex-shrink-0 select-none"
    >
      {/* ─── TOP CARD: LOGO & MAIN NAV ─── */}
      <div className="bg-[#121212] rounded-xl p-4 flex flex-col gap-4 shadow-md">
        {/* Brand header */}
        <button
          onClick={() => navigate({ id: "home" })}
          className="flex items-center gap-3 group cursor-pointer text-left px-1"
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-lg ring-1 ring-white/10 group-hover:ring-[#5EEAD4]/50 transition-all flex-shrink-0">
            <img src="/logo.png" alt="Wavelength Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-display font-800 text-lg tracking-tight text-white block leading-none group-hover:text-[#5EEAD4] transition-colors">
              Wavelength
            </span>
            <span className="text-[10px] text-[#a7a7a7] font-medium tracking-wider block mt-1 uppercase">
              SpotAPI Player
            </span>
          </div>
        </button>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => navigate({ id: "home" })}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors group cursor-pointer ${
              page.id === "home" ? "text-white" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <Compass
              className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                page.id === "home" ? "text-[#5EEAD4]" : "text-[#b3b3b3] group-hover:text-white"
              }`}
              strokeWidth={page.id === "home" ? 2.5 : 2}
            />
            <span>Discover</span>
          </button>

          <button
            onClick={() => navigate({ id: "search" })}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors group cursor-pointer ${
              page.id === "search" ? "text-white" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <SearchIcon
              className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                page.id === "search" ? "text-[#5EEAD4]" : "text-[#b3b3b3] group-hover:text-white"
              }`}
              strokeWidth={page.id === "search" ? 2.5 : 2}
            />
            <span>Search</span>
          </button>

          <button
            onClick={() => navigate({ id: "profile" })}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors group cursor-pointer ${
              page.id === "profile" ? "text-white" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <User
              className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                page.id === "profile" ? "text-[#5EEAD4]" : "text-[#b3b3b3] group-hover:text-white"
              }`}
              strokeWidth={page.id === "profile" ? 2.5 : 2}
            />
            <span>Profile</span>
          </button>
        </nav>
      </div>


      {/* ─── BOTTOM CARD: YOUR LIBRARY ─── */}
      <div className="bg-[#121212] rounded-xl flex-1 flex flex-col p-3 overflow-hidden shadow-md min-h-0">
        {/* Library Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <button
            onClick={() => navigate({ id: "library" })}
            className={`flex items-center gap-3 font-bold text-sm transition-colors cursor-pointer group ${
              page.id === "library" ? "text-white" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <LibraryIcon
              className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                page.id === "library" ? "text-[#5EEAD4]" : "text-[#b3b3b3] group-hover:text-white"
              }`}
              strokeWidth={2}
            />
            <span>Your Library</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const name = prompt("Enter new playlist name:") || "My Playlist";
                createPlaylist(name);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition-all cursor-pointer"
              title="Create playlist"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-1 mb-3 overflow-x-auto scrollbar-none pb-1">
          {(["all", "playlists", "liked"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer flex-shrink-0 ${
                filter === cat
                  ? "bg-white text-black font-bold"
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {cat === "all" ? "All" : cat === "liked" ? "Liked" : "Playlists"}
            </button>
          ))}
        </div>

        {/* Search inside Library */}
        <div className="px-1 mb-2 flex items-center justify-between">
          {showSearch ? (
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1 w-full border border-white/10">
              <Search className="w-3.5 h-3.5 text-[#a7a7a7]" />
              <input
                type="text"
                autoFocus
                placeholder="Search in Library"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-[#a7a7a7] outline-none flex-1"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="text-[#a7a7a7] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 rounded-full hover:bg-white/10 text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
              title="Search in Library"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Playlist & Liked Songs Scroll List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {/* Pinned Liked Songs item */}
          {(filter === "all" || filter === "liked") && (
            <button
              onClick={() => navigate({ id: "library" })}
              className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-all text-left cursor-pointer group ${
                page.id === "library" ? "bg-white/10" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-700 to-teal-400 shadow-md">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate group-hover:text-[#5EEAD4] transition-colors">
                  Liked Songs
                </p>
                <p className="text-xs text-[#a7a7a7] truncate mt-0.5">
                  Playlist • {likedTracks.length} {likedTracks.length === 1 ? "song" : "songs"}
                </p>
              </div>
            </button>
          )}

          {/* User Playlists */}
          {(filter === "all" || filter === "playlists") &&
            filteredUserPlaylists.map((pl) => {
              const active = page.id === "playlist" && page.playlistId === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => navigate({ id: "playlist", playlistId: pl.id })}
                  className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-all text-left cursor-pointer group ${
                    active ? "bg-white/10" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-[#181818] flex-shrink-0 shadow-sm relative ring-1 ring-white/5">
                    {pl.coverArt ? (
                      <img src={pl.coverArt} alt={pl.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <Music className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate transition-colors ${
                        active ? "text-[#5EEAD4]" : "text-white group-hover:text-[#5EEAD4]"
                      }`}
                    >
                      {pl.name}
                    </p>
                    <p className="text-xs text-[#a7a7a7] truncate mt-0.5">
                      Playlist • {pl.createdBy || "You"}
                    </p>
                  </div>
                </button>
              );
            })}

          {/* Spotify Playlists */}
          {filter === "all" &&
            spotifyPlaylists.map((pl) => {
              const active = page.id === "playlist" && page.playlistId === (pl.spotifyId || pl.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => navigate({ id: "playlist", playlistId: pl.spotifyId || pl.id })}
                  className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-all text-left cursor-pointer group ${
                    active ? "bg-white/10" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-[#181818] flex-shrink-0 shadow-sm relative ring-1 ring-white/5">
                    <img src={pl.coverArt} alt={pl.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate transition-colors ${
                        active ? "text-[#5EEAD4]" : "text-white group-hover:text-[#5EEAD4]"
                      }`}
                    >
                      {pl.title}
                    </p>
                    <p className="text-xs text-[#a7a7a7] truncate mt-0.5">
                      Playlist • Spotify
                    </p>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Bottom Studio & Profile Footer */}
        <div className="pt-2 mt-auto border-t border-white/5 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ id: "upload" })}
              className="p-2 rounded-lg hover:bg-white/5 text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
              title="Upload Track"
            >
              <UploadCloud className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate({ id: "dashboard" })}
              className="p-2 rounded-lg hover:bg-white/5 text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
              title="Artist Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#a7a7a7] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
