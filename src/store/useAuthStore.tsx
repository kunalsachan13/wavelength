import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { UserProfile, UserRole } from "../types";

export const PRESET_AVATARS = [
  {
    id: "avatar-1",
    label: "Cyber DJ",
    url: "/avatars/avatar-1.svg",
    style: "Bottts",
  },
  {
    id: "avatar-2",
    label: "Synth Producer",
    url: "/avatars/avatar-2.svg",
    style: "Adventurer",
  },
  {
    id: "avatar-3",
    label: "Neon Vocalist",
    url: "/avatars/avatar-3.svg",
    style: "Lorelei",
  },
  {
    id: "avatar-4",
    label: "Vinyl Collector",
    url: "/avatars/avatar-4.svg",
    style: "Notionists",
  },
  {
    id: "avatar-5",
    label: "Lo-Fi Beats",
    url: "/avatars/avatar-5.svg",
    style: "Micah",
  },
  {
    id: "avatar-6",
    label: "Techno Grid",
    url: "/avatars/avatar-6.svg",
    style: "Bottts",
  },
  {
    id: "avatar-7",
    label: "Indie Acoustic",
    url: "/avatars/avatar-7.svg",
    style: "Personas",
  },
  {
    id: "avatar-8",
    label: "Electric Pulse",
    url: "/avatars/avatar-8.svg",
    style: "Adventurer",
  },
  {
    id: "avatar-9",
    label: "Sound Alchemist",
    url: "/avatars/avatar-9.svg",
    style: "Lorelei",
  },
  {
    id: "avatar-10",
    label: "Pixel Maestro",
    url: "/avatars/avatar-10.svg",
    style: "Bottts",
  },
];

export function generateRandomIllustration(seed?: string): string {
  const styles = ["bottts", "adventurer", "lorelei", "notionists", "micah", "personas"];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomSeed = seed || Math.random().toString(36).substring(2, 9);
  const bgColors = ["0f766e", "3b0764", "7c2d12", "064e3b", "1e1b4b", "1e3a8a", "4c1d95", "881337"];
  const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}&backgroundColor=${randomBg}`;
}

export const PRESET_BANNERS = [
  {
    id: "banner-1",
    label: "Obsidian Teal",
    gradient: "linear-gradient(135deg, #0d3331 0%, #121212 85%)",
  },
  {
    id: "banner-2",
    label: "Cyber Violet",
    gradient: "linear-gradient(135deg, #3b0764 0%, #121212 85%)",
  },
  {
    id: "banner-3",
    label: "Neon Sunset",
    gradient: "linear-gradient(135deg, #431407 0%, #121212 85%)",
  },
  {
    id: "banner-4",
    label: "Electric Ocean",
    gradient: "linear-gradient(135deg, #083344 0%, #121212 85%)",
  },
  {
    id: "banner-5",
    label: "Obsidian Emerald",
    gradient: "linear-gradient(135deg, #064e3b 0%, #121212 85%)",
  },
];

export const DEFAULT_PROFILE: UserProfile = {
  role: "listener",
  name: "Listener",
  handle: "@listener",
  avatarUrl: PRESET_AVATARS[0].url,
  bannerGradient: PRESET_BANNERS[0].gradient,
  bio: "Music enthusiast streaming 320kbps full-fidelity tracks and discovering underground sounds on Wavelength.",
  genres: ["Electronic", "Synthwave", "Ambient", "Indie"],
  location: "Global",
  website: "",
  isVerified: false,
  supporterBadge: undefined,
  totalDonatedCents: 0,
};

interface AuthCtx {
  isAuthenticated: boolean;
  user: UserProfile;
  userName: string;
  continueAsGuest: (
    name?: string,
    role?: UserRole,
    initialData?: Partial<UserProfile>
  ) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("wl-auth-v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isAuthenticated);
      }
    } catch {
      /* ignore */
    }
    return false;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("wl-auth-v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) {
          let avatarUrl = parsed.user.avatarUrl;
          // Auto-migrate legacy Unsplash realistic photos to modern illustrated avatars
          if (avatarUrl && avatarUrl.includes("images.unsplash.com")) {
            avatarUrl = parsed.user.role === "artist" ? PRESET_AVATARS[1].url : PRESET_AVATARS[0].url;
          }
          return { ...DEFAULT_PROFILE, ...parsed.user, avatarUrl };
        }
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_PROFILE;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "wl-auth-v2",
        JSON.stringify({ isAuthenticated, user })
      );
    } catch {
      /* ignore */
    }
  }, [isAuthenticated, user]);

  const continueAsGuest = useCallback(
    (name?: string, role: UserRole = "listener", initialData?: Partial<UserProfile>) => {
      const finalName = name?.trim() || (role === "artist" ? "New Wave Producer" : "Sound Explorer");
      const cleanHandle = `@${finalName.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}`;
      
      const nextUser: UserProfile = {
        ...DEFAULT_PROFILE,
        role,
        name: finalName,
        handle: cleanHandle,
        isVerified: role === "artist",
        bio:
          role === "artist"
            ? "Electronic sound sculptor and producer crafting evocative sonic textures."
            : DEFAULT_PROFILE.bio,
        avatarUrl: role === "artist" ? PRESET_AVATARS[1].url : PRESET_AVATARS[0].url,
        ...initialData,
      };

      setUser(nextUser);
      setIsAuthenticated(true);
    },
    []
  );

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...updates,
      // If name changed but handle was default, auto update handle if appropriate
      handle: updates.handle
        ? updates.handle.startsWith("@")
          ? updates.handle
          : `@${updates.handle}`
        : prev.handle,
    }));
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUser((prev) => ({
      ...prev,
      role,
      isVerified: role === "artist" ? true : prev.isVerified,
    }));
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(DEFAULT_PROFILE);
    try {
      localStorage.removeItem("wl-auth-v2");
      localStorage.removeItem("wl-auth");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Ctx.Provider
      value={{
        isAuthenticated,
        user,
        userName: user.name,
        continueAsGuest,
        updateProfile,
        switchRole,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}

