const gauss = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

export function buildShapes(N: number) {
  const rand = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) rand[i] = Math.random();

  const orb = new Float32Array(N * 3);
  const galaxy = new Float32Array(N * 3);
  const tunnel = new Float32Array(N * 3);
  const disk = new Float32Array(N * 3);
  const grid = new Float32Array(N * 3);
  const knot = new Float32Array(N * 3);

  const golden = Math.PI * (3 - Math.sqrt(5));
  const side = Math.ceil(Math.sqrt(N));
  const TAU = Math.PI * 2;

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const r3 = rand[i * 4 + 3];

    // 0 — Orb / seed
    {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = i * golden;
      let R = 2.3 + gauss() * 0.04;
      if (Math.random() < 0.28) R = 2.3 * Math.cbrt(Math.random());
      orb[i3] = Math.cos(th) * rad * R;
      orb[i3 + 1] = y * R;
      orb[i3 + 2] = Math.sin(th) * rad * R;
    }

    // 1 — Galaxy
    {
      if (Math.random() < 0.13) {
        galaxy[i3] = gauss() * 0.85;
        galaxy[i3 + 1] = gauss() * 0.4;
        galaxy[i3 + 2] = gauss() * 0.85;
      } else {
        const radius = 0.5 + Math.pow(Math.random(), 1.5) * 9.5;
        const branch = ((i % 5) / 5) * TAU;
        const spin = radius * 0.72;
        const spread = 0.2 + radius * 0.11;
        const rx = Math.pow(Math.random(), 2.6) * (Math.random() < 0.5 ? 1 : -1) * spread * 2.2;
        const ry = Math.pow(Math.random(), 2.6) * (Math.random() < 0.5 ? 1 : -1) * spread * 0.7;
        const rz = Math.pow(Math.random(), 2.6) * (Math.random() < 0.5 ? 1 : -1) * spread * 2.2;
        galaxy[i3] = Math.cos(branch + spin) * radius + rx;
        galaxy[i3 + 1] = ry;
        galaxy[i3 + 2] = Math.sin(branch + spin) * radius + rz;
      }
    }

    // 2 — Tunnel
    {
      const a = Math.random() * TAU;
      const rad = Math.random() < 0.86 ? 2.8 + Math.pow(Math.random(), 2) * 3.4 : 0.7 + Math.random() * 2.0;
      tunnel[i3] = Math.cos(a) * rad;
      tunnel[i3 + 1] = Math.sin(a) * rad;
      tunnel[i3 + 2] = Math.random() * 70 - 60;
    }

    // 3 — Black hole accretion disk + photon ring (flag: rand.w > 0.86)
    {
      if (r3 > 0.86) {
        const a = Math.random() * TAU;
        const rad = 2.05 + Math.abs(gauss()) * 0.09;
        disk[i3] = Math.cos(a) * rad;
        disk[i3 + 1] = Math.sin(a) * rad;
        disk[i3 + 2] = gauss() * 0.05;
      } else {
        const a = Math.random() * TAU;
        const rad = 1.9 + Math.pow(Math.random(), 2.2) * 7.8;
        disk[i3] = Math.cos(a) * rad;
        disk[i3 + 1] = gauss() * 0.035 * (1 + rad * 0.18);
        disk[i3 + 2] = Math.sin(a) * rad;
      }
    }

    // 4 — Resonance grid
    {
      const gx = i % side;
      const gz = Math.floor(i / side);
      grid[i3] = (gx / (side - 1) - 0.5) * 26 + (Math.random() - 0.5) * 0.05;
      grid[i3 + 1] = 0;
      grid[i3 + 2] = (gz / side - 0.5) * 26 + (Math.random() - 0.5) * 0.05;
    }

    // 5 — Torus knot (2,3)
    {
      const t = Math.random() * TAU;
      const r = 2 + Math.cos(3 * t);
      const s = 1.3;
      const u = Math.random() * TAU;
      const v = Math.acos(2 * Math.random() - 1);
      const tr = 0.42 * Math.sqrt(Math.random());
      knot[i3] = r * Math.cos(2 * t) * s + Math.sin(v) * Math.cos(u) * tr;
      knot[i3 + 1] = r * Math.sin(2 * t) * s + Math.sin(v) * Math.sin(u) * tr;
      knot[i3 + 2] = -Math.sin(3 * t) * s * 1.2 + Math.cos(v) * tr;
    }
  }

  return { rand, shapes: [orb, galaxy, tunnel, disk, grid, knot] };
}
