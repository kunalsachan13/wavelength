export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  isVerified: boolean;
  totalPlays: number;
  monthlyListeners: number;
  followers: number;
  genres: string[];
  stripeConnected: boolean;
  tipGoal?: { label: string; targetCents: number; currentCents: number };
  location?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: Artist;
  album: string;
  duration: number;
  coverArt: string;
  audioUrl: string;
  genre: string;
  playCount: number;
  isExplicit: boolean;
  source: "native" | "spotify";
  waveform: number[];
  releaseYear: number;
  liked: boolean;
  spotifyId?: string;
  needsResolve?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  coverArt: string;
  isPublic: boolean;
  createdBy: string;
}

export interface SpotifyPlaylist {
  id: string;
  spotifyId: string;
  title: string;
  description: string;
  badge: string;
  coverArt: string;
  trackCount: number;
  tracks: RemoteTrack[];
  owner?: string;
}

export interface Donation {
  id: string;
  donorName: string;
  donorAvatar?: string;
  artistId: string;
  artistName?: string;
  amountCents: number;
  message?: string;
  isPublic: boolean;
  date: string;
  tierTitle?: string;
  tierIcon?: string;
}

export type UserRole = "listener" | "artist";

export interface UserProfile {
  role: UserRole;
  name: string;
  handle: string;
  avatarUrl: string;
  bannerUrl?: string;
  bannerGradient?: string;
  bio: string;
  genres: string[];
  location?: string;
  website?: string;
  isVerified?: boolean;
  supporterBadge?: string;
  totalDonatedCents: number;
  socials?: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
}

export type Page =
  | { id: "login" }
  | { id: "home" }
  | { id: "search" }
  | { id: "library" }
  | { id: "artist"; artistId: string }
  | { id: "playlist"; playlistId: string }
  | { id: "upload" }
  | { id: "dashboard" }
  | { id: "profile" };

export type PlayerStatus = "idle" | "playing" | "paused" | "loading";

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
  showNowPlaying: boolean;
}

export interface RemoteTrack {
  id: string;
  spotifyId?: string;
  title: string;
  artistName: string;
  artistId: string;
  artistAvatar: string;
  album: string;
  coverArt: string;
  durationMs: number;
  duration: number;
  previewUrl: string;
  audioUrl: string;
  isExplicit: boolean;
  source: "spotify";
  rank: number;
  needsResolve?: boolean;
  genre?: string;
}

export interface RemoteArtist {
  id: string;
  spotifyId?: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  verified?: boolean;
}

export interface RemoteArtistProfile {
  id: string;
  spotifyId: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  isVerified: boolean;
  monthlyListeners: number;
  followers: number;
  worldRank?: number;
  genres: string[];
  topTracks: RemoteTrack[];
}
