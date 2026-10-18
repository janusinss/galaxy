import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [down, setDown] = useState(false);
  const [enabled] = useState(() => window.matchMedia("(pointer: fine)").matches);

  useEffect(() => {
    if (!enabled) return;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = { x: pos.x, y: pos.y };
    let raf = 0;
    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    };
    const pd = () => setDown(true);
    const pu = () => setDown(false);
    const loop = () => {
      r.x += (pos.x - r.x) * 0.14;
      r.y += (pos.y - r.y) * 0.14;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("pointerup", pu);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointerup", pu);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference">
      <div ref={dot} className="absolute left-0 top-0">
        <div className="-ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-white" />
      </div>
      <div ref={ring} className="absolute left-0 top-0">
        <div
          className="flex items-center justify-center rounded-full border border-white/70 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{
            width: down ? 26 : 38,
            height: down ? 26 : 38,
            marginLeft: down ? -13 : -19,
            marginTop: down ? -13 : -19,
            background: "transparent",
          }}
        />
      </div>
    </div>
  );
}
