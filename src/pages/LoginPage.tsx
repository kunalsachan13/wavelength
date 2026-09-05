import { useState, useEffect, useRef } from "react";
import { useAuth, PRESET_AVATARS } from "../store/useAuthStore";
import { UserRole } from "../types";
import { Headphones, Sparkles, Music2, CheckCircle2, ArrowRight, Upload, Loader2 } from "lucide-react";
import { processAvatarImage } from "../utils/imageUpload";

const GENRE_TAGS = [
  "Electronic",
  "Synthwave",
  "Ambient",
  "Hip-Hop",
  "Indie",
  "Lo-Fi",
  "Pop",
  "Techno",
];

export default function LoginPage() {
  const { continueAsGuest } = useAuth();
  const [role, setRole] = useState<UserRole>("listener");
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [uploadedCustomAvatar, setUploadedCustomAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Electronic", "Synthwave"]);
  const [entered, setEntered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loginFileInputRef = useRef<HTMLInputElement>(null);

  // Animated particles background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; hue: number }[] = [];
    const N = 28;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.6,
        a: Math.random() * 0.4 + 0.1,
        hue: 174 + (Math.random() - 0.5) * 50,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},70%,65%,${p.a})`;
        ctx.fill();

        // Fast bounding-box checked connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          if (Math.abs(dx) > 100) continue;
          const dy = p.y - p2.y;
          if (Math.abs(dy) > 100) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 < 10000) {
            const d = Math.sqrt(d2);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(174,60%,65%,${(1 - d / 100) * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleRoleToggle = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "artist" && selectedAvatar === PRESET_AVATARS[0].url) {
      setSelectedAvatar(PRESET_AVATARS[1].url);
    }
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleLoginFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await processAvatarImage(file);
      setUploadedCustomAvatar(res.dataUrl);
      setSelectedAvatar(res.dataUrl);
    } catch (err: any) {
      alert(err?.message || "Failed to process photo");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleEnter = (overrideRole?: UserRole, overrideName?: string) => {
    const finalRole = overrideRole || role;
    const finalName = overrideName || name.trim() || (finalRole === "artist" ? "Apex Echo" : "Sound Explorer");
    setEntered(true);
    setTimeout(() => {
      continueAsGuest(finalName, finalRole, {
        avatarUrl: selectedAvatar,
        genres: selectedGenres,
        isVerified: finalRole === "artist",
      });
    }, 500);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen h-full overflow-y-auto overflow-x-hidden p-6 select-none"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none opacity-30 z-0"
      />

      {/* Ambient glow backgrounds */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 15%, rgba(94,234,212,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 30% 85%, rgba(139,92,246,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Main Container */}
      <div
        className="relative z-10 flex flex-col items-center w-full max-w-xl my-auto py-8"
        style={{
          animation: entered ? "fadeOutUp 0.5s ease-out forwards" : "fadeInUp 0.7s ease-out both",
        }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center mb-6">
          <div className="relative group">
            <div
              className="absolute -inset-2 rounded-3xl opacity-50 blur-xl transition-all group-hover:opacity-80"
              style={{
                background: "radial-gradient(circle, rgba(94,234,212,0.8) 0%, rgba(20,184,166,0.2) 70%)",
              }}
            />
            <img
              src="/logo.png"
              alt="Wavelength Logo"
              className="relative w-20 h-20 rounded-2xl object-cover shadow-2xl border border-teal-400/30 transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <h1 className="font-display font-900 text-3xl sm:text-4xl text-white tracking-tight leading-tight">
            Welcome to <span className="text-[#5EEAD4]">Wavelength</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#a7a7a7] max-w-sm">
            High-fidelity 320kbps streams · Direct artist support · Zero subscription gates
          </p>
        </div>

        {/* ─── Role Selection Switcher ─── */}
        <div className="w-full mb-6">
          <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-2.5 text-center">
            Choose your journey
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Listener Card */}
            <div
              onClick={() => handleRoleToggle("listener")}
              className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border text-left flex flex-col justify-between ${
                role === "listener"
                  ? "bg-[#181818] border-[#5EEAD4] shadow-[0_0_25px_rgba(94,234,212,0.18)] scale-[1.02]"
                  : "bg-[#121212] border-white/5 hover:border-white/20 hover:bg-[#161616]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${role === "listener" ? "bg-[#5EEAD4] text-black" : "bg-white/10 text-white"}`}>
                    <Headphones className="w-5 h-5" />
                  </div>
                  {role === "listener" && (
                    <CheckCircle2 className="w-5 h-5 text-[#5EEAD4]" />
                  )}
                </div>
                <h2 className="font-display font-bold text-base text-white">Listener</h2>
                <p className="text-xs text-[#a7a7a7] mt-1 leading-relaxed">
                  Stream 320kbps full tracks, curate your personal library, and tip your favorite creators.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-[#5EEAD4]">
                  320kbps Audio
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-[#a7a7a7]">
                  Unlimited Tips
                </span>
              </div>
            </div>

            {/* Artist Card */}
            <div
              onClick={() => handleRoleToggle("artist")}
              className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border text-left flex flex-col justify-between ${
                role === "artist"
                  ? "bg-[#181818] border-[#5EEAD4] shadow-[0_0_25px_rgba(94,234,212,0.18)] scale-[1.02]"
                  : "bg-[#121212] border-white/5 hover:border-white/20 hover:bg-[#161616]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${role === "artist" ? "bg-[#5EEAD4] text-black" : "bg-white/10 text-white"}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {role === "artist" && (
                    <CheckCircle2 className="w-5 h-5 text-[#5EEAD4]" />
                  )}
                </div>
                <h2 className="font-display font-bold text-base text-white">Artist & Creator</h2>
                <p className="text-xs text-[#a7a7a7] mt-1 leading-relaxed">
                  Upload audio, customize your verified profile, connect Stripe for 80% payouts, and view stats.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-[#5EEAD4]">
                  Verified Studio
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-[#a7a7a7]">
                  Stripe Payouts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Profile Setup Card ─── */}
        <div className="w-full bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl mb-6">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-1.5">
              {role === "artist" ? "Artist / Stage Name" : "Your Display Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnter()}
              placeholder={role === "artist" ? "e.g. Apex Echo, Synthwave Collective" : "e.g. Maya Chen, Sound Explorer"}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#71717a] bg-[#181818] border border-white/10 outline-none focus:border-[#5EEAD4] transition-all font-medium"
            />
          </div>

          {/* Quick Avatar Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider">
                Avatar Selection
              </label>
              <button
                type="button"
                onClick={() => loginFileInputRef.current?.click()}
                className="text-xs text-[#5EEAD4] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom</span>
              </button>
            </div>

            <input
              type="file"
              ref={loginFileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={handleLoginFileUpload}
            />

            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {/* Upload Tile */}
              <button
                type="button"
                onClick={() => loginFileInputRef.current?.click()}
                className={`relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 transition-all cursor-pointer border-2 flex flex-col items-center justify-center ${
                  uploadedCustomAvatar && selectedAvatar === uploadedCustomAvatar
                    ? "border-[#5EEAD4] scale-110 shadow-lg ring-2 ring-[#5EEAD4]/30"
                    : "border-dashed border-white/25 hover:border-[#5EEAD4] bg-[#181818] hover:bg-[#222]"
                }`}
                title="Upload image from your device"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#5EEAD4]" />
                ) : uploadedCustomAvatar && selectedAvatar === uploadedCustomAvatar ? (
                  <img src={uploadedCustomAvatar} alt="Custom" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-4 h-4 text-[#5EEAD4]" />
                    <span className="text-[8px] font-bold text-[#5EEAD4] uppercase leading-none mt-0.5">Upload</span>
                  </div>
                )}
              </button>

              {/* Illustrated Presets */}
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 transition-all cursor-pointer border-2 ${
                    selectedAvatar === av.url
                      ? "border-[#5EEAD4] scale-110 shadow-lg ring-2 ring-[#5EEAD4]/30"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  title={`${av.label} (${av.style})`}
                >
                  <img src={av.url} alt={av.label} className="w-full h-full object-cover bg-[#181818]" />
                </button>
              ))}
            </div>

            {uploadedCustomAvatar && selectedAvatar === uploadedCustomAvatar && (
              <p className="text-[11px] text-[#5EEAD4] mt-1.5 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Custom photo loaded and ready</span>
              </p>
            )}
          </div>

          {/* Favorite Genres Chips */}
          <div>
            <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-2">
              {role === "artist" ? "Primary Genres" : "Favorite Genres"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_TAGS.map((g) => {
                const active = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      active
                        ? "bg-[#5EEAD4]/15 border-[#5EEAD4] text-[#5EEAD4]"
                        : "bg-[#181818] border-white/5 text-[#a7a7a7] hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Submit CTA Button ─── */}
        <button
          onClick={() => handleEnter()}
          className="w-full py-4 rounded-full font-display font-bold text-base text-black bg-[#5EEAD4] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_30px_rgba(94,234,212,0.35)] flex items-center justify-center gap-2 mb-4"
        >
          <span>Enter Wavelength as {role === "artist" ? "Artist" : "Listener"}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* ─── Quick Demo 1-Click Launchers ─── */}
        <div className="flex items-center gap-3 w-full text-xs text-[#a7a7a7]">
          <button
            onClick={() => handleEnter("listener", "Maya (Listener)")}
            className="flex-1 py-2 rounded-full border border-white/10 hover:border-white/30 text-white transition-colors cursor-pointer bg-white/5"
          >
            Demo as Listener
          </button>
          <button
            onClick={() => handleEnter("artist", "Apex Echo")}
            className="flex-1 py-2 rounded-full border border-white/10 hover:border-white/30 text-[#5EEAD4] transition-colors cursor-pointer bg-white/5"
          >
            Demo as Artist
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeOutUp {
          to { opacity: 0; transform: translateY(-30px) scale(0.97); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

