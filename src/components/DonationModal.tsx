import { useState, useEffect, useRef } from "react";
import { Artist } from "../types";
import { useAuth } from "../store/useAuthStore";
import { useDonations, DONATION_TIERS, DonationTier } from "../store/useDonationStore";
import {
  Heart,
  Coffee,
  Disc,
  Ticket,
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
  CreditCard,
  Share2,
  X,
  Award,
} from "lucide-react";

interface Props {
  artist: Artist;
  onClose: () => void;
}

const EMOJI_REACTIONS = [
  { emoji: "🔥", text: "Pure fire!" },
  { emoji: "💖", text: "Love your sound!" },
  { emoji: "🎧", text: "On repeat all day" },
  { emoji: "🚀", text: "Next level music" },
  { emoji: "👏", text: "Incredible talent" },
];

export default function DonationModal({ artist, onClose }: Props) {
  const { user, updateProfile } = useAuth();
  const { addDonation } = useDonations();

  const [selectedTier, setSelectedTier] = useState<DonationTier | null>(DONATION_TIERS[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [step, setStep] = useState<"tier" | "checkout" | "success">("tier");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptDonationId, setReceiptDonationId] = useState("");
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  const effectiveCents = customAmount
    ? Math.max(100, Math.round(parseFloat(customAmount) * 100) || 1000)
    : selectedTier
    ? selectedTier.amountCents
    : 1000;

  const platformFee = Math.round(effectiveCents * 0.2);
  const artistReceives = effectiveCents - platformFee;

  // Trigger confetti upon success
  useEffect(() => {
    if (step !== "success") return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const confetti: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
    }[] = [];

    const colors = ["#5EEAD4", "#2DD4BF", "#14B8A6", "#F59E0B", "#EC4899", "#FFFFFF"];

    for (let i = 0; i < 60; i++) {
      confetti.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.8) * 12,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
      });
    }

    let animationId: number;
    let frames = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frames++;

      for (const p of confetti) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      if (frames < 120) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [step]);

  const handlePay = (method: "card" | "wallet") => {
    setIsProcessing(true);
    setTimeout(() => {
      const tierTitle = selectedTier ? selectedTier.title : "Custom Supporter";
      const tierIcon = selectedTier ? selectedTier.icon : "💖";
      const badge = selectedTier ? selectedTier.badgeName : "Patron";

      const created = addDonation({
        artistId: artist.id,
        artistName: artist.name,
        amountCents: effectiveCents,
        message: message.trim() || undefined,
        isPublic,
        donorName: user.name,
        donorAvatar: user.avatarUrl,
        tierTitle,
        tierIcon,
      });

      // Update user badge and total donated
      updateProfile({
        supporterBadge: badge,
        totalDonatedCents: (user.totalDonatedCents || 0) + effectiveCents,
      });

      setReceiptDonationId(created.id);
      setIsProcessing(false);
      setStep("success");
    }, 1500);
  };

  const getTierIcon = (iconStr: string) => {
    switch (iconStr) {
      case "☕":
        return <Coffee className="w-5 h-5 text-amber-300" />;
      case "💿":
        return <Disc className="w-5 h-5 text-teal-300" />;
      case "🎟️":
        return <Ticket className="w-5 h-5 text-indigo-300" />;
      case "👑":
        return <Crown className="w-5 h-5 text-yellow-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#5EEAD4]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-[#181818] border border-white/10 rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 animate-slide-up shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* ─── SUCCESS SCREEN ─── */}
        {step === "success" ? (
          <div className="relative text-center py-4 space-y-5">
            <canvas
              ref={confettiCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            <div className="relative z-20">
              <div className="w-16 h-16 rounded-full bg-[#5EEAD4]/20 text-[#5EEAD4] flex items-center justify-center mx-auto mb-3 shadow-lg ring-4 ring-[#5EEAD4]/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h2 className="font-display font-black text-2xl text-white">Support Delivered!</h2>
              <p className="text-xs text-[#a7a7a7] mt-1">
                ${(effectiveCents / 100).toFixed(2)} directly funded to {artist.name}
              </p>

              {/* Digital Supporter Pass Card */}
              <div className="mt-5 p-5 rounded-2xl bg-[#202020] border border-[#5EEAD4]/30 shadow-xl text-left space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#5EEAD4]/20 to-transparent rounded-bl-full pointer-events-none" />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5EEAD4]">
                    Official Supporter Pass
                  </span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#5EEAD4]/40"
                  />
                  <div>
                    <p className="font-bold text-white text-base leading-tight">{user.name}</p>
                    <p className="text-xs text-[#a7a7a7]">{user.handle}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#a7a7a7] block text-[10px]">Artist</span>
                    <span className="font-bold text-white">{artist.name}</span>
                  </div>
                  <div>
                    <span className="text-[#a7a7a7] block text-[10px]">Contribution</span>
                    <span className="font-bold text-[#5EEAD4]">${(effectiveCents / 100).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#a7a7a7] block text-[10px]">Badge</span>
                    <span className="font-bold text-amber-300">
                      {selectedTier?.badgeName || "Patron"}
                    </span>
                  </div>
                </div>

                {message && (
                  <p className="text-xs text-[#d1d1d6] italic bg-black/40 p-2.5 rounded-lg border border-white/5">
                    &ldquo;{message}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-full font-display font-bold text-sm text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
                >
                  Return to Music
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ─── STEP 1: TIERS & SHOUTOUT ─── */
          <div className="space-y-6">
            {/* Header with Artist */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h3 className="font-display font-bold text-lg text-white leading-tight">
                    Support {artist.name}
                  </h3>
                  <p className="text-xs text-[#a7a7a7]">
                    Independent creators keep 80% of all listener contributions
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Support Tiers */}
            <div>
              <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-2.5">
                Select a Support Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {DONATION_TIERS.map((tier) => {
                  const isSelected = selectedTier?.id === tier.id && !customAmount;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => {
                        setSelectedTier(tier);
                        setCustomAmount("");
                      }}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all border text-left flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#242424] border-[#5EEAD4] shadow-[0_0_15px_rgba(94,234,212,0.15)]"
                          : "bg-[#202020] border-white/5 hover:border-white/15 hover:bg-[#252525]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {getTierIcon(tier.icon)}
                          <span className="font-bold text-xs text-white truncate">
                            {tier.title}
                          </span>
                        </div>
                        <span className="font-display font-black text-sm text-[#5EEAD4]">
                          ${tier.amountCents / 100}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a7a7a7] leading-relaxed line-clamp-2">
                        {tier.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div className="mt-3">
                <input
                  type="number"
                  placeholder="Or enter custom amount in USD ($)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedTier(null);
                  }}
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs placeholder-[#71717a] outline-none focus:border-[#5EEAD4] font-medium transition-colors"
                />
              </div>
            </div>

            {/* Personalized Shoutout Message */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#a7a7a7] uppercase tracking-wider">
                Personal Shoutout
              </label>

              {/* Quick Emojis */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {EMOJI_REACTIONS.map((em) => (
                  <button
                    key={em.text}
                    type="button"
                    onClick={() => setMessage((prev) => (prev ? `${prev} ${em.text}` : em.text))}
                    className="px-2.5 py-1 rounded-full text-xs bg-[#242424] hover:bg-[#2a2a2a] text-[#d1d1d6] border border-white/5 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <span>{em.emoji}</span> <span className="text-[11px]">{em.text}</span>
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave an encouraging note for the artist..."
                className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs placeholder-[#71717a] outline-none focus:border-[#5EEAD4] font-medium resize-none transition-colors"
              />

              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <div
                  onClick={() => setIsPublic(!isPublic)}
                  className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                  style={{ backgroundColor: isPublic ? "#5EEAD4" : "#282828" }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform"
                    style={{ transform: `translateX(${isPublic ? "18px" : "2px"})` }}
                  />
                </div>
                <span className="text-xs text-[#a7a7a7]">
                  Display my name & shoutout on {artist.name}&apos;s profile
                </span>
              </label>
            </div>

            {/* Breakdown summary */}
            <div className="bg-[#202020] rounded-xl p-3.5 text-xs space-y-1.5 border border-white/5">
              <div className="flex justify-between text-[#a7a7a7]">
                <span>Total Contribution</span>
                <span className="text-white font-semibold">${(effectiveCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#a7a7a7]">
                <span>Platform Processing (20%)</span>
                <span>${(platformFee / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5 text-xs">
                <span className="text-[#5EEAD4] font-semibold">{artist.name} receives</span>
                <span className="text-[#5EEAD4] font-bold">${(artistReceives / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="space-y-2 pt-1">
              {/* One-click Instant Checkout */}
              <button
                type="button"
                onClick={() => handlePay("wallet")}
                disabled={isProcessing}
                className="w-full py-3 rounded-full font-display font-bold text-xs uppercase tracking-wider text-black bg-white hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span> Pay / G Pay</span>
                    <span>·</span>
                    <span>${(effectiveCents / 100).toFixed(2)}</span>
                  </>
                )}
              </button>

              {/* Credit Card / Stripe Checkout */}
              <button
                type="button"
                onClick={() => handlePay("card")}
                disabled={isProcessing}
                className="w-full py-3 rounded-full font-display font-bold text-xs uppercase tracking-wider text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay with Card · ${(effectiveCents / 100).toFixed(2)}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#71717a] pt-1">
                <Lock className="w-3 h-3" />
                <span>256-bit encrypted checkout via Stripe</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
