import { memo } from "react";
import { usePlayer } from "../store/usePlayerStore";

function AmbientCanvas() {
  const { state } = usePlayer();
  const isPlaying = state.status === "playing";

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        opacity: isPlaying ? 0.22 : 0.12,
        transition: "opacity 1.2s ease",
      }}
    >
      {/* Top-left subtle teal glow */}
      <div
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-teal-500/20 blur-[130px] transform-gpu transition-transform duration-1000 ${
          isPlaying ? "scale-110 translate-x-4" : "scale-100"
        }`}
      />
      {/* Bottom-right purple/indigo aura */}
      <div
        className={`absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/15 blur-[140px] transform-gpu transition-transform duration-1000 ${
          isPlaying ? "scale-115 -translate-y-4" : "scale-100"
        }`}
      />
    </div>
  );
}

export default memo(AmbientCanvas);

