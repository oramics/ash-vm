// # Audio Driver

export const ERR_INST_MISSING = name => `Instrument "${name}" not found.`

// The audio driver has two tasks:
// 1. Control the time by calling `resume` on the VM
// 2. Create and play instruments

export class AudioDriver {
  constructor (bpm, sampleRate) {
    if (!bpm) throw Error("AudioDriver bpm is required")
    if (!sampleRate) throw Error("AudioDriver sampleRate is required")
    this.bpm = bpm
    this.sampleRate = sampleRate
    this.instruments = {}
    this.commands = initCommands(this)
  }

  addInstruments (instruments) {
    Object.assign(this.instruments, instruments)
    return this.instruments
  }

  start (vm) {
    if (this.vm) throw Error("Can't attach the same audio driver to different VM")
    if (vm.audio) throw Error("The given VM has an audio driver already")
    this.vm = vm
    vm.audio = this
    vm.addContext({ freq: 440, amp: 0.5 })
    vm.addCommands(this.commands)
  }
}

// ## Audio driver commands

const initCommands = driver => ({
  // **@play**: Trigger a note. It uses the context to select the appropiate
  // voice and parameters
  // `"@play"`
  "@play": ({ context, error }) => {
    const instName = context.get("voice")
    const instrument = driver.instruments[instName]
    if (instrument) {
      instrument(context)
    } else {
      error(ERR_INST_MISSING(instName))
    }
  },
  // **@set-bpm**: Change the global tempo
  // `120, "@set-bpm"`
  "@set-bpm": ({ stack }) => {
    const bpm = parseFloat(stack.pop(), 10)
    if (bpm > 0) driver.bpm = bpm
  },
  "@scale-tempo": ({ stack }) => {
    const factor = parseFloat(stack.pop(), 10)
    if (factor) driver.bpm = driver.bpm * factor
  }
})
