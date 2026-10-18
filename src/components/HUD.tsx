import { useEffect, useState } from "react";
import { chapters } from "../data/chapters";
import { useScramble } from "../hooks";
import { cn } from "../utils/cn";

interface Props {
  active: number;
  visible: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
  onNavigate: (i: number) => void;
}

function Corner({ className }: { className: string }) {
  return <div className={cn("pointer-events-none absolute h-5 w-5 border-white/30", className)} />;
}

export default function HUD({ active, visible, soundOn, onToggleSound, onNavigate }: Props) {
  const ch = chapters[active];
  const title = useScramble(`${ch.numeral} / VI — ${ch.name}`);
  const [coords, setCoords] = useState({ ra: "12h 30m 49s", dec: "+12° 23′ 28″" });
  const [pct, setPct] = useState(0);
  const [depth, setDepth] = useState(0);
  const [time, setTime] = useState("00:00");

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      const h = Math.floor(x * 24);
      const m = Math.floor((x * 24 - h) * 60);
      const s = Math.floor((((x * 24 - h) * 60 - m) * 60));
      const d = (0.5 - y) * 180;
      const dd = Math.floor(Math.abs(d));
      const dm = Math.floor((Math.abs(d) - dd) * 60);
      setCoords({
        ra: `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
        dec: `${d >= 0 ? "+" : "−"}${String(dd).padStart(2, "0")}° ${String(dm).padStart(2, "0")}′`,
      });
    };
    const scroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setPct(p);
      setDepth(Math.pow(p, 2.2) * 93_000_000_000);
    };
    const start = Date.now();
    const iv = window.setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      setTime(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    }, 1000);
    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", scroll, { passive: true });
    scroll();
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scroll);
      window.clearInterval(iv);
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-40 transition-opacity duration-[2000ms]",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Viewfinder corners */}
      <Corner className="left-4 top-4 border-l border-t" />
      <Corner className="right-4 top-4 border-r border-t" />
      <Corner className="bottom-4 left-4 border-b border-l" />
      <Corner className="bottom-4 right-4 border-b border-r" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-8 pt-8 md:px-12">
        <button
          onClick={() => onNavigate(0)}
          data-cursor="Home"
          className="pointer-events-auto text-left"
        >
          <div className="font-display text-2xl italic font-light leading-none tracking-wide">Aether</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.35em] text-white/45">
            A voyage in six movements
          </div>
        </button>

        <div className="hidden font-mono text-[10px] uppercase tracking-[0.35em] text-white/70 md:block">
          <span style={{ color: ch.accent }}>●</span> {title}
        </div>

        <button
          onClick={onToggleSound}
          data-cursor={soundOn ? "Mute" : "Sound"}
          className={cn(
            "pointer-events-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/80",
            soundOn && "sound-on"
          )}
        >
          <span className="hidden sm:inline">Sound {soundOn ? "on" : "off"}</span>
          <span className="flex h-4 items-end gap-[3px]">
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </span>
        </button>
      </div>

      {/* Chapter nav */}
      <nav className="absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-5 md:flex md:right-12">
        {chapters.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onNavigate(i)}
            data-cursor="Go"
            className="group pointer-events-auto flex items-center gap-3"
          >
            <span
              className={cn(
                "font-mono text-[9px] uppercase tracking-[0.3em] transition-all duration-500",
                i === active ? "translate-x-0 text-white opacity-100" : "translate-x-2 text-white/60 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              )}
            >
              {c.name}
            </span>
            <span
              className={cn(
                "font-display text-sm italic transition-colors duration-500",
                i === active ? "text-white" : "text-white/35 group-hover:text-white/80"
              )}
            >
              {c.numeral}
            </span>
            <span
              className="h-px transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
              style={{
                width: i === active ? 32 : 12,
                background: i === active ? c.accent : "rgba(255,255,255,0.3)",
              }}
            />
          </button>
        ))}
      </nav>

      {/* Bottom left telemetry */}
      <div className="absolute bottom-8 left-8 hidden font-mono text-[9px] uppercase leading-[1.9] tracking-[0.25em] text-white/45 md:left-12 md:block">
        <div>
          RA <span className="text-white/80">{coords.ra}</span>
        </div>
        <div>
          DEC <span className="text-white/80">{coords.dec}</span>
        </div>
        <div>
          Drift <span className="text-white/80">{depth.toLocaleString("en-US", { maximumFractionDigits: 0 })} ly</span>
        </div>
        <div>
          T+ <span className="text-white/80">{time}</span>
        </div>
      </div>

      {/* Bottom right scroll hint */}
      <div className="absolute bottom-8 right-8 flex items-end gap-4 md:right-12">
        <div className="text-right font-mono text-[9px] uppercase tracking-[0.3em] text-white/45">
          <div className="text-white/80 tabular-nums">{String(Math.round(pct * 100)).padStart(3, "0")}%</div>
          <div className="mt-1">{pct < 0.98 ? "Scroll to drift" : "Click to ripple"}</div>
        </div>
        <div className="scroll-line h-12 w-px bg-white/15" />
      </div>

      {/* Progress line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/5">
        <div
          className="h-full transition-[background] duration-1000"
          style={{
            width: `${pct * 100}%`,
            background: `linear-gradient(90deg, transparent, ${ch.accent})`,
            boxShadow: `0 0 12px ${ch.accent}`,
          }}
        />
      </div>
    </div>
  );
}
