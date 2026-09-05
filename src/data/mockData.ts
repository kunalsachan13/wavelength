import { Artist, Track, Playlist, Donation } from "../types";

export function genWaveform(seed: number): number[] {
  return Array.from({ length: 60 }, (_, i) => {
    const t = i / 60;
    return Math.max(
      0.05,
      Math.min(
        0.95,
        0.5 +
          0.28 * Math.sin(t * Math.PI * (4 + (seed % 3))) +
          0.14 * Math.sin(t * Math.PI * (11 + (seed % 5))) +
          0.08 * Math.sin(t * Math.PI * (23 + (seed % 7)))
      )
    );
  });
}

// Logged-in artist account
export const CURRENT_USER_ARTIST: Artist = {
  id: "me",
  name: "Studio Artist",
  avatarUrl: "/avatars/avatar-2.svg",
  coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
  bio: "Ambient electronic producer crafting immersive soundscapes and modular synth textures.",
  isVerified: true,
  totalPlays: 184500,
  monthlyListeners: 42300,
  followers: 12800,
  genres: ["Electronic", "Ambient", "Synthwave"],
  stripeConnected: true,
  location: "Berlin, Germany",
};

export const artists: Artist[] = [];
export const tracks: Track[] = [];
export const playlists: Playlist[] = [];

export const donations: Donation[] = [
  {
    id: "don-1",
    donorName: "Elena Rostova",
    donorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    artistId: "me",
    amountCents: 2500,
    message: "Your new tracks inspire my whole studio workday. Thank you!",
    isPublic: true,
    date: "2 days ago",
  },
  {
    id: "don-2",
    donorName: "Marcus Vance",
    artistId: "me",
    amountCents: 5000,
    message: "Keep pushing the sonic boundaries!",
    isPublic: true,
    date: "1 week ago",
  },
];

export const dashboardData = {
  totalEarningsCents: 142500,
  pendingPayoutCents: 38400,
  allTimePlays: 184500,
  monthlyData: [
    { month: "Jan", plays: 18200, earningsCents: 14500 },
    { month: "Feb", plays: 24500, earningsCents: 19800 },
    { month: "Mar", plays: 31000, earningsCents: 24000 },
    { month: "Apr", plays: 28500, earningsCents: 22100 },
    { month: "May", plays: 39000, earningsCents: 31000 },
    { month: "Jun", plays: 43300, earningsCents: 35100 },
  ],
  topCountries: [
    { country: "United States", plays: 68400 },
    { country: "United Kingdom", plays: 34100 },
    { country: "Germany", plays: 22900 },
    { country: "Canada", plays: 18300 },
    { country: "Japan", plays: 14200 },
  ],
};
