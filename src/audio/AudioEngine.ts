const CHORDS: number[][] = [
  [55, 82.41, 110, 164.81],
  [43.65, 65.41, 87.31, 130.81],
  [65.41, 98, 130.81, 196],
  [36.71, 55, 73.42, 87.31],
  [49, 73.42, 98, 146.83],
  [55, 110, 164.81, 277.18],
];
const CUTOFF = [520, 750, 1200, 380, 950, 1500];
const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2];

interface Voice {
  a: OscillatorNode;
  b: OscillatorNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private filter!: BiquadFilterNode;
  private reverb!: ConvolverNode;
  private analyser!: AnalyserNode;
  private sub!: OscillatorNode;
  private voices: Voice[] = [];
  private noiseBuf!: AudioBuffer;
  private data: Uint8Array<ArrayBuffer> = new Uint8Array(128);
  private chapter = 0;
  private muted = true;
  private sparkle = 0;
  private lastVel = 0;
  private level = 0;

  get started() {
    return this.ctx !== null;
  }

  start(muted: boolean) {
    this.muted = muted;
    if (this.ctx) {
      this.setMuted(muted);
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const now = ctx.currentTime;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp);
    comp.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(5, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.75;
    this.reverb.connect(wet).connect(this.master);

    const dry = ctx.createGain();
    dry.gain.value = 0.45;
    dry.connect(this.master);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = CUTOFF[0];
    this.filter.Q.value = 5;
    this.filter.connect(dry);
    this.filter.connect(this.reverb);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(this.filter.frequency);
    lfo.start();

    CHORDS[0].forEach((f, i) => {
      const a = ctx.createOscillator();
      a.type = "sawtooth";
      a.frequency.value = f;
      const b = ctx.createOscillator();
      b.type = "triangle";
      b.frequency.value = f;
      b.detune.value = 7 + i * 2;
      const g = ctx.createGain();
      g.gain.value = 0.07 / (1 + i * 0.35);
      // slow tremolo
      const trem = ctx.createOscillator();
      trem.frequency.value = 0.08 + i * 0.05;
      const tg = ctx.createGain();
      tg.gain.value = 0.025;
      trem.connect(tg).connect(g.gain);
      trem.start();
      a.connect(g);
      b.connect(g);
      g.connect(this.filter);
      a.start();
      b.start();
      this.voices.push({ a, b });
    });

    this.sub = ctx.createOscillator();
    this.sub.type = "sine";
    this.sub.frequency.value = CHORDS[0][0] / 2;
    const subG = ctx.createGain();
    subG.gain.value = 0.16;
    this.sub.connect(subG).connect(this.master);
    this.sub.start();

    // Cosmic wind
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuf;
    wind.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    bp.Q.value = 0.9;
    const wl = ctx.createOscillator();
    wl.frequency.value = 0.04;
    const wlg = ctx.createGain();
    wlg.gain.value = 300;
    wl.connect(wlg).connect(bp.frequency);
    wl.start();
    const wg = ctx.createGain();
    wg.gain.value = 0.05;
    wind.connect(bp).connect(wg);
    wg.connect(this.reverb);
    wg.connect(this.master);
    wind.start();

    this.master.gain.setValueAtTime(0, now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.6, now + 3.5);

    this.scheduleSparkle();
  }

  private impulse(duration: number, decay: number) {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private scheduleSparkle() {
    window.clearTimeout(this.sparkle);
    this.sparkle = window.setTimeout(() => {
      if (!this.muted) this.bell(undefined, 0.08 + Math.random() * 0.08);
      this.scheduleSparkle();
    }, 1800 + Math.random() * 3500);
  }

  setChapter(i: number) {
    if (!this.ctx || i === this.chapter) return;
    this.chapter = i;
    const now = this.ctx.currentTime;
    const chord = CHORDS[i];
    this.voices.forEach((v, k) => {
      v.a.frequency.setTargetAtTime(chord[k], now, 1.2);
      v.b.frequency.setTargetAtTime(chord[k], now, 1.4);
    });
    this.sub.frequency.setTargetAtTime(chord[0] / 2, now, 1.5);
    this.filter.frequency.setTargetAtTime(CUTOFF[i], now, 1.2);
    this.whoosh();
  }

  whoosh() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(180, now);
    bp.frequency.exponentialRampToValueAtTime(2800, now + 1.1);
    bp.frequency.exponentialRampToValueAtTime(160, now + 2.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35, now + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    src.connect(bp).connect(g);
    g.connect(this.reverb);
    g.connect(this.master);
    src.start(now);
    src.stop(now + 3);
  }

  bell(freq?: number, vel = 0.22) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const root = CHORDS[this.chapter][0] * 8;
    const f = freq ?? root * PENTA[Math.floor(Math.random() * PENTA.length)];
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(vel, now + 0.01);
    out.gain.exponentialRampToValueAtTime(0.0001, now + 4);
    [
      [1, 1],
      [2.01, 0.35],
      [3.98, 0.12],
    ].forEach(([m, a]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * m;
      const g = ctx.createGain();
      g.gain.value = a;
      o.connect(g).connect(out);
      o.start(now);
      o.stop(now + 4.2);
    });
    out.connect(pan);
    pan.connect(this.reverb);
    const dry = ctx.createGain();
    dry.gain.value = 0.3;
    pan.connect(dry).connect(this.master);
  }

  tick() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(2200, now);
    o.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    o.connect(g).connect(this.master);
    g.connect(this.reverb);
    o.start(now);
    o.stop(now + 0.1);
  }

  update(velocity: number) {
    if (!this.ctx) return;
    if (Math.abs(velocity - this.lastVel) > 0.05) {
      this.lastVel = velocity;
      this.filter.frequency.setTargetAtTime(CUTOFF[this.chapter] + Math.min(velocity, 2) * 1400, this.ctx.currentTime, 0.15);
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (!this.ctx) return;
    if (!m && this.ctx.state === "suspended") this.ctx.resume();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.5);
  }

  isMuted() {
    return this.muted;
  }

  getLevel() {
    if (!this.ctx || this.muted) {
      this.level *= 0.95;
      return this.level;
    }
    this.analyser.getByteFrequencyData(this.data);
    let sum = 0;
    for (let i = 1; i < 24; i++) sum += this.data[i];
    const v = Math.max(0, sum / 23 / 255 - 0.25) * 1.6;
    this.level += (v - this.level) * 0.2;
    return this.level;
  }
}
