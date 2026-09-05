import { useMemo } from "react";

interface Props {
  waveform: number[];
  progress: number;
  isPlaying: boolean;
  onSeek?: (progress: number) => void;
  height?: number;
  barCount?: number;
}

export default function WaveformDisplay({
  waveform,
  progress,
  isPlaying,
  onSeek,
  height = 40,
  barCount = 60,
}: Props) {
  const bars = useMemo(() => {
    const step = waveform.length / barCount;
    return Array.from({ length: barCount }, (_, i) => {
      const idx = Math.floor(i * step);
      return waveform[idx] ?? 0.5;
    });
  }, [waveform, barCount]);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    onSeek(x / rect.width);
  };

  const barW = 2;
  const gap = 1.5;
  const totalW = barCount * (barW + gap);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${totalW} ${height}`}
      preserveAspectRatio="none"
      onClick={handleClick}
      style={{ cursor: onSeek ? "pointer" : "default", display: "block" }}
    >
      {bars.map((amp, i) => {
        const x = i * (barW + gap);
        const barH = Math.max(2, amp * height);
        const y = (height - barH) / 2;
        const filled = i / barCount < progress;
        const isActive = isPlaying && filled;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={1}
            fill={
              filled
                ? "rgba(94,234,212,0.9)"
                : "rgba(255,255,255,0.18)"
            }
            className={isActive ? `wave-bar wave-bar-${((i % 4) + 1)}` : undefined}
          />
        );
      })}
    </svg>
  );
}
