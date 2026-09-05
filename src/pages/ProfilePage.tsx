import { useState, useRef } from "react";
import { useAuth, PRESET_AVATARS, PRESET_BANNERS, generateRandomIllustration } from "../store/useAuthStore";
import { useLibrary } from "../store/useLibraryStore";
import { useDonations } from "../store/useDonationStore";
import { useNav } from "../store/useNavigation";
import { processAvatarImage } from "../utils/imageUpload";
import {
  Edit3,
  Camera,
  CheckCircle2,
  Headphones,
  Sparkles,
  Heart,
  Music2,
  DollarSign,
  Share2,
  Globe,
  Instagram,
  Twitter,
  ArrowRight,
  ShieldCheck,
  Award,
  X,
  Plus,
  Upload,
  Dices,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

const ALL_GENRES = [
  "Electronic",
  "Synthwave",
  "Ambient",
  "Hip-Hop",
  "Lo-Fi",
  "Indie",
  "Techno",
  "Pop",
  "Rock",
  "Jazz",
  "R&B",
  "Classical",
];

export default function ProfilePage() {
  const { user, updateProfile, switchRole } = useAuth();
  const { likedTracks = [], userPlaylists = [] } = useLibrary();
  const { getMyDonations, getArtistDonations } = useDonations();
  const { navigate } = useNav();

  const safeUser = user || {
    role: "listener" as const,
    name: "Listener",
    handle: "@listener",
    avatarUrl: PRESET_AVATARS[0].url,
    bannerGradient: PRESET_BANNERS[0].gradient,
    bio: "",
    genres: [],
    location: "",
    website: "",
    totalDonatedCents: 0,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(safeUser.name || "Listener");
  const [editHandle, setEditHandle] = useState((safeUser.handle || "@listener").replace(/^@/, ""));
  const [editBio, setEditBio] = useState(safeUser.bio || "");
  const [editAvatar, setEditAvatar] = useState(safeUser.avatarUrl || PRESET_AVATARS[0].url);
  const [editBanner, setEditBanner] = useState(safeUser.bannerGradient || PRESET_BANNERS[0].gradient);
  const [editGenres, setEditGenres] = useState<string[]>(safeUser.genres || []);
  const [editLocation, setEditLocation] = useState(safeUser.location || "");
  const [editWebsite, setEditWebsite] = useState(safeUser.website || "");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");

  // Avatar customization & upload sub-state
  const [avatarTab, setAvatarTab] = useState<"illustrations" | "upload" | "url">("illustrations");
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; sizeKb: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [heroNotification, setHeroNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const myDonations = getMyDonations(safeUser.name);
  const artistDonations = getArtistDonations("me");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim() || user.name,
      handle: editHandle.trim() || user.handle,
      bio: editBio,
      avatarUrl: customAvatarUrl.trim() || editAvatar,
      bannerGradient: editBanner,
      genres: editGenres,
      location: editLocation,
      website: editWebsite,
    });
    setIsEditing(false);
  };

  const handleModalFileUpload = async (file: File) => {
    setUploadError(null);
    setIsProcessingFile(true);
    try {
      const res = await processAvatarImage(file);
      setCustomAvatarUrl(res.dataUrl);
      setUploadedFileInfo({ name: res.fileName, sizeKb: res.fileSizeKb });
    } catch (err: any) {
      setUploadError(err?.message || "Failed to process image file");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleHeroDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await processAvatarImage(file);
      updateProfile({ avatarUrl: res.dataUrl });
      setHeroNotification("Avatar photo updated!");
      setTimeout(() => setHeroNotification(null), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to upload avatar image");
    } finally {
      e.target.value = "";
    }
  };

  const handleRollRandomIllustration = () => {
    const randomUrl = generateRandomIllustration();
    setEditAvatar(randomUrl);
    setCustomAvatarUrl("");
    setUploadedFileInfo(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleModalFileUpload(file);
    }
  };

  const toggleGenre = (genre: string) => {
    setEditGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isArtist = user.role === "artist";

  return (
    <div className="animate-fade-up pb-16">
      {/* Quick feedback notification */}
      {heroNotification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#5EEAD4] text-black font-display font-bold text-xs shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{heroNotification}</span>
        </div>
      )}

      {/* ─── Profile Hero Banner ─── */}
      <div
        className="relative min-h-[220px] h-auto sm:h-80 w-full overflow-hidden flex flex-col justify-end p-4 sm:p-8 transition-all"
        style={{ background: user.bannerGradient || PRESET_BANNERS[0].gradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(18,18,18,0.7) 65%, #121212 100%)",
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 pt-6 sm:pt-0">
          {/* Avatar with hover edit overlay + direct file picker */}
          <div className="relative group flex-shrink-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl border-4 border-[#121212] group-hover:opacity-90 transition-opacity bg-[#242424]"
            />
            <input
              type="file"
              ref={heroFileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={handleHeroDirectUpload}
            />
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1.5 p-2 text-center">
              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#5EEAD4] text-black text-[11px] font-bold hover:scale-105 transition-transform cursor-pointer shadow"
                title="Upload image from computer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-[#a7a7a7] hover:text-white font-semibold underline cursor-pointer"
              >
                Customize
              </button>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                  isArtist
                    ? "bg-[#5EEAD4]/15 text-[#5EEAD4] border border-[#5EEAD4]/30"
                    : "bg-white/10 text-white border border-white/15"
                }`}
              >
                {isArtist ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 fill-[#5EEAD4] text-black" />
                    Verified Artist
                  </>
                ) : (
                  <>
                    <Headphones className="w-3.5 h-3.5 text-[#5EEAD4]" />
                    Music Listener
                  </>
                )}
              </span>

              {user.supporterBadge && (
                <span className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <Award className="w-3.5 h-3.5" />
                  {user.supporterBadge}
                </span>
              )}

              {user.location && (
                <span className="text-xs text-[#a7a7a7] font-medium">{user.location}</span>
              )}
            </div>

            <h1 className="font-display font-900 text-2xl xs:text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight break-words">
              {user.name}
            </h1>

            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#a7a7a7] font-medium flex-wrap">
              <span className="text-[#5EEAD4] font-semibold">{user.handle}</span>
              <span>·</span>
              {isArtist ? (
                <>
                  <span>42.3K monthly listeners</span>
                  <span>·</span>
                  <span>12.8K followers</span>
                </>
              ) : (
                <>
                  <span>{(likedTracks || []).length} Liked Songs</span>
                  <span>·</span>
                  <span>{(userPlaylists || []).length} Playlists</span>
                  {myDonations.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-300 font-semibold">
                        {myDonations.length} Artist Tips Sent
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Action Bar ─── */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-2.5 sm:gap-3 flex-wrap border-b border-white/5">
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </button>

        <button
          onClick={() => switchRole(isArtist ? "listener" : "artist")}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider text-white border border-white/20 hover:border-white hover:scale-105 active:scale-95 transition-all cursor-pointer bg-white/5"
          title="Toggle between Listener & Artist Studio persona"
        >
          <Sparkles className="w-4 h-4 text-[#5EEAD4]" />
          <span>Switch to {isArtist ? "Listener" : "Artist"}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold text-[#a7a7a7] hover:text-white border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? "Copied!" : "Share Profile"}</span>
        </button>

        {isArtist && (
          <button
            onClick={() => navigate({ id: "dashboard" })}
            className="sm:ml-auto flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold text-[#5EEAD4] bg-[#5EEAD4]/10 hover:bg-[#5EEAD4]/20 border border-[#5EEAD4]/20 transition-all cursor-pointer"
          >
            <span>Open Creator Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10 max-w-6xl">
        {/* Bio & About */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4 shadow-md">
            <h2 className="text-xs font-bold text-[#a7a7a7] uppercase tracking-wider">About</h2>
            <p className="text-sm sm:text-base text-[#d1d1d6] leading-relaxed whitespace-pre-line font-medium">
              {user.bio || "No bio added yet. Click 'Edit Profile' to share your musical tastes!"}
            </p>

            {user.genres && user.genres.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-2.5">
                  {isArtist ? "Musical Styles" : "Favorite Genres"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.genres.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#242424] text-[#5EEAD4] border border-white/5"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats / Info card */}
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4 shadow-md flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-3">
                {isArtist ? "Creator Status" : "Listening Stats"}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-[#a7a7a7]">Audio Fidelity</span>
                  <span className="text-emerald-400 font-semibold">320kbps Master</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-[#a7a7a7]">Account Type</span>
                  <span className="text-white font-semibold capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-[#a7a7a7]">Library Tracks</span>
                  <span className="text-white font-semibold">{likedTracks.length}</span>
                </div>
                {user.website && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#a7a7a7]">Website</span>
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#5EEAD4] hover:underline truncate max-w-[140px]"
                    >
                      {user.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#5EEAD4]/10 to-transparent border border-[#5EEAD4]/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#5EEAD4] flex-shrink-0" />
              <p className="text-xs text-[#a7a7a7] leading-snug">
                Verified Wavelength Account · No ads, full-length playback.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Donations / Supporter Wall Section ─── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-2xl text-white">
                {isArtist ? "Supporters & Fan Tips" : "Artists You've Supported"}
              </h2>
              <p className="text-xs text-[#a7a7a7] mt-0.5">
                {isArtist
                  ? "Direct tips received from listeners through Stripe"
                  : "Direct appreciation sent to independent creators"}
              </p>
            </div>
          </div>

          {(isArtist ? artistDonations : myDonations).length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isArtist ? artistDonations : myDonations).map((d) => (
                <div
                  key={d.id}
                  className="bg-[#181818] hover:bg-[#202020] p-5 rounded-2xl border border-white/5 transition-colors space-y-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {d.donorAvatar ? (
                      <img
                        src={d.donorAvatar}
                        alt={d.donorName || "Donor"}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#282828] text-white font-bold text-sm">
                        {d.donorName ? d.donorName.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{d.donorName}</p>
                      <span className="text-[10px] font-semibold text-[#5EEAD4] flex items-center gap-1">
                        <span>{d.tierIcon || "💖"}</span>
                        <span>{d.tierTitle || "Artist Supporter"}</span>
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-display font-bold text-[#5EEAD4] text-sm">
                        ${(d.amountCents / 100).toFixed(2)}
                      </span>
                      <p className="text-[10px] text-[#a7a7a7]">{d.date}</p>
                    </div>
                  </div>

                  {d.message && (
                    <p className="text-xs text-[#d1d1d6] italic bg-[#242424] p-3 rounded-xl">
                      &ldquo;{d.message}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#181818] border border-white/5 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#5EEAD4]/10 text-[#5EEAD4] flex items-center justify-center mx-auto">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-white font-bold text-sm">No tips recorded yet</p>
              <p className="text-xs text-[#a7a7a7]">
                {isArtist
                  ? "Share your music with listeners to start receiving fan support."
                  : "Support your favorite artists by clicking the 'Support' button on their profile."}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ─── Edit Profile Modal ─── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsEditing(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-[#181818] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-display font-bold text-xl text-white">Customize Profile</h3>
                <p className="text-xs text-[#a7a7a7]">Update your identity, visual style, and preferences</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Display Name & Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#5EEAD4] font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-1.5">
                    Handle
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs text-[#a7a7a7]">@</span>
                    <input
                      type="text"
                      value={editHandle}
                      onChange={(e) => setEditHandle(e.target.value.replace(/^@/, ""))}
                      className="w-full bg-[#242424] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm outline-none focus:border-[#5EEAD4] font-medium transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-1.5">
                  Bio / About
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Share your musical background or taste..."
                  className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#5EEAD4] font-medium transition-colors resize-none"
                />
              </div>

              {/* Avatar Customization Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider">
                    Profile Avatar
                  </label>
                  {avatarTab === "illustrations" && (
                    <button
                      type="button"
                      onClick={handleRollRandomIllustration}
                      className="flex items-center gap-1.5 text-xs text-[#5EEAD4] hover:text-[#2dd4bf] font-bold cursor-pointer transition-colors"
                      title="Generate a unique illustration avatar"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Roll Random</span>
                    </button>
                  )}
                </div>

                {/* Currently selected preview banner */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#242424]/90 border border-white/10 shadow-sm">
                  <div className="relative flex-shrink-0">
                    <img
                      src={customAvatarUrl.trim() || editAvatar}
                      alt="Avatar Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#5EEAD4] shadow-md bg-[#181818]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#5EEAD4] text-black flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {uploadedFileInfo
                          ? uploadedFileInfo.name
                          : PRESET_AVATARS.find((a) => a.url === (customAvatarUrl.trim() || editAvatar))?.label ||
                            "Active Avatar"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#5EEAD4]/15 text-[#5EEAD4]">
                        {uploadedFileInfo
                          ? "Custom Upload"
                          : (customAvatarUrl.trim() || editAvatar).startsWith("data:")
                          ? "Custom Image"
                          : "Illustration"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a7a7a7] mt-0.5 truncate">
                      {uploadedFileInfo
                        ? `${uploadedFileInfo.sizeKb} KB · Scaled & compressed for instant loading`
                        : "Vector illustration styled for high-fidelity music profiles"}
                    </p>
                  </div>
                  {(uploadedFileInfo || (customAvatarUrl && customAvatarUrl !== editAvatar)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAvatarUrl("");
                        setUploadedFileInfo(null);
                        setEditAvatar(PRESET_AVATARS[0].url);
                      }}
                      className="p-2 text-[#a7a7a7] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Reset to default preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sub-tabs selector */}
                <div className="flex rounded-xl bg-[#202020] p-1 border border-white/5 text-xs font-bold gap-1">
                  <button
                    type="button"
                    onClick={() => setAvatarTab("illustrations")}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      avatarTab === "illustrations"
                        ? "bg-[#5EEAD4] text-black shadow font-bold"
                        : "text-[#a7a7a7] hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Illustrations</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab("upload")}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      avatarTab === "upload"
                        ? "bg-[#5EEAD4] text-black shadow font-bold"
                        : "text-[#a7a7a7] hover:text-white"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab("url")}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      avatarTab === "url"
                        ? "bg-[#5EEAD4] text-black shadow font-bold"
                        : "text-[#a7a7a7] hover:text-white"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Web Link</span>
                  </button>
                </div>

                {/* Tab 1: Illustrated Presets Grid */}
                {avatarTab === "illustrations" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                      {PRESET_AVATARS.map((av) => {
                        const isSelected = (customAvatarUrl.trim() || editAvatar) === av.url;
                        return (
                          <button
                            type="button"
                            key={av.id}
                            onClick={() => {
                              setEditAvatar(av.url);
                              setCustomAvatarUrl("");
                              setUploadedFileInfo(null);
                            }}
                            className={`group relative flex flex-col items-center p-2 rounded-xl border-2 transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#5EEAD4] bg-[#5EEAD4]/10 shadow-lg scale-105"
                                : "border-white/5 bg-[#242424] opacity-75 hover:opacity-100 hover:border-white/20"
                            }`}
                            title={`${av.label} (${av.style})`}
                          >
                            <img
                              src={av.url}
                              alt={av.label}
                              className="w-11 h-11 rounded-full object-cover bg-[#181818]"
                            />
                            <span className="text-[10px] text-white font-medium truncate max-w-full mt-1.5 leading-tight text-center">
                              {av.label}
                            </span>
                            <span className="text-[8px] text-[#5EEAD4] uppercase font-bold tracking-wider">
                              {av.style}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Upload File & Drag/Drop */}
                {avatarTab === "upload" && (
                  <div className="space-y-3">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragging
                          ? "border-[#5EEAD4] bg-[#5EEAD4]/15 scale-[1.01]"
                          : "border-white/15 hover:border-[#5EEAD4] bg-[#242424]/40 hover:bg-[#242424]/80"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleModalFileUpload(file);
                          e.target.value = "";
                        }}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-[#5EEAD4]/15 text-[#5EEAD4] flex items-center justify-center mx-auto mb-2.5">
                        {isProcessingFile ? (
                          <Loader2 className="w-6 h-6 animate-spin text-[#5EEAD4]" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-white">
                        {isProcessingFile ? "Optimizing image fidelity..." : "Drag & drop image here"}
                      </p>
                      <p className="text-xs text-[#a7a7a7] mt-1">
                        PNG, JPG, WEBP, GIF, or SVG · Auto-scaled to crisp 400×400
                      </p>
                      <button
                        type="button"
                        className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-[#5EEAD4] text-black hover:scale-105 transition-transform"
                      >
                        Browse Files
                      </button>
                    </div>

                    {uploadError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
                        <X className="w-4 h-4 flex-shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Custom Web Link */}
                {avatarTab === "url" && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={(e) => {
                        setCustomAvatarUrl(e.target.value);
                        setUploadedFileInfo(null);
                      }}
                      placeholder="https://example.com/avatar.png"
                      className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717a] outline-none focus:border-[#5EEAD4] transition-colors"
                    />
                    <p className="text-[11px] text-[#a7a7a7]">
                      Paste any direct image link from Discord, Imgur, or cloud storage.
                    </p>
                  </div>
                )}
              </div>

              {/* Banner Gradient Selector */}
              <div>
                <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-2">
                  Banner Gradient
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_BANNERS.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setEditBanner(b.gradient)}
                      className={`h-10 rounded-xl transition-all cursor-pointer border-2 ${
                        editBanner === b.gradient
                          ? "border-[#5EEAD4] scale-105 shadow-md"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ background: b.gradient }}
                      title={b.label}
                    />
                  ))}
                </div>
              </div>

              {/* Genre Selector */}
              <div>
                <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-2">
                  Favorite Genres
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {ALL_GENRES.map((g) => {
                    const active = editGenres.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                          active
                            ? "bg-[#5EEAD4]/15 border-[#5EEAD4] text-[#5EEAD4]"
                            : "bg-[#242424] border-white/5 text-[#a7a7a7] hover:text-white"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. London, UK"
                    className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#5EEAD4] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-1.5">
                    Website / Link
                  </label>
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#5EEAD4] font-medium"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-full text-sm font-semibold text-white border border-white/20 hover:border-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-full font-display font-bold text-sm text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
