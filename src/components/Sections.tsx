import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Chapter } from "../data/chapters";
import { useInView } from "../hooks";
import { cn } from "../utils/cn";

export function SplitText({ text, delay = 0, step = 70 }: { text: string; delay?: number; step?: number }) {
  const words = text.split(" ");
  return (
    <span aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="split-word" aria-hidden>
          <span style={{ transitionDelay: `${delay + i * step}ms` }}>
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

function SplitChars({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span aria-label={text}>
      {text.split("").map((c, i) => (
        <span key={i} className="split-word" aria-hidden>
          <span style={{ transitionDelay: `${delay + i * 90}ms` }}>{c}</span>
        </span>
      ))}
    </span>
  );
}

export function Hero({ chapter, entered }: { chapter: Chapter; entered: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.3, entered);
  return (
    <section id={chapter.id} className="relative h-[150vh]">
      <div className="flex h-screen items-center justify-center px-6">
        <div ref={ref} className={cn("text-center text-glow", inView && "is-in")}>
          <div
            className="reveal flex items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-[0.45em] text-white/60"
            style={{ transitionDelay: "200ms" }}
          >
            <span className="h-px w-10 bg-white/40" />
            {chapter.kicker}
            <span className="h-px w-10 bg-white/40" />
          </div>
          <h1 className="mt-8 font-display text-[22vw] font-light leading-[0.8] tracking-[0.04em] md:text-[15vw]">
            <SplitChars text="AETHER" delay={400} />
          </h1>
          <p className="mt-8 font-display text-2xl italic font-light text-white/90 md:text-4xl">
            <SplitText text={chapter.title} delay={1000} step={90} />
          </p>
          <p
            className="reveal mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/60 md:text-base"
            style={{ transitionDelay: "1600ms" }}
          >
            {chapter.body}
          </p>
          <div
            className="reveal mt-14 flex flex-col items-center gap-3 font-mono text-[9px] uppercase tracking-[0.4em] text-white/50"
            style={{ transitionDelay: "2000ms" }}
          >
            <span>Scroll to begin</span>
            <span className="scroll-line h-14 w-px bg-white/15" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ChapterSection({ chapter, children }: { chapter: Chapter; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.35);
  const { align } = chapter;
  return (
    <section id={chapter.id} className="relative min-h-[150vh]">
      <div
        className={cn(
          "relative flex h-screen items-center px-6 md:px-16 lg:px-28",
          align === "right" && "md:justify-end",
          align === "center" && "justify-center text-center"
        )}
      >
        <div ref={ref} className={cn("relative max-w-2xl text-glow", inView && "is-in", align === "right" && "md:text-right")}>
          <div
            className={cn(
              "numeral pointer-events-none absolute -top-[0.45em] select-none font-display text-[38vw] italic font-light leading-none md:text-[22vw]",
              align === "right" ? "right-0" : "-left-[0.08em]"
            )}
            aria-hidden
          >
            {chapter.numeral}
          </div>
          <div
            className={cn(
              "reveal relative flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.4em]",
              align === "right" && "md:flex-row-reverse"
            )}
            style={{ color: chapter.accent }}
          >
            <span className="h-px w-12" style={{ background: chapter.accent }} />
            {chapter.kicker}
          </div>
          <h2 className="relative mt-7 font-display text-5xl font-light leading-[0.95] md:text-7xl lg:text-[6.5rem]">
            <SplitText text={chapter.title} delay={150} />
          </h2>
          <p
            className={cn(
              "reveal relative mt-8 max-w-md text-base leading-relaxed text-white/70 md:text-lg",
              align === "right" && "md:ml-auto"
            )}
            style={{ transitionDelay: "600ms" }}
          >
            {chapter.body}
          </p>
          <dl
            className="reveal relative mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6 md:inline-grid"
            style={{ transitionDelay: "850ms" } as CSSProperties}
          >
            {chapter.meta.map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">{k}</dt>
                <dd className="mt-2 font-display text-xl italic text-white/90 md:text-2xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {children}
    </section>
  );
}

export function Outro({ enteredAt, onRestart }: { enteredAt: number; onRestart: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.4);
  const [mins, setMins] = useState("0");
  useEffect(() => {
    if (inView && enteredAt) {
      const m = (Date.now() - enteredAt) / 60000;
      setMins(m < 1 ? "less than a minute" : `${m.toFixed(1)} minutes`);
    }
  }, [inView, enteredAt]);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 pb-24">
      <div ref={ref} className={cn("text-center text-glow", inView && "is-in")}>
        <div className="reveal font-mono text-[10px] uppercase tracking-[0.45em] text-white/50">End of transmission</div>
        <h2 className="mt-6 font-display text-[28vw] italic font-light leading-[0.8] md:text-[16vw]">
          <SplitText text="Fin." delay={200} />
        </h2>
        <p
          className="reveal mx-auto mt-8 max-w-lg font-display text-2xl italic font-light text-white/80 md:text-3xl"
          style={{ transitionDelay: "500ms" }}
        >
          You drifted ninety-three billion light-years in {mins}.
        </p>
        <p className="reveal mx-auto mt-4 max-w-sm text-sm text-white/50" style={{ transitionDelay: "700ms" }}>
          The particles are still listening. Click anywhere to send a wave into the void.
        </p>
        <div className="reveal mt-12" style={{ transitionDelay: "900ms" }}>
          <button
            onClick={onRestart}
            data-cursor="Again"
            className="group relative overflow-hidden rounded-full border border-white/60 px-10 py-4 font-mono text-[11px] uppercase tracking-[0.35em] transition-colors duration-500 hover:text-black"
          >
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-white transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-y-100" />
            <span className="relative">↺ &nbsp;Begin again</span>
          </button>
        </div>
        <div
          className="reveal mt-20 font-mono text-[9px] uppercase tracking-[0.35em] text-white/30"
          style={{ transitionDelay: "1100ms" }}
        >
          Built with Three.js · GLSL · Web Audio · React
        </div>
      </div>
    </div>
  );
}
