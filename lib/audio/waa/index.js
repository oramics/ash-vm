/* global AudioContext */
const timeToBeats = (time, bpm) => time * bpm / 60
const beatsToTime = (beats, bpm) => beats * 60 / bpm
import {
  osc, gain, connected, plug, adsr, polyphony, ampToGain
} from "./synth-kit"

const ERR_INSTRUMENT_NOT_FOUND = "Instrument not found: "

function initContext (ac) {
  // Shim to make connect chainable (soon to be implemented native)
  if (ac && ac.createGain) {
    var proto = Object.getPrototypeOf(Object.getPrototypeOf(ac.createGain()))
    var _connect = proto.connect
    proto.connect = function () {
      _connect.apply(this, arguments)
      return this
    }
  }
  return ac
}

export default function waa (options = {}) {
  const ac = initContext(options.context || new AudioContext())
  const driver = {
    paused: false,
    bpm: options.bpm || 120,
    instruments: {
      pluck: initPluck(ac)
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

function initSnare (ac) {
  const snare = connected({
    osc: white(ac),
    envelope: perc(ac),
    amp: gain(ac, { gain: 0 })
  })

  return function (time, ctx) {
    snare.set({ gain: ampToGain(+ctx.get("amp")) })
    snare.trigger(time)
  }
}

function initPluck (ac) {
  const synth = polyphony(() =>
    connected({
      osc: osc(ac, { start: 0 }),
      envelope: adsr(ac),
      amp: gain(ac, { gain: 0 })
    },
    ["osc", "envelope", "amp", ac.destination])
  )

  return function (time, ctx) {
    // synt().set({ freq: '', amp: ''}).trigger(time)
    const freq = ctx.get("freq")
    let amp = ampToGain(+ctx.get("amp"))
    console.log("pluck", freq, amp)
    const s = synth()
    plug(s.osc, "frequency", freq)
    plug(s.amp, "gain", amp)
    s.envelope.trigger(time)
  }
}
