/**
 * Default starter patch: kick on 1 & 3, snare on 2 & 4,
 * hats on 8th notes with probability, simple bassline (minor scale).
 * Editor-style: export function buildPatch(ctx) => PatchHandle.
 * Tone is injected by the evaluator wrapper.
 */
export const defaultPatch = `export function buildPatch(ctx) {
  var Transport = ctx.Transport;
  var registerEvent = ctx.registerEvent;
  var destination = ctx.destination;
  var bpm = ctx.bpm;
  var volume = ctx.volume !== undefined ? ctx.volume : 0;

  var nodes = [];
  var loops = [];
  var parts = [];

  var vol = new Tone.Volume(volume).connect(destination);
  nodes.push(vol);

  var kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.5 }
  }).connect(vol);
  nodes.push(kick);

  var snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
  }).connect(vol);
  nodes.push(snare);

  var hat = new Tone.MetalSynth({
    frequency: 200,
    envelope: { attack: 0.001, decay: 0.05, release: 0.05 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 0.5
  }).connect(vol);
  nodes.push(hat);

  var bass = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 }
  }).connect(vol);
  nodes.push(bass);

  var bars = 4;
  var beatDuration = 60 / bpm;
  var barDuration = beatDuration * 4;

  for (var bar = 0; bar < bars; bar++) {
    registerEvent({ time: bar * 4 + 0, duration: 0.25, label: 'Kick', lane: 'kick' });
    registerEvent({ time: bar * 4 + 2, duration: 0.25, label: 'Kick', lane: 'kick' });
    registerEvent({ time: bar * 4 + 1, duration: 0.25, label: 'Snare', lane: 'snare' });
    registerEvent({ time: bar * 4 + 3, duration: 0.25, label: 'Snare', lane: 'snare' });
    for (var e = 0; e < 8; e++) {
      registerEvent({ time: bar * 4 + e * 0.5, duration: 0.125, label: 'Hat', lane: 'hats' });
    }
  }

  var kickPart = new Tone.Part(function(time, note) {
    kick.triggerAttackRelease('C1', '8n', time);
  }, [
    [0, 'C1'], [0.5, 'C1'], [2, 'C1'], [2.5, 'C1'],
    [4, 'C1'], [4.5, 'C1'], [6, 'C1'], [6.5, 'C1'],
    [8, 'C1'], [8.5, 'C1'], [10, 'C1'], [10.5, 'C1'],
    [12, 'C1'], [12.5, 'C1'], [14, 'C1'], [14.5, 'C1']
  ]);
  kickPart.loop = true;
  kickPart.loopEnd = bars + 'm';
  kickPart.start(0);
  parts.push(kickPart);

  var snarePart = new Tone.Part(function(time) {
    snare.triggerAttackRelease('8n', time);
  }, [
    [1, 0], [3, 0], [5, 0], [7, 0], [9, 0], [11, 0], [13, 0], [15, 0]
  ]);
  snarePart.loop = true;
  snarePart.loopEnd = bars + 'm';
  snarePart.start(0);
  parts.push(snarePart);

  var hatSub = new Tone.Loop(function(time) {
    if (Math.random() < 0.7) hat.triggerAttackRelease('32n', time);
  }, '8n').start(0);
  loops.push(hatSub);

  var minor = ['C2', 'Eb2', 'F2', 'G2', 'Bb2', 'C3'];
  var bassNotes = [[0, 0], [0.5, 1], [1, 2], [2, 0], [2.5, 1], [3, 3], [4, 0], [4.5, 1], [5, 2], [6, 1], [7, 2], [8, 0], [8.5, 1], [9, 2], [10, 0], [10.5, 1], [11, 3], [12, 0], [12.5, 1], [13, 2], [14, 1], [15, 2]];
  for (var i = 0; i < bassNotes.length; i++) {
    var t = bassNotes[i][0];
    var idx = bassNotes[i][1];
    var bar = Math.floor(t / 4);
    var beat = (t % 4);
    registerEvent({ time: bar * 4 + beat, duration: 0.5, label: minor[idx], lane: 'bass' });
  }
  var bassPart = new Tone.Part(function(time, note) {
    bass.triggerAttackRelease(note, '8n', time);
  }, bassNotes.map(function(b) { return [b[0], minor[b[1]]]; }));
  bassPart.loop = true;
  bassPart.loopEnd = bars + 'm';
  bassPart.start(0);
  parts.push(bassPart);

  return {
    dispose: function() {
      loops.forEach(function(l) { l.dispose(); });
      parts.forEach(function(p) { p.dispose(); });
      nodes.forEach(function(n) { if (n.dispose) n.dispose(); });
    }
  };
}
`
