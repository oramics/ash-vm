// # Audio Driver

// The audio driver has two tasks:
// 1. Control the time by calling `resume` on the VM
// 2. Create and play instruments

export default class AudioDriver {
  constructor (bpm, sampleRate) {
    if (!bpm) throw Error("AudioDriver bpm is required")
    if (!sampleRate) throw Error("AudioDriver sampleRate is required")
    this.bpm = bpm
    this.sampleRate = sampleRate
    this.instruments = {}
  }

  addInstruments (instruments) {
    Object.assign(this.instruments, instruments)
    return this.instruments
  }

  getInstruments () {
    return this.instruments
  }

  defaultContext () {
    return { freq: 440, amp: 0.5 }
  }

  start (scheduler) {
    if (this.scheduler) throw Error("Can't attach an audio driver twice")
    if (scheduler.audio) throw Error("The given scheduler has an audio driver already")
    this.scheduler = scheduler
    scheduler.audio = this
  }
}
