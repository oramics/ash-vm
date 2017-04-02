/* global AudioContext */
const AshVM = require("..")
const programs = require("./programs.json")

const ac = new AudioContext()
const timeToBeats = (time, bpm) => time * bpm / 60
const beatsToTime = (beats, bpm) => beats * 60 / bpm

const options = {
  bpm: 100,
  onfork: ({ proc, program }) => console.log("FORK", proc.id, program),
  onended: ({ proc }) => console.log("ENDED", proc)
}
const vm = AshVM.init(waa(options), options)
vm.run(programs["modulate"])

window.onclick = () => {
  vm.run("@stop-all", false)
}

function clock (callback, time) {
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

function waa (options = {}) {
  const driver = {
    paused: false,
    bpm: options.bpm || 120,
    zero: null,
  }

  driver.stop = () => clearInterval(driver.seq)

  const step = 0.05
  const dur = timeToBeats(step, driver.bpm)
  return function (vm) {
    driver.zero = ac.currentTime + 0.5
    clock((time) => {
      vm.resume(dur)
    }, step)
    vm.audio = driver
    return {
      "@play": ({ time, context }) => {
        const when = beatsToTime(time, driver.bpm) + driver.zero
        // console.log("@play", time, when, ac.currentTime)
        pluck(when, context.get("freq"))
      }
    }
  }
}

const pluck = (time, freq) => {
  // console.log("@pluck", time, freq, ac.currentTime)
  const osc = ac.createOscillator()
  osc.frequency.value = freq
  osc.connect(ac.destination)
  osc.start(time)
  osc.stop(time + 0.1)
  return osc
}
