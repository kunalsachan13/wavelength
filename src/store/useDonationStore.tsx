import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Donation, Artist } from "../types";
import { donations as initialMockDonations } from "../data/mockData";

export interface DonationTier {
  id: string;
  title: string;
  amountCents: number;
  icon: string;
  description: string;
  badgeName: string;
}

export const DONATION_TIERS: DonationTier[] = [
  {
    id: "tier-coffee",
    title: "Coffee Boost",
    amountCents: 300,
    icon: "☕",
    description: "Fuel late-night studio production sessions",
    badgeName: "Supporter",
  },
  {
    id: "tier-vinyl",
    title: "Vinyl Supporter",
    amountCents: 1000,
    icon: "💿",
    description: "Help cover mastering and audio engineering costs",
    badgeName: "Vinyl Patron",
  },
  {
    id: "tier-backstage",
    title: "Backstage VIP",
    amountCents: 2500,
    icon: "🎟️",
    description: "Fund new equipment and track production",
    badgeName: "VIP Patron",
  },
  {
    id: "tier-producer",
    title: "Executive Producer",
    amountCents: 5000,
    icon: "👑",
    description: "Be honored as a premier executive supporter",
    badgeName: "Executive Supporter",
  },
];

interface DonationContextType {
  donations: Donation[];
  activeDonationArtist: Artist | null;
  openDonationModal: (artist: Artist) => void;
  closeDonationModal: () => void;
  addDonation: (item: {
    artistId: string;
    artistName?: string;
    amountCents: number;
    message?: string;
    isPublic: boolean;
    donorName: string;
    donorAvatar?: string;
    tierTitle?: string;
    tierIcon?: string;
  }) => Donation;
  getArtistDonations: (artistId: string) => Donation[];
  getMyDonations: (donorName: string) => Donation[];
  getTotalArtistEarnings: (artistId: string) => number;
}

const DonationContext = createContext<DonationContextType | null>(null);

export function DonationProvider({ children }: { children: React.ReactNode }) {
  const [donations, setDonations] = useState<Donation[]>(() => {
    try {
      const saved = localStorage.getItem("wl-donations");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      /* ignore */
    }
    return initialMockDonations;
  });

  const [activeDonationArtist, setActiveDonationArtist] = useState<Artist | null>(null);

  const openDonationModal = useCallback((artist: Artist) => {
    setActiveDonationArtist(artist);
  }, []);

  const closeDonationModal = useCallback(() => {
    setActiveDonationArtist(null);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wl-donations", JSON.stringify(donations));
    } catch {
      /* ignore */
    }
  }, [donations]);

  const addDonation = (item: {
    artistId: string;
    artistName?: string;
    amountCents: number;
    message?: string;
    isPublic: boolean;
    donorName: string;
    donorAvatar?: string;
    tierTitle?: string;
    tierIcon?: string;
  }): Donation => {
    const newDonation: Donation = {
      id: `don-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: "Just now",
      ...item,
    };
    setDonations((prev) => [newDonation, ...prev]);
    return newDonation;
  };

  const getArtistDonations = (artistId: string) => {
    if (!artistId) return [];
    return (donations || []).filter(
      (d) => d && (d.artistId === artistId || (artistId === "me" && (!d.artistId || d.artistId === "me")))
    );
  };

  const getMyDonations = (donorName?: string) => {
    if (!donorName) return [];
    const target = donorName.trim().toLowerCase();
    return (donations || []).filter(
      (d) => d && (d.donorName || "").trim().toLowerCase() === target
    );
  };

  const getTotalArtistEarnings = (artistId: string) => {
    const artistDons = getArtistDonations(artistId);
    return artistDons.reduce((sum, d) => sum + d.amountCents, 0);
  };

  return (
    <DonationContext.Provider
      value={{
        donations,
        activeDonationArtist,
        openDonationModal,
        closeDonationModal,
        addDonation,
        getArtistDonations,
        getMyDonations,
        getTotalArtistEarnings,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
}

export function useDonations() {
  const ctx = useContext(DonationContext);
  if (!ctx) throw new Error("useDonations must be used within DonationProvider");
  return ctx;
}
