/**
 * Rule: pattern matches user input, edit transforms code, message is the reply.
 */
export interface EditRule {
  pattern: RegExp | ((text: string) => boolean)
  edit: (code: string, bpm: number) => string
  message: string
  /** If set, stub assistant will apply this BPM to the engine. */
  setBpm?: (currentBpm: number) => number
}

export const rules: EditRule[] = [
  {
    pattern: /make it faster|faster|speed up|increase bpm/i,
    edit: (code) => code,
    message: 'Increased BPM for a faster tempo.',
    setBpm: (bpm) => Math.min(180, bpm + 15),
  },
  {
    pattern: /make it slower|slower|slow down|decrease bpm/i,
    edit: (code) => code,
    message: 'Decreased BPM for a slower tempo.',
    setBpm: (bpm) => Math.max(60, bpm - 15),
  },
  {
    pattern: /add swing|swing|groove/i,
    edit: (code) => {
      if (/Transport\.swing/.test(code)) {
        return code.replace(
          /(Transport\.swing\s*=\s*)[\d.]+/,
          '$10.1'
        )
      }
      return code.replace(
        /(var Transport = ctx\.Transport;)/,
        '$1\n  Transport.swing = 0.1;'
      )
    },
    message: 'Added swing to the transport for a groovier feel.',
  },
  {
    pattern: /more hats|more hi.?hats|increase hat/i,
    edit: (code) =>
      code.replace(
        /Math\.random\(\)\s*<\s*[\d.]+/,
        'Math.random() < 0.9'
      ),
    message: 'Increased hi-hat probability (more hats).',
  },
  {
    pattern: /fewer hats|less hats|reduce hat/i,
    edit: (code) =>
      code.replace(
        /Math\.random\(\)\s*<\s*[\d.]+/,
        'Math.random() < 0.5'
      ),
    message: 'Decreased hi-hat probability (fewer hats).',
  },
  {
    pattern: /darker|dark|low.?pass|filter/i,
    edit: (code) => {
      if (/Tone\.Filter|\.filter/.test(code)) {
        return code.replace(
          /(frequency|rolloff).*?[\d.]+/gi,
          'frequency: 800'
        )
      }
      return code.replace(
        /var vol = new Tone\.Volume\(volume\)\.connect\(destination\);?/,
        'var filter = new Tone.Filter(800, "lowpass").connect(destination);\n  var vol = new Tone.Volume(volume).connect(filter);'
      )
    },
    message: 'Lowered filter cutoff for a darker sound.',
  },
  {
    pattern: /add reverb|reverb|wet/i,
    edit: (code) => {
      if (/Tone\.Reverb|\.reverb/.test(code)) return code
      return code.replace(
        /var vol = new Tone\.Volume\(volume\)\.connect\(destination\);?/,
        'var reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).connect(destination);\n  var vol = new Tone.Volume(volume).connect(reverb);'
      )
    },
    message: 'Added reverb to the patch.',
  },
]
