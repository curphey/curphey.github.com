// Generated sound only: no audio files. Nothing is created until enable() is called.
// Under the notes the game makes itself there is a slow score for each scene: a pad that drifts through a few
// chords from the scene's scale, a low root under it, and a sparse, wandering melody a long way off in a big
// room. `music` tunes it per scene: pace (larger is slower), warmth (how open the pad is), level, and chords
// (each a list of steps in the scale).
export function createSound({ AudioContextCtor, scale = [220, 262, 294, 330, 392], timbre = 'bell', ambience = null, music = {} } = {}) {
  const pace = music.pace ?? 1, warmth = music.warmth ?? 1, level = music.level ?? 1, chords = music.chords ?? [[0, 2, 4], [3, 5, 7], [1, 3, 5], [0, 2, 5]];
  let ctx = null, master = null, wet = null, far = null, pad = null, padTone = null, grindGain = null, noise = null, lifted = 0;
  const now = () => ctx.currentTime, timers = new Set();
  // Timers never keep a test process alive, and never fire into a context that has been switched off.
  const later = (fn, seconds) => { const t = setTimeout(() => { timers.delete(t); fn(); }, seconds * 1000); t.unref?.(); timers.add(t); };
  const pitch = step => scale[((step % scale.length) + scale.length) % scale.length] * 2 ** Math.floor(step / scale.length);
  function noiseBuffer() {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.08) * 0.985; data[i] = last * 6; }
    return buffer;
  }
  // The room: a long, dark tail made from decaying noise. Where the browser has no convolver, a soft echo stands in.
  function room() {
    if (!ctx.createConvolver) {
      const delay = ctx.createDelay(1), feedback = ctx.createGain(), tone = ctx.createBiquadFilter();
      delay.delayTime.setValueAtTime(0.27, now()); feedback.gain.setValueAtTime(0.42, now()); tone.type = 'lowpass'; tone.frequency.setValueAtTime(1750, now());
      delay.connect(tone); tone.connect(feedback); feedback.connect(delay); tone.connect(master); return delay;
    }
    const seconds = 3.6, n = Math.floor(ctx.sampleRate * seconds), impulse = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = impulse.getChannelData(c); let smooth = 0; for (let i = 0; i < n; i++) { const k = i / n; smooth += ((Math.random() * 2 - 1) - smooth) * (0.5 - 0.42 * k); d[i] = smooth * Math.pow(1 - k, 2.8) * (i < 400 ? i / 400 : 1); } }
    const conv = ctx.createConvolver(), out = ctx.createGain(); conv.buffer = impulse; out.gain.setValueAtTime(0.9, now()); conv.connect(out); out.connect(master); return conv;
  }
  function env(gainNode, peak, attack, release, at = now(), hold = 0) {
    gainNode.gain.setValueAtTime(0.0001, at);
    gainNode.gain.linearRampToValueAtTime(peak, at + attack);
    if (hold) gainNode.gain.setValueAtTime(peak, at + attack + hold);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
  }
  // One note. `distant` sends it almost wholly into the room; `to` sends it to a bus of its own instead.
  function voice(freq, { type = 'sine', peak = 0.18, attack = 0.01, release = 1.6, hold = 0, at = now(), detune = 0, distant = false, to = null } = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, at); osc.detune.setValueAtTime(detune, at);
    env(g, peak, attack, release, at, hold);
    osc.connect(g); if (to) g.connect(to); else if (distant) g.connect(far); else { g.connect(master); g.connect(wet); }
    osc.start(at); osc.stop(at + attack + hold + release + 0.1);
    return osc;
  }
  function build() {
    master = ctx.createGain(); master.gain.setValueAtTime(0.75, now());
    if (ctx.createDynamicsCompressor) { // keeps a pile-up of notes from ever clipping
      const limit = ctx.createDynamicsCompressor(); limit.threshold.setValueAtTime(-16, now()); limit.ratio.setValueAtTime(4, now()); limit.attack.setValueAtTime(0.01, now()); limit.release.setValueAtTime(0.4, now());
      master.connect(limit); limit.connect(ctx.destination);
    } else master.connect(ctx.destination);
    const reverb = room();
    wet = ctx.createGain(); wet.gain.setValueAtTime(0.4, now()); wet.connect(reverb);
    far = ctx.createGain(); far.gain.setValueAtTime(1, now()); far.connect(reverb);
    const farDry = ctx.createGain(); farDry.gain.setValueAtTime(0.3, now()); far.connect(farDry); farDry.connect(master);
    // The pad's own bus: a low-pass that breathes slowly, then a little dry and a lot of room.
    pad = ctx.createGain(); pad.gain.setValueAtTime(0.0001, now()); pad.gain.linearRampToValueAtTime(0.5 * level, now() + 5);
    padTone = ctx.createBiquadFilter(); padTone.type = 'lowpass'; padTone.frequency.setValueAtTime(620 * warmth, now());
    padTone.connect(pad); pad.connect(master); pad.connect(wet);
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.setValueAtTime(0.06, now()); depth.gain.setValueAtTime(170 * warmth, now());
    lfo.connect(depth); depth.connect(padTone.frequency); lfo.start();
    // Stone grinding while a mechanism is dragged.
    noise = ctx.createBufferSource(); noise.buffer = noiseBuffer(); noise.loop = true;
    const grindTone = ctx.createBiquadFilter(); grindTone.type = 'bandpass'; grindTone.frequency.setValueAtTime(190, now());
    grindGain = ctx.createGain(); grindGain.gain.setValueAtTime(0.0001, now());
    noise.connect(grindTone); grindTone.connect(grindGain); grindGain.connect(master); noise.start();
  }
  // ---- the score ----
  let chordAt = 0, tune = 4;
  function nextChord() {
    if (api.enabled) {
      const chord = chords[chordAt++ % chords.length], length = 15 * pace, t = now() + 0.05;
      // Each chord swells in under the last one's tail, so the harmony drifts rather than changes.
      for (const [i, step] of chord.entries()) for (const detune of [-6, 6]) voice(pitch(step) / (i ? 1 : 2), { type: i ? 'triangle' : 'sawtooth', peak: i ? 0.085 : 0.07, attack: 5.5, hold: length - 5, release: 9, at: t, detune, to: padTone });
      voice(pitch(chord[0]) / 4, { type: 'sine', peak: 0.085, attack: 4, hold: length - 4, release: 8, at: t, to: padTone });
      voice(pitch(chord[1]) * 2, { type: 'sine', peak: 0.012, attack: 7, hold: length - 6, release: 9, at: t, distant: true }); // a thread of air on top
    }
    later(nextChord, 15 * pace);
  }
  function phrase() {
    const busy = lifted > Date.now();
    if (api.enabled) {
      const chord = chords[(chordAt + chords.length - 1) % chords.length], count = Math.random() < 0.3 ? 1 : Math.random() < 0.6 ? 2 : 3; let t = now() + 0.05;
      for (let i = 0; i < count; i++) {
        // Wander a step or two, but come home to a note of the chord more often than not.
        tune = Math.random() < 0.55 ? chord[Math.floor(Math.random() * chord.length)] + (Math.random() < 0.4 ? scale.length : 0) : Math.max(0, Math.min(scale.length + 4, tune + [-2, -1, 1, 2][Math.floor(Math.random() * 4)]));
        const f = pitch(tune), soft = 0.75 + Math.random() * 0.5;
        if (timbre === 'pan') { voice(f, { peak: 0.12 * soft * level, attack: 0.005, release: 1.3, at: t, distant: true }); voice(f * 2, { peak: 0.06 * soft * level, attack: 0.005, release: 0.7, at: t, distant: true }); voice(f * 3.01, { peak: 0.014 * soft, attack: 0.005, release: 0.3, at: t, distant: true }); }
        else { voice(f, { peak: 0.11 * soft * level, attack: 0.03, release: 3.4, at: t, distant: true }); voice(f * 2, { peak: 0.026 * soft * level, attack: 0.02, release: 1.5, at: t, distant: true, detune: 3 }); }
        t += (0.45 + Math.random() * 0.5) * pace * (timbre === 'pan' ? 0.6 : 1);
      }
    }
    later(phrase, (busy ? 1.6 : 3) * pace + Math.random() * (busy ? 2 : 5) * pace);
  }
  // The sound of the place: sea, rain or a garden, under the score. Quiet, and only once sound is switched on.
  function place() {
    if (!ambience) return;
    const bed = ctx.createBufferSource(); bed.buffer = noiseBuffer(); bed.loop = true;
    const band = ctx.createBiquadFilter(), gain = ctx.createGain(), swell = ctx.createOscillator(), depth = ctx.createGain();
    band.type = ambience === 'rain' ? 'highpass' : 'lowpass'; band.frequency.setValueAtTime(ambience === 'rain' ? 2400 : ambience === 'sea' ? 520 : 300, now());
    gain.gain.setValueAtTime(ambience === 'rain' ? 0.016 : ambience === 'sea' ? 0.02 : 0.01, now());
    swell.frequency.setValueAtTime(ambience === 'sea' ? 0.11 : 0.05, now()); depth.gain.setValueAtTime(ambience === 'sea' ? 0.012 : 0.003, now());
    swell.connect(depth); depth.connect(gain.gain); bed.connect(band); band.connect(gain); gain.connect(master); bed.start(); swell.start();
    // Now and then: a gull over the sea, a songbird in the garden.
    const call = () => {
      if (api.enabled) {
        const r = Math.random(), t = now();
        if (ambience === 'sea' && r < 0.4) for (let i = 0; i < 3; i++) { const o = voice(1250, { type: 'triangle', peak: 0.02, attack: 0.03, release: 0.28, at: t + i * 0.36, distant: true }); o.frequency.exponentialRampToValueAtTime(820, t + i * 0.36 + 0.3); }
        else if (ambience === 'garden' && r < 0.55) for (let i = 0; i < 4; i++) { const o = voice(2300 + Math.random() * 900, { type: 'sine', peak: 0.014, attack: 0.01, release: 0.09, at: t + i * 0.13, distant: true }); o.frequency.exponentialRampToValueAtTime(3100 + Math.random() * 600, t + i * 0.13 + 0.08); }
      }
      later(call, 6 + Math.random() * 9);
    };
    later(call, 4);
  }
  const api = {
    get enabled() { return !!ctx && ctx.state !== 'suspended'; },
    enable() {
      if (!AudioContextCtor) return false;
      if (!ctx) { ctx = new AudioContextCtor(); build(); place(); later(nextChord, 0.4); later(phrase, 7 * pace); }
      ctx.resume?.();
      return true;
    },
    disable() { ctx?.suspend?.(); },
    // One note per mechanism step, taken from the chapter's scale.
    note(index) {
      if (!api.enabled) return;
      const f = scale[((index % scale.length) + scale.length) % scale.length];
      if (timbre === 'pan') { // a steel pan: a quick bright strike with a ringing octave above it
        voice(f * 2, { type: 'sine', peak: 0.24, attack: 0.004, release: 0.9 });
        voice(f * 4, { type: 'sine', peak: 0.12, attack: 0.004, release: 0.55 });
        return;
      }
      voice(f * 2, { type: 'sine', peak: 0.2, release: 2.2 });
      voice(f * 4, { type: 'triangle', peak: 0.04, release: 0.9, detune: 4 });
    },
    click() { if (api.enabled) voice(90, { type: 'triangle', peak: 0.25, attack: 0.002, release: 0.12 }); },
    step() { if (api.enabled) voice(140 + Math.random() * 40, { type: 'sine', peak: 0.05, attack: 0.002, release: 0.07 }); },
    join() { if (api.enabled) [0, 2, 4].forEach((i, n) => voice(scale[i] * 2, { peak: 0.12, release: 2.6, at: now() + n * 0.09 })); },
    grind(amount) { if (api.enabled) grindGain.gain.setTargetAtTime(Math.max(0.0001, Math.min(0.5, amount)), now(), 0.05); },
    // The score opens up for a while: the pad swells and brightens and the melody comes a little closer together.
    lift(seconds = 12) {
      if (!api.enabled) return;
      lifted = Date.now() + seconds * 1000; const t = now();
      pad.gain.cancelScheduledValues?.(t); pad.gain.setTargetAtTime(0.85 * level, t, 2.5); pad.gain.setTargetAtTime(0.5 * level, t + seconds, 5);
      padTone.frequency.setTargetAtTime(1150 * warmth, t, 3); padTone.frequency.setTargetAtTime(620 * warmth, t + seconds, 6);
    },
    // Completion: a rising arpeggio that settles on a bell-like chord.
    chord() {
      if (!api.enabled) return;
      [0, 2, 4, 5, 7].forEach((i, n) => {
        const f = scale[i % scale.length] * 2, at = now() + n * 0.16;
        voice(f, { peak: 0.2, release: 4.5, at });
        voice(f * 2.76, { peak: 0.05, release: 2.4, at }); // inharmonic partial: bell colour
      });
      api.lift(12);
    }
  };
  return api;
}
