import { RemoteTrack, RemoteArtist, RemoteArtistProfile, SpotifyPlaylist } from "../types";

const BASE = "/api/music";

// ─── Stream Resolution ─────────────────────────────────────────────────────

const SAAVN_APIS = [
  "https://jiosaavn-api-black.vercel.app/api/search/songs?query=",
  "https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=",
];

const STREAM_CACHE = new Map<string, { url: string; ts: number }>();
const STREAM_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Resolve a full-length audio stream URL for a Spotify track.
 * Searches JioSaavn CDN for the highest quality match (320kbps).
 * Falls back to the backend /stream/resolve endpoint.
 */
export async function resolveAudioStream(title: string, artist: string): Promise<string> {
  const cacheKey = `${title.toLowerCase()}_${artist.toLowerCase()}`;
  const cached = STREAM_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < STREAM_CACHE_TTL) {
    return cached.url;
  }

  // 1. Direct JioSaavn search from frontend (fastest)
  for (const api of SAAVN_APIS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(api + encodeURIComponent(`${title} ${artist}`), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const results = data.data?.results || data.results || data.data;
        if (Array.isArray(results) && results.length > 0) {
          const song = results[0];
          let audioUrl = "";

          if (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
            const high =
              song.downloadUrl.find((d: any) => d.quality === "320kbps") ||
              song.downloadUrl.find((d: any) => d.quality === "160kbps") ||
              song.downloadUrl[song.downloadUrl.length - 1];
            audioUrl = high?.url || song.downloadUrl[0]?.url || "";
          } else if (typeof song.downloadUrl === "string" && song.downloadUrl) {
            audioUrl = song.downloadUrl;
          }

          if (audioUrl) {
            STREAM_CACHE.set(cacheKey, { url: audioUrl, ts: Date.now() });
            return audioUrl;
          }
        }
      }
    } catch {
      continue;
    }
  }

  // 2. Fallback: backend stream resolver
  try {
    const url = `${BASE}/stream/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
    const res = await fetch(url, { redirect: "follow" });
    if (res.ok && res.url && res.url !== url) {
      STREAM_CACHE.set(cacheKey, { url: res.url, ts: Date.now() });
      return res.url;
    }
  } catch {
    // silent
  }

  return "";
}


// ─── API Calls & In-Memory Response Caching ─────────────────────────────────

const MEMORY_CACHE = new Map<string, { data: any; exp: number }>();

function getCached<T>(key: string): T | null {
  const item = MEMORY_CACHE.get(key);
  if (item && item.exp > Date.now()) {
    return item.data as T;
  }
  return null;
}

function setCached<T>(key: string, data: T, ttlMs: number): T {
  MEMORY_CACHE.set(key, { data, exp: Date.now() + ttlMs });
  return data;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchTracks(
  query: string,
  limit = 20
): Promise<{ tracks: RemoteTrack[]; artists: RemoteArtist[]; playlists: SpotifyPlaylist[] }> {
  const cleanQ = query.trim().toLowerCase();
  const cacheKey = `search_${cleanQ}_${limit}`;
  const cached = getCached<{ tracks: RemoteTrack[]; artists: RemoteArtist[]; playlists: SpotifyPlaylist[] }>(cacheKey);
  if (cached) return cached;

  const q = encodeURIComponent(query);
  const data = await fetchJson<{
    tracks: RemoteTrack[];
    artists?: RemoteArtist[];
    playlists?: SpotifyPlaylist[];
    error?: string;
  }>(`${BASE}/spotify/search?q=${q}&limit=${limit}`);

  const res = {
    tracks: data.tracks ?? [],
    artists: data.artists ?? [],
    playlists: data.playlists ?? [],
  };
  return setCached(cacheKey, res, 180000); // 3 min cache
}

export async function getPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
  const cleanId = playlistId.replace(/^sp-playlist-/, "");
  const cacheKey = `playlist_${cleanId}`;
  const cached = getCached<SpotifyPlaylist>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchJson<{ playlist: SpotifyPlaylist }>(`${BASE}/playlist/${cleanId}`);
    const pl = data.playlist ?? null;
    if (pl) setCached(cacheKey, pl, 900000); // 15 min cache
    return pl;
  } catch {
    return null;
  }
}

export async function getTrack(id: string): Promise<RemoteTrack | null> {
  const cacheKey = `track_${id}`;
  const cached = getCached<RemoteTrack>(cacheKey);
  if (cached) return cached;

  try {
    const track = await fetchJson<RemoteTrack>(`${BASE}/spotify/track/${id}`);
    if (track) setCached(cacheKey, track, 900000);
    return track;
  } catch {
    return null;
  }
}

export interface ChartArtist {
  id: string;
  spotifyId?: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  position?: number;
  verified?: boolean;
}

export interface ChartAlbum {
  id: string;
  spotifyId?: string;
  title: string;
  artistName: string;
  coverArt: string;
  coverArtXl: string;
  year?: string;
}

export async function getChartTracks(limit = 20): Promise<RemoteTrack[]> {
  const cacheKey = `chart_tracks_${limit}`;
  const cached = getCached<RemoteTrack[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJson<{ tracks: RemoteTrack[] }>(`${BASE}/chart/tracks?limit=${limit}`);
  const tracks = data.tracks ?? [];
  return setCached(cacheKey, tracks, 600000); // 10 min cache
}

export async function getChartArtists(limit = 8): Promise<ChartArtist[]> {
  const cacheKey = `chart_artists_${limit}`;
  const cached = getCached<ChartArtist[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJson<{ artists: ChartArtist[] }>(`${BASE}/chart/artists?limit=${limit}`);
  const artists = data.artists ?? [];
  return setCached(cacheKey, artists, 900000); // 15 min cache
}

export async function getChartAlbums(limit = 8): Promise<ChartAlbum[]> {
  const cacheKey = `chart_albums_${limit}`;
  const cached = getCached<ChartAlbum[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJson<{ albums: ChartAlbum[] }>(`${BASE}/chart/albums?limit=${limit}`);
  const albums = data.albums ?? [];
  return setCached(cacheKey, albums, 900000); // 15 min cache
}

export async function getSpotifyPlaylists(): Promise<SpotifyPlaylist[]> {
  const cacheKey = "spotify_playlists";
  const cached = getCached<SpotifyPlaylist[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJson<{ playlists: SpotifyPlaylist[] }>(`${BASE}/playlists`);
  const playlists = data.playlists ?? [];
  return setCached(cacheKey, playlists, 900000); // 15 min cache
}

export async function getArtistProfile(artistId: string): Promise<RemoteArtistProfile | null> {
  const cleanId = artistId.replace(/^sp-artist-/, "").replace(/^dz-artist-/, "").replace(/^arc-artist-/, "");
  const cacheKey = `artist_profile_${cleanId}`;
  const cached = getCached<RemoteArtistProfile>(cacheKey);
  if (cached) return cached;

  try {
    const prof = await fetchJson<RemoteArtistProfile>(`${BASE}/artist/${cleanId}`);
    if (prof) setCached(cacheKey, prof, 900000);
    return prof;
  } catch {
    return null;
  }
}

export async function getArtistTopTracks(artistId: string, limit = 10): Promise<RemoteTrack[]> {
  const cleanId = artistId.replace(/^sp-artist-/, "").replace(/^dz-artist-/, "").replace(/^arc-artist-/, "");
  const cacheKey = `artist_top_${cleanId}_${limit}`;
  const cached = getCached<RemoteTrack[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJson<{ tracks: RemoteTrack[] }>(`${BASE}/artist/${cleanId}/top?limit=${limit}`);
  const tracks = data.tracks ?? [];
  return setCached(cacheKey, tracks, 900000);
}

export async function checkHealth(): Promise<{ ok: boolean; spotapi: boolean }> {
  try {
    const data = await fetchJson<{ status: string; spotapi?: boolean }>(`${BASE}/health`);
    return { ok: data.status === "ok", spotapi: data.spotapi ?? false };
  } catch {
    return { ok: false, spotapi: false };
  }
}

/**
 * Generate backend URL to download track as 320kbps MP3.
 */
export function getTrackDownloadUrl(title: string, artist: string, album = ""): string {
  return `${BASE}/stream/download?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`;
}

/**
 * Trigger browser download of a track in MP3 format.
 */
export function triggerMp3Download(title: string, artist: string, album = ""): void {
  const url = getTrackDownloadUrl(title, artist, album);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${artist ? `${artist} - ` : ""}${title}.mp3`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 100);
}


