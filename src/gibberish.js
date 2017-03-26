let bpm = 100;
let sampleRate = null;
let bpm2bpa = null;
let vms = [];
let instruments = null;
let commands = null;

const instrumentCmds = {
  "@pluck": ({ stack }, { note }) => note("")
};

export function gibberish(Gibberish, vm) {
  if (arguments.length === 1) return vm => gibberish(Gibberish, vm);

  if (sampleRate === null) {
    Gibberish.init();
    sampleRate = Gibberish.context.sampleRate;
    bpm2bpa = 1 / (60 * sampleRate);
    instruments = createInstruments(Gibberish, instConfig);
    commands = createCommands(instruments, cmdConfig);
    Gibberish.sequencers.push(sequencer);
  }

  vms.push(vm);
  vm.usePlugin({ actions: instruments, commands });
  return Gibberish;
}

// The Gibberish sequencer that controlls all
const sequencer = {
  tick() {
    const len = vms.length;
    if (len === 0) return;
    const dur = bpm * bpm2bpa;
    for (let i = 0; i < len; i++) {
      vms[i].tick(dur);
    }
  }
};

// This is the instruments configuration
const instConfig = [
  ["kick", "Kick", { decay: 0.2 }],
  ["snare", "Snare", { snappy: 1.5 }],
  ["hat", "Hat", { amp: 1.5 }],
  ["conga", "Conga", { amp: 0.25, freq: 400 }],
  ["tom", "Tom", { amp: 0.25, freq: 400 }],
  ["pluck", "PolyKarplusStrong", { maxVoices: 32 }],
  [
    "bass",
    "MonoSynth",
    {
      attack: 44,
      decay: 0.25, // FIXME(danigb) -- it was: Gibberish.Time.beats(0.25),
      filterMult: 0.25,
      octave2: 0,
      octave3: 0
    }
  ]
];
// Given a instruments configuration, create the Giberish instruments
function createInstruments(G, config) {
  return config.reduce(
    (insts, [name, type, params]) => {
      insts[name] = new G[type](params).connect();
      return insts;
    },
    {}
  );
}

// ## Commands

// A trigger function receives the instrument and the parameters
const tr1 = (inst, amp) => {
  inst.amp = amp
  inst.note()
}
// trigger an instrument with 2 params
const tr2 = (inst, amp, freq) => {
  inst.amp = amp
  inst.freq = freq
  inst.note()
}
// the bass is only triggered if the frequency is positive
// the bass is only triggered if the frequency is positive
const trBass = (bass, amp, freq) => {
  if (freq > 0) bass.note(amp, freq);
};
// trigger the pluck requires adjust dump and compensate volume
const trPluck = (strings, amp, freq) => {
  if (freq > 0) {
    // This is not in any way accurate, just a hack to make @set-dur do something semi-meaningful
    strings.damping = 1 - -6 / Math.log(freq / sampleRate);
    // Strings by default seem too quiet:
    strings.note(freq, amp * amp * 2);
  }
};

// ## Instrument commands

// | Name | Description | Example |
// |------|-------------|---------|
// | **@pluck** | Trigger a string sound | `@pluck` |
// | **@pluck-note** | Trigger a string sound passing parameters | `freq, amp, @pluck` |
// | **@bass** | Trigger a bass sound | `@bass` |
// | **@bass-note** | Trigger a bass sound passing parameters | `freq, amp, @bass` |
const cmdConfig = {
  pluck: ["amp", "freq", trPluck],
  bass: ["amp", "freq", trBass],
  kick: ["amp", null, tr1],
  snare: ["amp", null, tr1],
  hat: ["amp", null, tr1],
  conga: ["amp", "freq", tr2],
  tom: ["amp", "freq", tr2]
};

function createCommands(instruments, config) {
  return Object.keys(config).reduce(
    (cmds, name) => {
      const cmdConfig = config[name];
      const inst = instruments[name];
      cmds["@" + name] = fromScope(inst, cmdConfig);
      cmds["@" + name + "-note"] = fromStack(inst, cmdConfig);
      return cmds;
    },
    {}
  );
}

// Create an instrument command that get the parameters from context
// example: `['@pluck']`
function fromScope(inst, [name1, name2, trigger]) {
  return ({ context }) => trigger(inst, context.get(name1), context.get(name2));
}

// Create an instrument command that get the parameters from the stack
// example: `[0.2, 05, '@pluck-note']`
function fromStack(inst, [name1, name2, trigger]) {
  return ({ stack }) =>
    trigger(inst, stack.pop(), name2 ? stack.pop() : undefined);
}
