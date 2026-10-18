import { useEffect, useState } from "react";
import { cn } from "../utils/cn";

const MESSAGES = [
  "Calibrating gravity",
  "Seeding 36,000 particles",
  "Tuning the cosmic background",
  "Aligning the constellations",
  "Opening the threshold",
];

export default function Preloader({ onEnter }: { onEnter: (sound: boolean) => void }) {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const D = 2800;
    let raf = 0;
    const run = (now: number) => {
      const t = Math.min((now - start) / D, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setPct(Math.round(e * 100));
      if (t < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ready = pct >= 100;
  const msg = MESSAGES[Math.min(MESSAGES.length - 1, Math.floor((pct / 100) * MESSAGES.length))];
  const C = 2 * Math.PI * 78;

  const enter = (sound: boolean) => {
    if (leaving) return;
    setLeaving(true);
    onEnter(sound);
    window.setTimeout(() => setGone(true), 2200);
  };

  if (gone) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex items-center justify-center bg-black transition-all duration-[2000ms] ease-[cubic-bezier(.7,0,.2,1)]",
        leaving && "pointer-events-none opacity-0"
      )}
      style={{ backdropFilter: leaving ? "blur(0px)" : undefined }}
    >
      {/* corner marks */}
      <div className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
        Aether / Transmission 01
      </div>
      <div className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 flicker">
        ● Live
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
        WebGL · Web Audio · 60 fps
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
        Headphones recommended
      </div>

      <div
        className={cn(
          "flex flex-col items-center transition-all duration-[1800ms] ease-[cubic-bezier(.7,0,.2,1)]",
          leaving && "scale-[1.6] blur-md"
        )}
      >
        <div className="relative h-[200px] w-[200px]">
          <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
            <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle
              cx="100"
              cy="100"
              r="78"
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              strokeLinecap="round"
            />
          </svg>
          {ready && (
            <>
              <div className="pulse-ring absolute inset-[22px] rounded-full border border-white/30" />
              <div className="pulse-ring absolute inset-[22px] rounded-full border border-white/20 [animation-delay:1.2s]" />
            </>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {ready ? (
              <div className="font-display text-4xl italic font-light tracking-wide">Aether</div>
            ) : (
              <div className="font-mono text-4xl font-light tabular-nums">{String(pct).padStart(3, "0")}</div>
            )}
          </div>
        </div>

        <div className="mt-10 h-5 font-mono text-[11px] uppercase tracking-[0.35em] text-white/55">
          {ready ? "The threshold is open" : `${msg}…`}
        </div>

        <div
          className={cn(
            "mt-10 flex flex-col items-center gap-4 transition-all duration-1000 sm:flex-row",
            ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <button
            onClick={() => enter(true)}
            data-cursor="Enter"
            className="group relative overflow-hidden rounded-full border border-white/70 px-9 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:text-black"
          >
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-white transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-y-100" />
            <span className="relative flex items-center gap-3">
              <span className="flex h-3 items-end gap-[2px]">
                <span className="w-[2px] animate-pulse bg-current" style={{ height: 6 }} />
                <span className="w-[2px] animate-pulse bg-current [animation-delay:.2s]" style={{ height: 12 }} />
                <span className="w-[2px] animate-pulse bg-current [animation-delay:.4s]" style={{ height: 8 }} />
              </span>
              Enter with sound
            </span>
          </button>
          <button
            onClick={() => enter(false)}
            data-cursor="Silent"
            className="px-6 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white/50 transition-colors hover:text-white"
          >
            Enter in silence
          </button>
        </div>
      </div>
    </div>
  );
}
