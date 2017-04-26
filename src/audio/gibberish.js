// # Gibberish Audio Driver
import AudioDriver from "../audio-driver"

// This driver uses Gibberish both for scheduling and sounds

export default class GibberishDriver extends AudioDriver {
  constructor (Gibberish, { bpm = 100 } = {}) {
    if (!Gibberish.context) Gibberish.init()
    super(bpm, Gibberish.context.sampleRate)
    this.Gibberish = Gibberish
    this.instruments = createInstruments(Gibberish)
  }

  // Start a VM
  start (scheduler) {
    super.start(scheduler)
    // convert bmp to beats per audio sample
    const bpm2bpa = 1 / (60 * this.sampleRate)
    // tick is binded to this
    const tick = () => {
      scheduler.resume(this.bpm * bpm2bpa)
    }
    this.Gibberish.sequencers.push({ tick })
  }
}

// # Instruments

// Create a trigger function for a percussion instrument
const perc = (inst, gain) => (ctx) => {
  inst.amp = gain * ctx.get("amp")
  inst.note()
}

// Create a trigger function for a tuned percussion instrument
const pitched = (inst, gain) => (ctx) => {
  inst.amp = gain * ctx.get("amp")
  inst.pitch = ctx.get("freq")
  inst.note()
}

// Create the basic instruments using Gibberish
function createInstruments (Gibberish) {
  // The actual instruments
  const kick = new Gibberish.Kick({ decay: 0.2 }).connect()
  const snare = new Gibberish.Snare({ snappy: 1.5 }).connect()
  const hat = new Gibberish.Hat({ amp: 1.5 }).connect()
  const conga = new Gibberish.Conga({ amp: 0.25, freq: 400 }).connect()
  const tom = new Gibberish.Tom({ amp: 0.25, freq: 400 }).connect()
  const pluck = new Gibberish.PolyKarplusStrong({maxVoices: 32}).connect()
  const bass = new Gibberish.MonoSynth({
    attack: 44,
    decay: Gibberish.Time.beats(0.25),
    filterMult: 0.25,
    octave2: 0,
    octave3: 0
  }).connect()
  const sampleRate = Gibberish.sampleRate

  // The instrument trigger functions
  return {
    kick: perc(kick, 0.5),
    snare: perc(snare, 0.25),
    hat: perc(hat, 1),
    conga: pitched(conga, 0.25),
    tom: pitched(tom, 0.25),
    pluck: (ctx) => {
      const amp = ctx.get("amp")
      const freq = ctx.get("freq")
      if (freq > 0) {
        // this is not in any way accurate, just a hack to make @set-dur do something semi-meaningful
        pluck.damping = 1 - (-6 / Math.log(freq / sampleRate))
        // pluck by default seem too quiet:
        pluck.note(freq, amp * amp * 2)
      }
    },
    bass: (ctx) => {
      const velocity = ctx.get("amp")
      const freq = ctx.get("freq")
      if (freq > 0) bass.note(freq, velocity)
    }
  }
}
