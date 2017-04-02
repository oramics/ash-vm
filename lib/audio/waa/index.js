/* global AudioContext */
const timeToBeats = (time, bpm) => time * bpm / 60
const beatsToTime = (beats, bpm) => beats * 60 / bpm

const ERR_INSTRUMENT_NOT_FOUND = "Instrument not found: "

export default function waa (options = {}) {
  const ac = options.context || new AudioContext()
  const driver = {
    paused: false,
    bpm: options.bpm || 120,
    instruments: {
      pluck: (time, ctx) => synth(ac, time, ctx.get("freq"), ctx.get("amp"), 0.5),
      hat: (time, ctx) => synth(ac, time, 4000, 0.2, 0.1),
      kick: (time, ctx) => synth(ac, time, 100, 1, 0.2),
      snare: (time, ctx) => synth(ac, time, 476, 0.6, 0.2),
      tom: (time, ctx) => synth(ac, time, 200, 0.4, 0.4),
    }
  }

  driver.stop = () => clearInterval(driver.seq)

  const step = 0.1
  const dur = timeToBeats(step, driver.bpm)
  return function (vm) {
    const zero = ac.currentTime
    clock(ac, time => {
      vm.resume(dur)
    }, step)
    vm.audio = driver
    return {
      "@play": ({ time, context, error }) => {
        const when = beatsToTime(time, driver.bpm) + zero
        const inst = context.get("inst")
        const trigger = driver.instruments[inst]
        if (!trigger) error("@play", ERR_INSTRUMENT_NOT_FOUND, inst)
        else trigger(when, context)
      }
    }
  }
}

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

// A minimalistic synth (mostly for testing)
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
