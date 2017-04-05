// # Web Audio API Audio Driver
/* global AudioContext */
import { AudioDriver, ERR_INST_MISSING } from "./driver"

const timeToBeats = (time, bpm) => time * bpm / 60
const beatsToTime = (beats, bpm) => beats * 60 / bpm

export default function init (context, options = {}) {
  context = context || new AudioContext()
  const audio = new WebAudioDriver(context, options.bpm || 120)
  audio.addInstruments(createInstruments(context))
  return audio
}

// ## Audio driver
class WebAudioDriver extends AudioDriver {
  constructor (audioContext, bpm) {
    super(bpm, audioContext.sampleRate)
    this.ac = audioContext

    // override the **@play** command to provide `when` paramter to trigger
    this.commands["@play"] = ({ time, context, error }) => {
      const when = beatsToTime(time, this.bpm) + this.zero
      const inst = context.get("voice")
      const trigger = this.instruments[inst]
      if (!trigger) error("@play", ERR_INST_MISSING(inst))
      else trigger(context, when)
    }
  }

  start (vm) {
    super.start(vm)
    const step = 0.1
    this.zero = this.ac.currentTime
    clock(this.ac, (time) => {
      vm.resume(timeToBeats(step, this.bpm))
    }, step)
  }
}

// ## Scheduling
function clock (ac, callback, time) {
  const lookAhead = time || 0.1
  const updateInterval = lookAhead / 3
  let next = ac.currentTime + lookAhead
  const tick = () => {
    if (ac.currentTime + lookAhead >= next) {
      callback(next)
      next += lookAhead
    }
  }
  tick()
  return setInterval(tick, updateInterval)
}

// ## Instruments

// The Web Audio API driver comes with a very simple sound generator
// (mostly for testing)
function synth (ac, time, freq, amp, decay) {
  const osc = ac.createOscillator()
  osc.frequency.value = freq || 200
  osc.amp = ac.createGain()
  osc.amp.gain.value = 0
  osc.connect(osc.amp)
  osc.amp.connect(ac.destination)
  osc.start(time)
  osc.amp.gain.setValueAtTime(0, time)
  osc.amp.gain.linearRampToValueAtTime(amp * 0.5, time + 0.01)
  osc.amp.gain.linearRampToValueAtTime(0, time + decay)
  osc.stop(time + decay + 0.1)
  return osc
}

// Create instruments
const createInstruments = (ac) => ({
  kick: (ctx, time) => synth(ac, time, 100, 1, 0.2),
  snare: (ctx, time) => synth(ac, time, 476, 0.6, 0.2),
  hat: (ctx, time) => synth(ac, time, 4000, 0.2, 0.1),
  conga: (ctx, time) => synth(ac, time, 4000, 0.2, 0.1),
  tom: (ctx, time) => synth(ac, time, 200, 0.4, 0.4),
  pluck: (ctx, time) => synth(ac, time, ctx.get("freq"), ctx.get("amp"), 0.5),
  bass: (ctx, time) => synth(ac, time, 0.5 * ctx.get("freq"), ctx.get("amp"), 0.5),
})
