// # Gibberish audio audio
import { isDef } from "../../utils"

const ERR_INST_MISSING = name => `Instrument "${name}" not found.`

// Create an object with instrument definitions.
// The instruments are created lazy
const instruments = Gibberish => ({
  kick: {
    params: ["amp", "pitch", "decay", "tone"],
    init: () => new Gibberish.Kick({ decay: 0.2 }).connect()
  },
  snare: {
    params: ["amp", "tune", "cutoff", "snappy"],
    init: () => new Gibberish.Snare({ snappy: 1.5 }).connect()
  },
  hat: {
    params: ["amp", "pitch"],
    init: () => new Gibberish.Hat({ amp: 1.5 }).connect()
  },
  conga: {
    params: ["amp", "pitch"],
    init: () => new Gibberish.Conga({ amp: 0.25, freq: 400 }).connect()
  },
  clave: {
    params: ["amp", "pitch"],
    init: () => new Gibberish.Clave({ amp: 1 }).connect()
  },
  tom: {
    params: ["amp", "pitch"],
    init: () => new Gibberish.Tom({ amp: 0.25, freq: 400 }).connect()
  },
  clap: {
    params: ["amp"],
    init: () => new Gibberish.Clap({ amp: 0.5 }).connect()
  },
  cowbell: {
    params: ["amp", "pitch"],
    init: () => new Gibberish.Cowbell({ amp: 0.5 }).connect()
  },
  pluck: {
    params: ["freq", "amp", "blend", "damping", "velocity"],
    init: () => new Gibberish.PolyKarplusStrong({ maxVoices: 32 }).connect(),
    prepare: (inst, context) => {
      const freq = context.get("freq")
      if (freq > 0) {
        inst.freq = freq
        inst.damping = 1 - (-6) / Math.log(freq / Gibberish.sampleRate)
      }
      const amp = context.get("amp")
      if (amp) inst.amp = amp * amp * 0.5
      const blend = context.get("blend")
      if (blend) inst.blend = blend
    }
  },
  bass: {
    params: ["freq", "amp", "resonance"],
    init: () => new Gibberish.MonoSynth({
      attack: 44,
      decay: Gibberish.Time.beats(0.25),
      filterMult: 0.25,
      octave2: 0,
      octave3: 0
    }).connect()
  }
})

// ## Audio commands

// | Name | Description | Example |
// |------|-------------|---------|
// | **@get-bpm** | Get the global tempo value | `"@pick", [1.25, 1.5, 0.75], "@get-bpm", "@*", "@set-bpm"` |
// | **@set-bpm** | Change the global tempo | `120, "@set-bpm"` |
// | **@play-note** | Trigger a note with params | `{ inst: "pluck", amp: 0.5}, "@note-params"` |
// | **@play** | Trigger a note | `"@note"` |
const initCommands = audio => ({
  "@play": ({ context, error }) => {
    const err = play(context, audio)
    if (err) error("@play", err)
  },
  "@play-note": ({ stack, context, error }) => {
    const props = stack.pop()
    const err = play(context.child(props), audio)
    if (err) error("@play-note", err)
  },
  "@set-bpm": ({ stack }) => {
    const bpm = parseFloat(stack.pop(), 10)
    if (bpm > 0) audio.bpm = bpm
  },
  "@scale-tempo": ({ stack }) => {
    const factor = parseFloat(stack.pop(), 10)
    if (factor) audio.bpm *= factor
  }
})

export default function init (Gibberish, options = {}) {
  const audio = initAudioDriver(Gibberish, options)
  audio.instruments = initInstruments(instruments(Gibberish))
  audio.commands = initCommands(audio)
  Gibberish.sequencers.push(sequencer(audio))

  return function (vm) {
    // Add the vm to the list of VMs
    audio.vms.push(vm)
    // Set the audio property to the audio driver
    vm.audio = audio
    return audio.commands
  }
}

// Prepare the instruments object. Replace the params with prepare
function initInstruments (instruments) {
  Object.keys(instruments).forEach(name => {
    const inst = instruments[name]
    if (!inst.prepare) {
      const params = inst.params || []
      inst.prepare = (inst, context) => {
        params.forEach(param => {
          let value = context.get(param)
          if (isDef(value)) {
            inst[param] = value
          }
        })
      }
    }
  })
  return instruments
}

function sequencer (audio) {
  const { vms, bpm2bpa } = audio
  return {
    tick () {
      const len = audio.vms.length
      const dur = audio.bpm * bpm2bpa
      if (len === 1) {
        vms[0].resume(dur)
      } else if (len > 1) {
        for (let i = 0; i < len; i++) {
          vms[i].resume(dur)
        }
      }
    }
  }
}

// Trigger an instrument
const play = (context, audio) => {
  const { instruments } = audio
  const instName = context.get("inst")
  const instrument = instruments[instName]
  if (!instrument) return ERR_INST_MISSING(instName)
  if (!instrument.instance) instrument.instance = instrument.init()

  const inst = instrument.instance
  instrument.prepare(inst, context)
  inst.freq ? inst.note(inst.freq) : inst.note()
}

// Init the audio driver
function initAudioDriver (Gibberish, { bpm = 100 }) {
  if (!Gibberish.context) Gibberish.init()
  return {
    Gibberish,
    bpm: bpm,
    sampleRate: Gibberish.context.sampleRate,
    bpm2bpa: 1 / (60 * Gibberish.context.sampleRate),
    vms: []
  }
}
