import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";
import { Track, PlayerState, PlayerStatus } from "../types";
import { resolveAudioStream } from "../services/musicApi";
import { useLibrary } from "./useLibraryStore";

type Action =
  | { type: "PLAY_TRACK"; track: Track; queue?: Track[] }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "TOGGLE_SHUFFLE" }
  | { type: "TOGGLE_REPEAT" }
  | { type: "ADD_TO_QUEUE"; track: Track }
  | { type: "SHOW_NOW_PLAYING"; show: boolean }
  | { type: "SET_STATUS"; status: PlayerStatus };

const initial: PlayerState = {
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  status: "idle",
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeatMode: "none",
  showNowPlaying: false,
};

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case "PLAY_TRACK": {
      const queue = action.queue ?? [action.track];
      const idx = queue.findIndex((t) => t.id === action.track.id);
      return {
        ...state,
        currentTrack: action.track,
        queue,
        queueIndex: idx >= 0 ? idx : 0,
        status: "loading",
        currentTime: 0,
      };
    }
    case "PAUSE":
      return { ...state, status: "paused" };
    case "RESUME":
      return { ...state, status: "playing" };
    case "SET_VOLUME":
      return { ...state, volume: action.volume, isMuted: false };
    case "TOGGLE_MUTE":
      return { ...state, isMuted: !state.isMuted };
    case "NEXT": {
      if (!state.queue.length) return state;
      const next =
        state.repeatMode === "one"
          ? state.queueIndex
          : (state.queueIndex + 1) % state.queue.length;
      return {
        ...state,
        queueIndex: next,
        currentTrack: state.queue[next],
        status: "loading",
        currentTime: 0,
      };
    }
    case "PREV": {
      if (!state.queue.length) return state;
      const prev =
        state.queueIndex === 0
          ? state.queue.length - 1
          : state.queueIndex - 1;
      return {
        ...state,
        queueIndex: prev,
        currentTrack: state.queue[prev],
        status: "loading",
        currentTime: 0,
      };
    }
    case "ADD_TO_QUEUE":
      return { ...state, queue: [...state.queue, action.track] };
    case "TOGGLE_SHUFFLE":
      return { ...state, isShuffled: !state.isShuffled };
    case "TOGGLE_REPEAT": {
      const modes: PlayerState["repeatMode"][] = ["none", "all", "one"];
      const idx = modes.indexOf(state.repeatMode);
      return { ...state, repeatMode: modes[(idx + 1) % modes.length] };
    }
    case "SHOW_NOW_PLAYING":
      return { ...state, showNowPlaying: action.show };
    case "SET_STATUS":
      return { ...state, status: action.status };
    default:
      return state;
  }
}

interface PlayerCtx {
  state: PlayerState;
  playTrack: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
}

interface ProgressCtxValue {
  currentTime: number;
  duration: number;
}

const Ctx = createContext<PlayerCtx | null>(null);
const ProgressCtx = createContext<ProgressCtxValue>({ currentTime: 0, duration: 0 });

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [progress, setProgress] = useState<ProgressCtxValue>({ currentTime: 0, duration: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const { addRecent } = useLibrary();

  useEffect(() => {
    if (state.currentTrack) {
      addRecent(state.currentTrack);
      setProgress({ currentTime: 0, duration: 0 });
    }
  }, [state.currentTrack?.id, addRecent]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = initial.volume;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      const now = performance.now();
      // Throttle progress updates to ~250ms for smooth 4fps seek updates without UI thread clogging
      if (now - lastUpdateRef.current >= 240 || audio.ended) {
        lastUpdateRef.current = now;
        setProgress({
          currentTime: audio.currentTime,
          duration: isFinite(audio.duration) ? audio.duration : 0,
        });
      }
    });

    audio.addEventListener("durationchange", () => {
      if (isFinite(audio.duration)) {
        setProgress((prev) => ({ ...prev, duration: audio.duration }));
      }
    });

    audio.addEventListener("canplaythrough", () => {
      dispatch({ type: "SET_STATUS", status: "playing" });
      audio.play().catch(() => {});
    });

    audio.addEventListener("ended", () => {
      setProgress({ currentTime: 0, duration: 0 });
      dispatch({ type: "NEXT" });
    });

    audio.addEventListener("error", () => {
      dispatch({ type: "SET_STATUS", status: "paused" });
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;

    let cancelled = false;
    const track = state.currentTrack;

    let targetUrl = track.audioUrl;
    if (!targetUrl && track.title) {
      targetUrl = `/api/music/stream/resolve?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist.name)}`;
    }

    if (targetUrl) {
      audio.src = targetUrl;
      audio.load();
    }

    // Direct CDN 320kbps resolution for instant streaming
    if (track.title) {
      resolveAudioStream(track.title, track.artist.name)
        .then((directUrl) => {
          if (!cancelled && directUrl && audio && audio.src !== directUrl) {
            const wasPlaying = !audio.paused;
            const cur = audio.currentTime;
            audio.src = directUrl;
            if (cur > 0) audio.currentTime = cur;
            if (wasPlaying || state.status === "playing") {
              audio.play().catch(() => {});
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state.status === "playing") audio.play().catch(() => {});
    else if (state.status === "paused") audio.pause();
  }, [state.status]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = state.isMuted ? 0 : state.volume;
  }, [state.volume, state.isMuted]);

  const playTrack = useCallback((track: Track, queue?: Track[]) => {
    dispatch({ type: "PLAY_TRACK", track, queue });
  }, []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setProgress((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress((prev) => ({ ...prev, currentTime: 0 }));
    } else {
      dispatch({ type: "PREV" });
    }
  }, []);
  const setVolume = useCallback(
    (v: number) => dispatch({ type: "SET_VOLUME", volume: v }),
    []
  );
  const toggleMute = useCallback(() => dispatch({ type: "TOGGLE_MUTE" }), []);
  const toggleShuffle = useCallback(
    () => dispatch({ type: "TOGGLE_SHUFFLE" }),
    []
  );
  const toggleRepeat = useCallback(
    () => dispatch({ type: "TOGGLE_REPEAT" }),
    []
  );
  const addToQueue = useCallback(
    (track: Track) => dispatch({ type: "ADD_TO_QUEUE", track }),
    []
  );
  const openNowPlaying = useCallback(
    () => dispatch({ type: "SHOW_NOW_PLAYING", show: true }),
    []
  );
  const closeNowPlaying = useCallback(
    () => dispatch({ type: "SHOW_NOW_PLAYING", show: false }),
    []
  );

  return (
    <Ctx.Provider
      value={{
        state,
        playTrack,
        pause,
        resume,
        seek,
        next,
        prev,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        openNowPlaying,
        closeNowPlaying,
      }}
    >
      <ProgressCtx.Provider value={progress}>
        {children}
      </ProgressCtx.Provider>
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be within PlayerProvider");
  return ctx;
}

export function usePlayerProgress() {
  return useContext(ProgressCtx);
}

