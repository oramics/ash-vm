(function (exports) {
'use strict';

// # AudioVM utilities

// ## Array utilities

const isArray = Array.isArray;

// get last element from an array
function last(array) {
  return array[array.length - 1];
}

// ## Stack utilities

// push a value into a stack


// pop a value from the stack


// get the next value of the stack without remove it

// # Commands


// ## Core

// This are the core operations: execute instructions, modify
// process time and context variables

// | Name | Description | Example |
// |------|-------------|---------|
// | **@dup** | Duplicate item (so you can use it twice) | `10,@dup` |
// | **@execute** | Execute an instruction | `10,'dup','@execute'` |
// | **@** | Alias of @execute | `10,'dup','@'` |
// | **@let** | Assign a value to the local context | `10,'repetitions',@let` |
// | **@set** | Assign a value to the global context | `10,'parts',@set` |
// | **@get** | Push the value of a variable into the stack | `'repetitions',@get` |
// | **@wait** | Wait an amount of time | `1,@wait` |
// | **@fork** | Fork | `@fork, [0.5, '@wait', '@kick']` |
const core = {
  "@dup": ({ stack }) => stack.push(last(stack)),
  "@execute": ({ stack }, { error }) => {
    const instr = stack.pop();
    if (typeof instr !== "string")
      error("Trying to execute something that is not a string: " + instr);
    else
      stack.push("@" + instr);
  },
  "@": "@execute",

  "@let": ({ stack, context }) => context.let(stack.pop(), stack.pop()),
  "@set": ({ stack, context }) => context.set(stack.pop(), stack.pop()),
  "@get": ({ stack, context }) => stack.push(context.get(stack.pop())),

  "@wait": process => process.wait(Math.abs(Number(process.stack.pop()))),

  "@fork": (proc, { error, fork }) => {
    const { operations, scheduler } = proc;
    const pattern = operations.pop();

    if (!isArray(pattern)) error("Fork error - not valid pattern: " + pattern);
    else fork(proc, pattern);
  }
};

// ## Repeat and loop

// | Name | Description | Example |
// |------|-------------|---------|
// | **@repeat** | Repeat a pattern | `4, @repeat, ['@kick', 0.5, '@wait']` |
const repetition = {
  "@repeat": ({ stack, operations }) => {
    const repetitions = stack.pop();
    const pattern = last(operations);
    if (!isArray(pattern)) throw Error("Can't repeat: " + pattern);
    for (let i = 1; i < repetitions; i++) {
      operations.push(pattern);
    }
  },
  "@forever": ({ operations }) => {
    const pattern = last(operations);
    if (!isArray(pattern)) throw Error("Can't forover: " + pattern);
    if (pattern.length) {
      operations.push("@forever");
      operations.push(pattern);
    }
  },
  "@loop": proc => {
    const { operations, scheduler } = proc;
    const pattern = operations.pop();
    if (!scheduler) throw Error("Can't loop without an scheduler");
    if (!isArray(pattern))
      throw Error("Can't loop something is not a pattern: " + pattern);
    scheduler.fork(proc, ["@forever", pattern]);
  }
};

// ## Arithmetic

// A generic operation that pops one value and pushes on result
const op1 = fn =>
  ({ stack }) => {
    stack.push(fn(stack.pop()));
  };

// A generic operation that pops two values and pushes one result
const op2 = fn =>
  ({ stack }) => {
    stack.push(fn(stack.pop(), stack.pop()));
  };

// a modulo operation that handles negative n more appropriately
// e.g. wrap(-1, 3) returns 2
// see http://en.wikipedia.org/wiki/Modulo_operation
// see also http://jsperf.com/modulo-for-negative-numbers
const wrap = (a, b) => (a % b + b) % b;

const arithmetic = {
  "@+": op2((a, b) => a + b),
  add: "@+",
  "@-": op2((a, b) => a - b),
  "@sub": "@-",
  "@*": op2((a, b) => a * b),
  "@mul": "@*",
  "@/": op2((a, b) => b === 0 ? 0 : a / b),
  "@div": "@/",
  "@%": op2((a, b) => b === 0 ? 0 : wrap(a, b)),
  "@wrap": "@%",
  "@mod": op2((a, b) => b === 0 ? 0 : a % b),
  "@neg": op1(a => -a)
};

// ## Conditionals
// _should they return 1 and 0 instead of bools?_

const logic = {
  "@cond": ({ stack, instructions }) => {
    const test = stack.pop();
    // this is the pattern to execute if the test passes
    const success = instructions.pop();
    // the next pattern is the "else" part
    if (test) {
      // remove the "else" part
      instructions.pop();
      instructions.push(success);
    }
  },
  "@>": op2((a, b) => a > b),
  "@>=": op2((a, b) => a >= b),
  "@<": op2((a, b) => a < b),
  "@<=": op2((a, b) => a <= b),
  "@==": op2((a, b) => a === b),
  "@!=": op2((a, b) => a !== b),
  "@!": op1(a => !a),
  "@not": "@!",
  "@&&": op2((a, b) => a && b),
  "@and": "@&&",
  "@||": op2((a, b) => a || b),
  "@or": "@||"
};

// ## Debug operations

// | Name | Description | Example |
// |------|-------------|---------|
// | **@print** | Print the last value of the stack | `10,@print` |
const debug = {
  "@print": (proc, { log }) => {
    const stack = proc.stack;
    const last$$1 = stack.length ? stack.pop() : "<Empty Stack>";
    log("@print", last$$1, "(id, time)", proc.id, proc.time);
  }
};

const all$1 = [core, repetition, arithmetic, logic, debug];

// # Virtual Machine

const defaultActions = {
  log: console.log.bind(console),
  error: console.error.bind(console)
};

class VM$1 {
  // plugins is an array of plugins: objects with `{ commands, actions }`
  constructor (plugins = []) {
    this.scheduler = new Scheduler();

    // commands are a map of instructions to commands with the form:
    // `{ '@instruction': (proc, actions) => ... }`
    this.commands = {};
    // actions are available to the commands
    this.actions = Object.assign({}, defaultActions);
    // the scheduler itself is a plugin (has commands and actions)
    this.usePlugin(scheduler);
    plugins.forEach(plugin => this.usePlugin(plugin));
  }

  run (program, delay, rate) {
    this.scheduler.schedule(program, delay, rate);
  }

  // advance the virtual machine by a time ammount
  tick (duration) {
    this.scheduler.resume(duration, this.commands, this.actions);
  }

  // A plugin is an object with two properties:
  // - commands: a map of instructions to commands
  // - actions: a map of actions names to actions
  usePlugin (plugin) {
    Object.assign(this.commands, plugin.commands);
    Object.assign(this.actions, plugin.actions);
  }
}

let sampleRate = null;
let bpm2bpa = null;
let vms = null;
let instruments = null;
let commands$1 = null;

function gibberish$1(Gibberish) {
  if (sampleRate === null) {
    Gibberish.init();
    sampleRate = Gibberish.context.sampleRate;
    bpm2bpa = 1 / (60 * sampleRate);
    instruments = createInstruments(Gibberish, instConfig);
    commands$1 = createCommands(instruments, cmdConfig);
    Gibberish.sequencers.push({ tick });
  }

  return function init(vm) {
    vms.push(vm);
    vm.addPlugin({ actions, commands: commands$1 });
    return Gibberish
  };
}

// The Gibberish sequencer that controlls all
const instConfig = {
  Kick: { decay: 0.2 },
  Snare: { snappy: 1.5 },
  Hat: { amp: 1.5 },
  Conga: { amp: 0.25, freq: 400 },
  Tom: { amp: 0.25, freq: 400 },
  PolyKarplusStrong: { maxVoices: 32 },
  MonoSynth: {
    attack: 44,
    decay: 0.25, // FIXME(danigb) -- it was: Gibberish.Time.beats(0.25),
    filterMult: 0.25,
    octave2: 0,
    octave3: 0
  }
};
// Given a instruments configuration, create the Giberish instruments
function createInstruments(Gibberish, config) {
  return Object.keys(config).reduce(
    (instruments, name) => {
      // Create the instrument with the given configuration and connect
      const inst = new Gibberish[name](config[name]).connect();
      instruments[name] = inst;
      return instruments;
    },
    {}
  );
}

// ## Commands

// A trigger function receives the instrument and the parameters
const tr1 = (inst, p) => inst.note(p);
// trigger an instrument with 2 params
const tr2 = (inst, p1, p2) => inst.note(p1, p2);
// the bass is only triggered if the frequency is positive
// the bass is only triggered if the frequency is positive
const trBass = (bass, amp, freq) => {
  if (freq > 0) bass.note(amp, freq);
};
// trigger the pluck requires adjust dump and compensate volume
const trPluck = (strings, amp, freq, sampleRate) => {
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
  pluck: ["Pluck", "amp", "freq", trPluck],
  bass: ["Bass", "amp", "freq", trBass],
  kick: ["Kick", "amp", null, tr1],
  snare: ["Snare", "amp", null, tr1],
  hat: ["Hat", "amp", null, tr1],
  conga: ["Conga", "amp", "freq", tr2],
  tom: ["Tom", "amp", "freq", tr2]
};

function createCommands(instruments, config) {
  return Object.keys(config).reduce(
    (cmds, name) => {
      const cmdConfig = config[name];
      const inst = instruments[cmdConfig[0]];
      cmds["@" + name] = fromScope(inst, cmdConfig);
      cmds["@" + name + "-note"] = fromStack(inst, cmdConfig);
      return cmds;
    },
    {}
  );
}

// Create an instrument command that get the parameters from scope
// example: `['@pluck']`
function fromScope(inst, [_, name1, name2, trigger]) {
  return ({ scope }) => trigger(inst, scope.get(name1), scope.get(name2));
}

// Create an instrument command that get the parameters from the stack
// example: `[0.2, 05, '@pluck-note']`
function fromStack(inst, [_, name1, name2, trigger]) {
  return ({ stack }) =>
    trigger(inst, stack.pop(), name2 ? stack.pop() : undefined);
}

// # Audio Virtual Machine

// The main purpose of the virtual machine is to run processes concurrently

// ## Architecture Overview

// A **scheduler** is a collection of processes. Each **process** mantains
// an internal time value that can be modified.

// ## API

function init (Gibberish, ...plugins) {
  if (!commands) commands = all;
  const vm = new VM(plugins);
  const initAudio = gibberish(Gibberish);
  initAudio(vm);
  return vm.run.bind(vm)
}

exports.init = init;
exports.VM = VM$1;
exports.all = all$1;
exports.gibberish = gibberish$1;

}((this.AudioVM = this.AudioVM || {})));
