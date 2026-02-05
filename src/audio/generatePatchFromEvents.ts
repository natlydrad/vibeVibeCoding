import type { ScheduledEvent } from './types'

const BARS = 4
const LANES = ['kick', 'snare', 'hats', 'bass']

/**
 * Generate buildPatch source code from a list of timeline events.
 * Produces a minimal patch with kick, snare, hats, bass that plays exactly these events.
 */
export function generatePatchFromEvents(events: ScheduledEvent[]): string {
  const byLane: Record<string, ScheduledEvent[]> = {}
  for (const lane of LANES) {
    byLane[lane] = events.filter((e) => e.lane === lane).sort((a, b) => a.time - b.time)
  }

  const lines: string[] = []
  lines.push('export function buildPatch(ctx) {')
  lines.push('  var Transport = ctx.Transport;')
  lines.push('  var registerEvent = ctx.registerEvent;')
  lines.push('  var destination = ctx.destination;')
  lines.push('  var bpm = ctx.bpm;')
  lines.push('  var volume = ctx.volume !== undefined ? ctx.volume : 0;')
  lines.push('')
  lines.push('  var nodes = [];')
  lines.push('  var parts = [];')
  lines.push('')
  lines.push('  var vol = new Tone.Volume(volume).connect(destination);')
  lines.push('  nodes.push(vol);')
  lines.push('')
  lines.push('  var kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.5 } }).connect(vol);')
  lines.push('  nodes.push(kick);')
  lines.push('  var snare = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 } }).connect(vol);')
  lines.push('  nodes.push(snare);')
  lines.push('  var hat = new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.05, release: 0.05 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 0.5 }).connect(vol);')
  lines.push('  nodes.push(hat);')
  lines.push('  var bass = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 } }).connect(vol);')
  lines.push('  nodes.push(bass);')
  lines.push('')
  lines.push('  events.forEach(function(e) { registerEvent(e); });')
  lines.push('  var kickEvents = ' + JSON.stringify(byLane['kick'].map((e) => [e.time, 'C1'])))
  lines.push('  var snareEvents = ' + JSON.stringify(byLane['snare'].map((e) => [e.time, 0])))
  lines.push('  var hatEvents = ' + JSON.stringify(byLane['hats'].map((e) => [e.time, 0])))
  lines.push('  var bassEvents = ' + JSON.stringify(byLane['bass'].map((e) => [e.time, e.label])))
  lines.push('')
  lines.push('  var kickPart = new Tone.Part(function(time, note) { kick.triggerAttackRelease(note, "8n", time); }, kickEvents);')
  lines.push('  kickPart.loop = true;')
  lines.push('  kickPart.loopEnd = ' + BARS + ' + "m";')
  lines.push('  kickPart.start(0);')
  lines.push('  parts.push(kickPart);')
  lines.push('')
  lines.push('  var snarePart = new Tone.Part(function(time) { snare.triggerAttackRelease("8n", time); }, snareEvents);')
  lines.push('  snarePart.loop = true;')
  lines.push('  snarePart.loopEnd = ' + BARS + ' + "m";')
  lines.push('  snarePart.start(0);')
  lines.push('  parts.push(snarePart);')
  lines.push('')
  lines.push('  var hatPart = new Tone.Part(function(time) { hat.triggerAttackRelease("32n", time); }, hatEvents);')
  lines.push('  hatPart.loop = true;')
  lines.push('  hatPart.loopEnd = ' + BARS + ' + "m";')
  lines.push('  hatPart.start(0);')
  lines.push('  parts.push(hatPart);')
  lines.push('')
  lines.push('  var bassPart = new Tone.Part(function(time, note) { bass.triggerAttackRelease(note, "8n", time); }, bassEvents);')
  lines.push('  bassPart.loop = true;')
  lines.push('  bassPart.loopEnd = ' + BARS + ' + "m";')
  lines.push('  bassPart.start(0);')
  lines.push('  parts.push(bassPart);')
  lines.push('')
  lines.push('  return { dispose: function() { parts.forEach(function(p) { p.dispose(); }); nodes.forEach(function(n) { if (n.dispose) n.dispose(); }); } };')
  lines.push('}')
  const code = lines.join('\n')

  // We need to inject the events array into the patch so registerEvent gets called for each
  const withEvents = code.replace(
    'events.forEach(function(e) { registerEvent(e); });',
    'var events = ' + JSON.stringify(events) + ';\n  events.forEach(function(e) { registerEvent(e); });'
  )
  return withEvents
}
