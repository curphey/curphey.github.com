// Generated sound only: no audio files. Nothing is created until enable() is called.
export function createSound({ AudioContextCtor, scale = [220, 262, 294, 330, 392], timbre = 'bell', ambience = null } = {}) {
  let ctx = null, master = null, wet = null, pad = null, grindGain = null, noise = null;
  const now = () => ctx.currentTime;
  function noiseBuffer() {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.08) * 0.985; data[i] = last * 6; }
    return buffer;
  }
  function env(gainNode, peak, attack, release, at = now()) {
    gainNode.gain.setValueAtTime(0.0001, at);
    gainNode.gain.linearRampToValueAtTime(peak, at + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, at + attack + release);
  }
  function voice(freq, { type = 'sine', peak = 0.18, attack = 0.01, release = 1.6, at = now(), detune = 0 } = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, at); osc.detune.setValueAtTime(detune, at);
    env(g, peak, attack, release, at);
    osc.connect(g); g.connect(master); g.connect(wet);
    osc.start(at); osc.stop(at + attack + release + 0.1);
    return osc;
  }
  function build() {
    master = ctx.createGain(); master.gain.setValueAtTime(0.7, now()); master.connect(ctx.destination);
    // A small feedback echo stands in for a stone courtyard.
    wet = ctx.createGain(); wet.gain.setValueAtTime(0.35, now());
    const delay = ctx.createDelay(1), feedback = ctx.createGain(), tone = ctx.createBiquadFilter();
    delay.delayTime.setValueAtTime(0.27, now()); feedback.gain.setValueAtTime(0.42, now());
    tone.type = 'lowpass'; tone.frequency.setValueAtTime(1750, now());
    wet.connect(delay); delay.connect(tone); tone.connect(feedback); feedback.connect(delay); tone.connect(master);
    // The pad: two detuned low voices breathing slowly.
    pad = ctx.createGain(); pad.gain.setValueAtTime(0.0001, now()); pad.gain.linearRampToValueAtTime(0.05, now() + 4);
    const padTone = ctx.createBiquadFilter(); padTone.type = 'lowpass'; padTone.frequency.setValueAtTime(520, now());
    for (const [ratio, detune] of [[0.5, -6], [0.5, 7], [0.75, 0]]) {
      const osc = ctx.createOscillator(); osc.type = 'triangle';
      osc.frequency.setValueAtTime(scale[0] * ratio, now()); osc.detune.setValueAtTime(detune, now());
      osc.connect(padTone); osc.start();
    }
    padTone.connect(pad); pad.connect(master); pad.connect(wet);
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.setValueAtTime(0.07, now()); depth.gain.setValueAtTime(140, now());
    lfo.connect(depth); depth.connect(padTone.frequency); lfo.start();
    // Stone grinding while a mechanism is dragged.
    noise = ctx.createBufferSource(); noise.buffer = noiseBuffer(); noise.loop = true;
    const grindTone = ctx.createBiquadFilter(); grindTone.type = 'bandpass'; grindTone.frequency.setValueAtTime(190, now());
    grindGain = ctx.createGain(); grindGain.gain.setValueAtTime(0.0001, now());
    noise.connect(grindTone); grindTone.connect(grindGain); grindGain.connect(master); noise.start();
  }
  // The sound of the place: sea, rain or a garden, under the pad. Quiet, and only once sound is switched on.
  let timer = null;
  function place() {
    if (!ambience) return;
    const bed = ctx.createBufferSource(); bed.buffer = noiseBuffer(); bed.loop = true;
    const band = ctx.createBiquadFilter(), level = ctx.createGain(), swell = ctx.createOscillator(), depth = ctx.createGain();
    band.type = ambience === 'rain' ? 'highpass' : 'lowpass'; band.frequency.setValueAtTime(ambience === 'rain' ? 2400 : ambience === 'sea' ? 520 : 300, now());
    level.gain.setValueAtTime(ambience === 'rain' ? 0.05 : ambience === 'sea' ? 0.07 : 0.025, now());
    swell.frequency.setValueAtTime(ambience === 'sea' ? 0.11 : 0.05, now()); depth.gain.setValueAtTime(ambience === 'sea' ? 0.045 : 0.01, now());
    swell.connect(depth); depth.connect(level.gain); bed.connect(band); band.connect(level); level.connect(master); bed.start(); swell.start();
    // Now and then: a gull over the sea, a songbird in the garden, and a slow note or two from the scene's scale.
    const call = () => {
      if (api.enabled) {
        const r = Math.random(), t = now();
        if (ambience === 'sea' && r < 0.4) for (let i = 0; i < 3; i++) { const o = voice(1250, { type: 'triangle', peak: 0.022, attack: 0.03, release: 0.28, at: t + i * 0.36 }); o.frequency.exponentialRampToValueAtTime(820, t + i * 0.36 + 0.3); }
        else if (ambience === 'garden' && r < 0.55) for (let i = 0; i < 4; i++) { const o = voice(2300 + Math.random() * 900, { type: 'sine', peak: 0.016, attack: 0.01, release: 0.09, at: t + i * 0.13 }); o.frequency.exponentialRampToValueAtTime(3100 + Math.random() * 600, t + i * 0.13 + 0.08); }
        else voice(scale[Math.floor(Math.random() * scale.length)], { type: 'sine', peak: 0.035, attack: 0.6, release: 3.5 });
      }
      timer = setTimeout(call, 5000 + Math.random() * 7000);
    };
    timer = setTimeout(call, 3000);
  }
  const api = {
    get enabled() { return !!ctx && ctx.state !== 'suspended'; },
    enable() {
      if (!AudioContextCtor) return false;
      if (!ctx) { ctx = new AudioContextCtor(); build(); place(); }
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
    // Completion: a rising arpeggio that settles on a bell-like chord.
    chord() {
      if (!api.enabled) return;
      [0, 2, 4, 5, 7].forEach((i, n) => {
        const f = scale[i % scale.length] * 2, at = now() + n * 0.16;
        voice(f, { peak: 0.2, release: 4.5, at });
        voice(f * 2.76, { peak: 0.05, release: 2.4, at }); // inharmonic partial: bell colour
      });
    }
  };
  return api;
}
