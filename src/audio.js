import { Scheduler } from './scheduler'
import { defaultOperator } from './operator'

let sampleRate = null
let bpm2time = null
let instrumentCmds = null

// The audio is initialized the first time an Audio object is created
function initAudio (Gibberish) {
  // prevent multiple initializations
  if (sampleRate === null) {
    Gibberish.init()
    sampleRate = Gibberish.context.sampleRate
    bpm2time = 1 / (60 * sampleRate)
    const inst = initInstruments(Gibberish, instConfig)
    instrumentCmds = createCommands(inst, cmdConfig)
  }
}

export class Audio {
  constructor (Gibberish, bpm = 100) {
    initAudio(Gibberish)
    this.schedulers = []
    this.commands = []
    this.bpm = bpm
    Gibberish.sequencers.push(this)
  }
  tick (t) {
    while (this.commands.length > 0) {
      const cmd = this.commands.shift()
      cmd()
    }
    const len = this.schedulers.length
    const duration = this.bpm * bpm2time
    for (let i = 0; i < len; i++) {
      this.schedulers[i].tick(duration)
    }
  }
  start (program, operator = defaultOperator) {
    const withInstruments = operator.use(instrumentCmds)
    const s = new Scheduler(withInstruments)
    s.run(program)
    this.schedulers.push(s)
    return s
  }
}

// This is the instruments configuration
const instConfig = {
  'Kick': { decay: 0.2 },
  'Snare': {snappy: 1.5},
  'Hat': {amp: 1.5},
  'Conga': {amp: 0.25, freq: 400},
  'Tom': {amp: 0.25, freq: 400},
  'PolyKarplusStrong': {maxVoices: 32},
  'MonoSynth': {
    attack: 44,
    decay: 0.25, // FIXME(danigb) -- it was: Gibberish.Time.beats(0.25),
    filterMult: 0.25,
    octave2: 0,
    octave3: 0
  }
}

// **Trigger functions**

// A trigger function receives the instrument and the parameters
const tr1 = (inst, p) => inst.note(p)
// trigger an instrument with 2 params
const tr2 = (inst, p1, p2) => inst.note(p1, p2)
// the bass is only triggered if the frequency is positive
// the bass is only triggered if the frequency is positive
const trBass = (bass, amp, freq) => {
  if (freq > 0) bass.note(amp, freq)
}
// trigger the pluck requires adjust dump and compensate volume
const trPluck = (strings, amp, freq, sampleRate) => {
  if (freq > 0) {
    // This is not in any way accurate, just a hack to make @set-dur do something semi-meaningful
    strings.damping = 1 - -6 / Math.log(freq / sampleRate)
    // Strings by default seem too quiet:
    strings.note(freq, amp * amp * 2)
  }
}

// ## Instrument commands

// | Name | Description | Example |
// |------|-------------|---------|
// | **@pluck** | Trigger a string sound | `@pluck` |
// | **@pluck-note** | Trigger a string sound passing parameters | `freq, amp, @pluck` |
// | **@bass** | Trigger a bass sound | `@bass` |
// | **@bass-note** | Trigger a bass sound passing parameters | `freq, amp, @bass` |
const cmdConfig = {
  'pluck': ['Pluck', 'amp', 'freq', trPluck],
  'bass': ['Bass', 'amp', 'freq', trBass],
  'kick': ['Kick', 'amp', null, tr1],
  'snare': ['Snare', 'amp', null, tr1],
  'hat': ['Hat', 'amp', null, tr1],
  'conga': ['Conga', 'amp', 'freq', tr2],
  'tom': ['Tom', 'amp', 'freq', tr2]
}

// Given a instruments configuration, create the Giberish instruments
function initInstruments (Gibberish, config) {
  return Object.keys(config).reduce((instruments, name) => {
    // Create the instrument with the given configuration and connect
    const inst = new Gibberish[name](config[name]).connect()
    instruments[name] = inst
    return instruments
  }, {})
}

function createCommands (instruments, config) {
  return Object.keys(config).reduce((cmds, name) => {
    const cmdConfig = config[name]
    const inst = instruments[cmdConfig[0]]
    cmds['@' + name] = fromScope(inst, cmdConfig)
    cmds['@' + name + '-note'] = fromStack(inst, cmdConfig)
    return cmds
  }, {})
}

// Create an instrument command that get the parameters from scope
// example: `['@pluck']`
function fromScope (inst, [_, name1, name2, trigger]) {
  return ({ scope }) => trigger(inst, scope.get(name1), scope.get(name2))
}

// Create an instrument command that get the parameters from the stack
// example: `[0.2, 05, '@pluck-note']`
function fromStack (inst, [_, name1, name2, trigger]) {
  return ({ stack }) => trigger(inst, stack.pop(), name2 ? stack.pop() : undefined)
}
