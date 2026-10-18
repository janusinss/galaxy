import { useCallback, useEffect, useRef, useState } from "react";
import { Experience } from "./three/Experience";
import { AudioEngine } from "./audio/AudioEngine";
import Cursor from "./components/Cursor";

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const expRef = useRef<Experience | null>(null);
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const firstSection = useRef<HTMLDivElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [, setActive] = useState(0);
  const activeRef = useRef(0);

  // Boot WebGL
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.body.classList.remove("locked");
    const exp = new Experience(canvasRef.current!);
    expRef.current = exp;
    const audio = audioRef.current;
    exp.getAudioLevel = () => audio.getLevel();
    exp.onFrame = (v) => audio.update(v);
    return () => {
      exp.dispose();
      expRef.current = null;
    };
  }, []);

  const sectionH = () => firstSection.current?.offsetHeight || window.innerHeight * 1.5;

  // Scroll → progress
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const exp = expRef.current;
      if (!exp) return;
      const vh = window.innerHeight;
      const H = sectionH();
      const y = window.scrollY;
      const raw = Math.min(Math.max(y / H, 0), 5);
      const i = Math.floor(raw);
      const eased = i >= 5 ? 5 : i + smoothstep(0.3, 0.9, raw - i);
      exp.setProgress(eased);
      exp.addVelocity((Math.abs(y - lastY) / vh) * 0.6);
      exp.setFinale(Math.min(Math.max((y - 5 * H - vh * 0.3) / vh, 0), 1));
      lastY = y;
      const a = Math.min(5, Math.round(eased));
      if (a !== activeRef.current) {
        activeRef.current = a;
        setActive(a);
        audioRef.current.setChapter(a);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toggleSound = useCallback(() => {
    const audio = audioRef.current;
    const next = !soundOn;
    if (!audio.started) audio.start(!next);
    else audio.setMuted(!next);
    setSoundOn(next);
    if (next) window.setTimeout(() => audio.bell(undefined, 0.2), 200);
  }, [soundOn]);

  const navigate = useCallback((i: number) => {
    window.scrollTo({ top: i * sectionH(), behavior: "smooth" });
  }, []);

  // Pointer, clicks, keys
  useEffect(() => {
    const move = (e: PointerEvent) => {
      expRef.current?.setMouse((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    const down = (e: PointerEvent) => {
      const audio = audioRef.current;
      if (!audio.started && soundOn) {
        audio.start(false);
      }
      expRef.current?.shock((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      if (soundOn) {
        audio.bell(undefined, 0.28);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") toggleSound();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        navigate(Math.min(5, activeRef.current + 1));
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(Math.max(0, activeRef.current - 1));
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
    };
  }, [soundOn, toggleSound, navigate]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" />
      <div className="vignette" />
      <div className="scanlines" />

      <main className="relative z-10 pointer-events-none">
        <div ref={firstSection} className="h-[150vh]" />
        <div className="h-[150vh]" />
        <div className="h-[150vh]" />
        <div className="h-[150vh]" />
        <div className="h-[150vh]" />
        <div className="h-[150vh]" />
      </main>

      <Cursor />
      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
        <div className="grain" />
      </div>
    </>
  );
}
