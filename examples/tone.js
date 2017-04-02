const Tone = require("tone")
const AshVM = require("..")
const programs = require("./programs.json")

const options = {
  bpm: 120,
  onfork: ({ proc, program }) => console.log("FORK", proc.id, program),
  onended: ({ proc }) => console.log("ENDED", proc)
}
const vm = AshVM.init(tonejs(Tone, options), options)

vm.run(programs["scale"])
// vm.run(["@loop", ["@pluck", 1, "@wait"]])

window.onclick = () => {
  Tone.Transport.stop()
  vm.stopAll()
}

function tonejs (Tone, options = {}) {
  const driver = initToneJSAudioDriver(Tone, options)
  initSounds(driver)

  const secs = 1
  const dur = driver.timeToBeats(secs)
  console.log("Each tick will resume in beats: ", dur)
  return function (vm) {
    driver.zero = null
    driver.sequencer = Tone.Transport.scheduleRepeat(time => {
      console.log("TICK", time, driver.zero, Tone.Transport.now())
      if (driver.zero === null) driver.zero = time + Tone.Transport.now()
      vm.resume(dur)
    }, dur, 0.1)
    Tone.Transport.start()
    vm.audio = driver
    return createCommands(driver, vm)
  }
}

function createCommands (driver, vm) {
  return {
    "@play": ({ time, context }) => {
      const inst = driver.sound(context.get("inst"))
      const inSeconds = driver.beatsToTime(time) + driver.zero
      console.log("@play", time, inSeconds, 'now', Tone.Transport.now())
      if (inst) inst(inSeconds, context)
    }
  }
}

function initToneJSAudioDriver (Tone, options) {
  let bpm = options.bpm || 100
  const sounds = {}

  return {
    bpm (value) {
      if (arguments.length === 0) return bpm
      else bpm = value
    },
    timeToBeats (time) {
      return time * bpm / 60
    },
    beatsToTime (beats) {
      return beats * 60 / bpm
    },
    sound (name, instrument, options, trigger) {
      if (arguments.length === 1) return sounds[name]
      const inst = new Tone[instrument](options)
      inst.toMaster()
      sounds[name] = (time, context) => {
        trigger(inst, time, context)
      }
    }
  }
}

function initSounds (driver) {
  driver.sound("pluck", "PluckSynth", {}, (inst, time, ctx) => {
    const freq = ctx.get("freq")
    const dur = ctx.get("dur") || 0.5
    inst.triggerAttackRelease(freq, dur, time)
  })
  driver.sound("hat", "NoiseSynth", {
    "volume": -10,
    "filter": {
      "Q": 1
    },
    "envelope": {
      "attack": 0.01,
      "decay": 0.15
    },
    "filterEnvelope": {
      "attack": 0.01,
      "decay": 0.03,
      "baseFrequency": 4000,
      "octaves": -2.5,
      "exponent": 4,
    }
  }, (inst, time, ctx) => {
    inst.triggerAttack(time)
  })
}
