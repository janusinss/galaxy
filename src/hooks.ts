import { useEffect, useState, type RefObject } from "react";

export function useInView(ref: RefObject<Element | null>, threshold = 0.3, enabled = true) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || !enabled) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, threshold, enabled]);
  return inView && enabled;
}

const GLYPHS = "!<>-_\\/[]{}—=+*^?#ABCDEFXZ0123456789";

export function useScramble(text: string, duration = 26) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    let frame = 0;
    let raf = 0;
    const run = () => {
      frame++;
      const prog = frame / duration;
      setOut(
        text
          .split("")
          .map((c, i) =>
            c === " " ? " " : i / text.length < prog ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join("")
      );
      if (frame < duration) raf = requestAnimationFrame(run);
    };
    run();
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);
  return out;
}
