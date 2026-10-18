export type Align = "left" | "right" | "center";

export interface Chapter {
  numeral: string;
  id: string;
  name: string;
  kicker: string;
  title: string;
  body: string;
  meta: [string, string][];
  align: Align;
  accent: string;
}

export const chapters: Chapter[] = [
  {
    numeral: "I",
    id: "threshold",
    name: "Threshold",
    kicker: "Movement I — Threshold",
    title: "Before light, there was a seed.",
    body: "Every universe begins as a whisper: a single point that holds everything that will ever exist. Move your cursor. It notices.",
    meta: [
      ["Temperature", "10³² K"],
      ["Age", "0.000 s"],
      ["Scale", "1 Planck"],
    ],
    align: "center",
    accent: "#ffb27a",
  },
  {
    numeral: "II",
    id: "nebula",
    name: "Nebula",
    kicker: "Movement II — Nebula",
    title: "Dust remembers how to burn.",
    body: "Spiral arms stretch across a hundred thousand light-years. Gravity pulls scattered dust together, and as it collapses, stars ignite.",
    meta: [
      ["Stars", "400 billion"],
      ["Diameter", "105,700 ly"],
      ["Rotation", "230 km/s"],
    ],
    align: "left",
    accent: "#c58bff",
  },
  {
    numeral: "III",
    id: "velocity",
    name: "Velocity",
    kicker: "Movement III — Velocity",
    title: "Faster than the memory of light.",
    body: "Space folds into a corridor and the constellations stretch into threads. Scroll faster to feel the tunnel pull you in.",
    meta: [
      ["Speed", "0.9999 c"],
      ["Dilation", "×70.7"],
      ["Heading", "Unknown"],
    ],
    align: "right",
    accent: "#6fe6ff",
  },
  {
    numeral: "IV",
    id: "singularity",
    name: "Singularity",
    kicker: "Movement IV — Singularity",
    title: "Where even time forgets to move.",
    body: "At the edge of the event horizon, light circles in a perfect ring. Gold and fire spiral inward and vanish into silence.",
    meta: [
      ["Mass", "6.5 B M☉"],
      ["Horizon", "0.0013 ly"],
      ["Escape", "Impossible"],
    ],
    align: "left",
    accent: "#ffa94d",
  },
  {
    numeral: "V",
    id: "resonance",
    name: "Resonance",
    kicker: "Movement V — Resonance",
    title: "The cosmos is a sound wave.",
    body: "Every particle still vibrates with the echo of the beginning. Turn your sound on and the field ripples with the music.",
    meta: [
      ["Frequency", "10⁻¹⁵ Hz"],
      ["Amplitude", "Infinite"],
      ["Medium", "Spacetime"],
    ],
    align: "right",
    accent: "#4dffbf",
  },
  {
    numeral: "VI",
    id: "rebirth",
    name: "Rebirth",
    kicker: "Movement VI — Rebirth",
    title: "And from the silence, a new shape.",
    body: "The universe ties itself into a knot of light and starts again. Click anywhere to send your own wave into the void.",
    meta: [
      ["Loops", "∞"],
      ["Origin", "You"],
      ["Status", "Awakening"],
    ],
    align: "left",
    accent: "#e2d1ff",
  },
];
