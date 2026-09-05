import { useState, useRef, useEffect } from "react";
import { useNav } from "../store/useNavigation";
import { useAuth } from "../store/useAuthStore";
import {
  ChevronLeft,
  ChevronRight,
  User,
  UploadCloud,
  LayoutDashboard,
  Sparkles,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Headphones,
} from "lucide-react";

export default function TopBar() {
  const { page, navigate, history, back } = useNav();
  const { user, logout, switchRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canGoBack = history.length > 1;
  const isArtist = user.role === "artist";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 px-3 sm:px-6 flex items-center justify-between bg-[#121212]/90 backdrop-blur-md border-b border-white/5 select-none">
      {/* ─── Back / Forward History Navigation ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={back}
          disabled={!canGoBack}
          className={`w-8 h-8 rounded-full bg-black/60 flex items-center justify-center transition-all cursor-pointer ${
            canGoBack ? "text-white hover:bg-black/90 hover:scale-105" : "text-white/20 opacity-50 cursor-not-allowed"
          }`}
          title="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          disabled
          className="hidden sm:flex w-8 h-8 rounded-full bg-black/40 text-white/20 items-center justify-center cursor-not-allowed opacity-50"
          title="Go forward"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Current section breadcrumb pill on mobile */}
        <div className="flex lg:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-[#a7a7a7]">
          <img src="/logo.png" alt="Wavelength" className="w-3.5 h-3.5 rounded object-cover" />
          <span className="font-bold text-white capitalize text-[11px] truncate max-w-[90px]">
            {page.id === "home" ? "Discover" : page.id}
          </span>
        </div>

        {/* Desktop breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-[#a7a7a7] capitalize">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5EEAD4] animate-pulse" />
          <span>{page.id === "home" ? "Discover" : page.id}</span>
        </div>
      </div>

      {/* ─── Right: Actions & Profile ─── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isArtist && (
          <>
            <button
              onClick={() => navigate({ id: "upload" })}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#5EEAD4]" />
              <span>Upload</span>
            </button>

            <button
              onClick={() => navigate({ id: "dashboard" })}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#5EEAD4]" />
              <span>Studio</span>
            </button>
          </>
        )}

        {/* User profile dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 pr-2 sm:pr-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover shadow-sm border border-white/10"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#5EEAD4] text-black flex items-center justify-center font-bold text-xs shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <span className="text-xs font-bold text-white max-w-[75px] sm:max-w-[110px] truncate">
              {user.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#a7a7a7] transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#181818] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-slide-up space-y-1">
              {/* Header Info */}
              <div
                onClick={() => {
                  navigate({ id: "profile" });
                  setDropdownOpen(false);
                }}
                className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors flex items-center gap-3 border-b border-white/5 pb-3 mb-1"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#5EEAD4]/30"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate leading-tight">
                    {user.name}
                  </p>
                  <p className="text-xs text-[#a7a7a7] truncate">{user.handle}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#5EEAD4]">
                    {isArtist ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Artist Mode
                      </>
                    ) : (
                      <>
                        <Headphones className="w-3 h-3" />
                        Listener Mode
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <button
                onClick={() => {
                  navigate({ id: "profile" });
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <User className="w-4 h-4 text-[#5EEAD4]" />
                <span>View & Edit Profile</span>
              </button>

              <button
                onClick={() => {
                  switchRole(isArtist ? "listener" : "artist");
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Sparkles className="w-4 h-4 text-[#5EEAD4]" />
                <span>Switch to {isArtist ? "Listener Mode" : "Artist Studio"}</span>
              </button>

              {isArtist && (
                <>
                  <button
                    onClick={() => {
                      navigate({ id: "dashboard" });
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#5EEAD4]" />
                    <span>Artist Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate({ id: "upload" });
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <UploadCloud className="w-4 h-4 text-[#5EEAD4]" />
                    <span>Upload Track</span>
                  </button>
                </>
              )}

              <div className="h-px bg-white/5 my-1" />

              <button
                onClick={() => {
                  logout();
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

