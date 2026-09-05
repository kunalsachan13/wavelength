import { useState, useRef } from "react";

type Step = 0 | 1 | 2 | 3;

const GENRES = ["Electronic", "Ambient", "Techno", "Jazz", "Afrobeat", "Neoclassical", "Lo-Fi", "Indie Folk", "Downtempo", "IDM", "Pop", "R&B", "Hip-Hop", "Other"];

export default function Upload() {
  const [step, setStep] = useState<Step>(0);
  const [dragging, setDragging] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [meta, setMeta] = useState({ title: "", album: "", genre: "Electronic", explicit: false, lyrics: "" });
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|flac|aiff|m4a|ogg)$/i))) {
      setAudioFile(f);
    }
  };

  const handleCoverChange = (f: File | null) => {
    if (!f) return;
    setCoverFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 3000);
  };

  if (done) {
    return (
      <div className="px-6 py-12 flex flex-col items-center text-center animate-fade-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "rgba(94,234,212,0.15)" }}>
          <svg className="w-8 h-8 text-wl-teal" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="font-display font-700 text-xl text-wl-text mb-2">Track uploaded!</h2>
        <p className="text-wl-muted text-sm mb-1">Your track is being transcoded and will be live in ~2 minutes.</p>
        <p className="text-xs text-wl-muted mb-8">You&apos;ll receive an email when it&apos;s ready to stream.</p>
        {coverPreview && <img src={coverPreview} alt="cover" className="w-32 h-32 rounded-2xl object-cover mb-2" />}
        <p className="font-display font-700 text-wl-text">{meta.title || audioFile?.name}</p>
        <button
          onClick={() => { setDone(false); setStep(0); setAudioFile(null); setCoverFile(null); setCoverPreview(null); setMeta({ title: "", album: "", genre: "Electronic", explicit: false, lyrics: "" }); }}
          className="mt-6 px-6 py-3 rounded-full font-display font-600 text-sm text-wl-bg"
          style={{ backgroundColor: "#5EEAD4" }}
        >
          Upload another track
        </button>
      </div>
    );
  }

  const steps = ["Audio file", "Track info", "Cover art", "Review"];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto animate-fade-up">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">Upload a track</h1>
      <p className="text-[#a7a7a7] text-xs sm:text-sm mb-6 sm:mb-8">Share your music with the world in high-fidelity 320kbps.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6 sm:mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
                style={{
                  backgroundColor: i < step ? "#5EEAD4" : i === step ? "rgba(94,234,212,0.2)" : "#242424",
                  color: i < step ? "#000" : i === step ? "#5EEAD4" : "#8A8A8E",
                  border: i === step ? "2px solid #5EEAD4" : "none",
                }}
              >
                {i < step ? (
                  <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className="text-[11px] text-[#a7a7a7] text-center leading-tight hidden sm:block font-medium">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: i < step ? "#5EEAD4" : "#282828" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Audio file */}
      {step === 0 && (
        <div>
          <div
            className="rounded-2xl p-6 sm:p-12 text-center transition-colors cursor-pointer bg-[#181818] hover:bg-[#202020] border-2 border-dashed"
            style={{
              borderColor: dragging ? "#5EEAD4" : audioFile ? "#5EEAD4" : "rgba(255,255,255,0.15)",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleAudioDrop}
            onClick={() => audioInputRef.current?.click()}
          >
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.aiff,.m4a,.ogg"
              className="hidden"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            />
            {audioFile ? (
              <>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#5EEAD4]/20">
                  <svg className="w-8 h-8 text-[#5EEAD4]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <p className="font-display font-bold text-white text-lg mb-1">{audioFile.name}</p>
                <p className="text-xs text-[#a7a7a7]">{(audioFile.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 mx-auto mb-4 text-[#a7a7a7]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="font-display font-bold text-white text-base mb-1">Drop your audio file here</p>
                <p className="text-xs text-[#a7a7a7]">MP3, WAV, FLAC, AIFF · up to 500 MB</p>
              </>
            )}
          </div>
          <button
            onClick={() => audioFile && setStep(1)}
            disabled={!audioFile}
            className="w-full mt-6 py-3.5 rounded-full font-display font-bold text-sm text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:hover:scale-100"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 1: Metadata */}
      {step === 1 && (
        <div className="space-y-5 bg-[#181818] p-6 rounded-2xl border border-white/5 shadow-md">
          <div>
            <label className="text-xs text-[#a7a7a7] font-display font-bold uppercase tracking-wider block mb-2">Track title *</label>
            <input
              className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-[#a7a7a7] focus:border-[#5EEAD4] transition-colors"
              placeholder="Give your track a name"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-[#a7a7a7] font-display font-bold uppercase tracking-wider block mb-2">Album / EP</label>
            <input
              className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-[#a7a7a7] focus:border-[#5EEAD4] transition-colors"
              placeholder="Album name (optional)"
              value={meta.album}
              onChange={(e) => setMeta({ ...meta, album: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-[#a7a7a7] font-display font-bold uppercase tracking-wider block mb-2">Genre</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setMeta({ ...meta, genre: g })}
                  className="px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: meta.genre === g ? "rgba(94,234,212,0.15)" : "#242424",
                    color: meta.genre === g ? "#5EEAD4" : "#a7a7a7",
                    border: meta.genre === g ? "1px solid #5EEAD4" : "1px solid transparent",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <div
              onClick={() => setMeta({ ...meta, explicit: !meta.explicit })}
              className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
              style={{ backgroundColor: meta.explicit ? "#5EEAD4" : "#282828" }}
            >
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform" style={{ transform: `translateX(${meta.explicit ? "22px" : "2px"})` }} />
            </div>
            <span className="text-sm text-white font-medium">Explicit content</span>
          </label>
          <div className="flex gap-3 pt-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-full text-sm font-semibold text-white border border-white/20 hover:border-white transition-colors cursor-pointer">Back</button>
            <button onClick={() => setStep(2)} disabled={!meta.title} className="flex-1 py-3 rounded-full font-display font-bold text-sm text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg disabled:opacity-40 disabled:hover:scale-100">Continue</button>
          </div>
        </div>
      )}

      {/* Step 2: Cover art */}
      {step === 2 && (
        <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 shadow-md">
          <div
            className="rounded-2xl p-8 text-center cursor-pointer transition-colors mx-auto border-2 border-dashed border-white/15 bg-[#242424] hover:bg-[#282828]"
            style={{
              maxWidth: "300px",
            }}
            onClick={() => coverInputRef.current?.click()}
          >
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)} />
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="w-48 h-48 rounded-xl object-cover mx-auto shadow-lg" />
            ) : (
              <>
                <svg className="w-12 h-12 mx-auto mb-4 text-[#a7a7a7]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="font-display font-bold text-white mb-1">Upload cover art</p>
                <p className="text-xs text-[#a7a7a7]">Square image, at least 1400×1400px</p>
              </>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-full text-sm font-semibold text-white border border-white/20 hover:border-white transition-colors cursor-pointer">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-full font-display font-bold text-sm text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg">
              {coverFile ? "Continue" : "Skip for now"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 shadow-md">
          <div className="flex gap-4 p-4 rounded-xl mb-6 bg-[#242424]">
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#282828]">
                <svg className="w-8 h-8 text-[#a7a7a7]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <p className="font-display font-bold text-white text-lg">{meta.title || audioFile?.name}</p>
              {meta.album && <p className="text-sm text-[#a7a7a7]">{meta.album}</p>}
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#282828] text-white">{meta.genre}</span>
                {meta.explicit && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">Explicit</span>}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-400/10">320kbps</span>
              </div>
              <p className="text-xs text-[#a7a7a7] mt-2 font-mono">File: {audioFile?.name}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl text-xs text-[#a7a7a7] mb-6 space-y-1 bg-[#242424]">
            <p>Your track will be transcoded to HLS/AAC and waveform data will be generated (~2 min).</p>
            <p>By uploading, you confirm you own the rights to this content and agree to the Wavelength artist terms.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-full text-sm font-semibold text-white border border-white/20 hover:border-white transition-colors cursor-pointer">Back</button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="flex-1 py-3 rounded-full font-display font-bold text-sm text-black bg-[#5EEAD4] hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {processing ? (
                <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full spin" /> Uploading…</>
              ) : "Publish track"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
