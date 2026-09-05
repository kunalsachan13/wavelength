import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Track, Playlist } from "../types";

interface LibraryState {
  likedTracks: Track[];
  recentTracks: Track[];
  userPlaylists: Playlist[];
  playlists: Playlist[];
}

interface LibraryCtx extends LibraryState {
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
  clearLiked: () => void;
  addRecent: (track: Track) => void;
  clearRecent: () => void;
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  activePlaylistTrack: Track | null;
  openAddToPlaylist: (track: Track) => void;
  closeAddToPlaylist: () => void;
}

const STORAGE_KEYS = {
  LIKED: "wl_liked_tracks",
  RECENT: "wl_recent_tracks",
  PLAYLISTS: "wl_user_playlists",
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage disabled
  }
}

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "wl-playlist-favorites",
    name: "Favorite Anthems",
    description: "Your hand-picked top tracks and stellar discoveries",
    tracks: [],
    coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    isPublic: true,
    createdBy: "You",
  },
  {
    id: "wl-playlist-nightdrive",
    name: "Night Drive Vibes",
    description: "Moody synths, atmospheric basslines, and late night energy",
    tracks: [],
    coverArt: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    isPublic: true,
    createdBy: "You",
  },
];

const Ctx = createContext<LibraryCtx | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [likedTracks, setLikedTracks] = useState<Track[]>(() =>
    loadStorage<Track[]>(STORAGE_KEYS.LIKED, [])
  );
  const [recentTracks, setRecentTracks] = useState<Track[]>(() =>
    loadStorage<Track[]>(STORAGE_KEYS.RECENT, [])
  );
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(() =>
    loadStorage<Playlist[]>(STORAGE_KEYS.PLAYLISTS, DEFAULT_PLAYLISTS)
  );
  const [activePlaylistTrack, setActivePlaylistTrack] = useState<Track | null>(null);

  const openAddToPlaylist = useCallback((track: Track) => {
    setActivePlaylistTrack(track);
  }, []);

  const closeAddToPlaylist = useCallback(() => {
    setActivePlaylistTrack(null);
  }, []);

  // Sync to storage
  useEffect(() => {
    saveStorage(STORAGE_KEYS.LIKED, likedTracks);
  }, [likedTracks]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.RECENT, recentTracks);
  }, [recentTracks]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.PLAYLISTS, userPlaylists);
  }, [userPlaylists]);

  // Liked Tracks handlers
  const isLiked = useCallback(
    (trackId: string) => likedTracks.some((t) => t.id === trackId),
    [likedTracks]
  );

  const toggleLike = useCallback((track: Track) => {
    setLikedTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [{ ...track, liked: true }, ...prev];
      }
    });
  }, []);

  const clearLiked = useCallback(() => {
    setLikedTracks([]);
  }, []);

  // Recent Tracks handlers
  const addRecent = useCallback((track: Track) => {
    setRecentTracks((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      // Keep up to 50 recent items
      return [track, ...filtered].slice(0, 50);
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentTracks([]);
  }, []);

  // Playlist handlers
  const createPlaylist = useCallback((name: string, description = ""): Playlist => {
    const newPl: Playlist = {
      id: `user-pl-${Date.now()}`,
      name: name.trim() || "Untitled Playlist",
      description: description.trim(),
      tracks: [],
      coverArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
      isPublic: true,
      createdBy: "You",
    };
    setUserPlaylists((prev) => [newPl, ...prev]);
    return newPl;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setUserPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setUserPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.tracks.some((t) => t.id === track.id)) return pl;
        const updatedTracks = [...pl.tracks, track];
        return {
          ...pl,
          tracks: updatedTracks,
          coverArt: pl.tracks.length === 0 && track.coverArt ? track.coverArt : pl.coverArt,
        };
      })
    );
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setUserPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          tracks: pl.tracks.filter((t) => t.id !== trackId),
        };
      })
    );
  }, []);

  const getPlaylistById = useCallback(
    (playlistId: string) => userPlaylists.find((p) => p.id === playlistId),
    [userPlaylists]
  );

  return (
    <Ctx.Provider
      value={{
        likedTracks,
        recentTracks,
        userPlaylists,
        playlists: userPlaylists,
        activePlaylistTrack,
        openAddToPlaylist,
        closeAddToPlaylist,
        toggleLike,
        isLiked,
        clearLiked,
        addRecent,
        clearRecent,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        getPlaylistById,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }
  return ctx;
}
