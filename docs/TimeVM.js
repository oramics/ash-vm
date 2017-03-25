(function (exports) {
'use strict';

// # Commands
var isPattern = Array.isArray;
var peek = function peek(stack) {
  return stack[stack.length - 1];
};

// Given a commands object, expand the aliases


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
var core = {
  "@dup": function dup(_ref) {
    var stack = _ref.stack;
    return stack.push(peek(stack));
  },
  "@execute": function execute(_ref2, _ref3) {
    var stack = _ref2.stack;
    var error = _ref3.error;

    var instr = stack.pop();
    if (typeof instr !== "string") error("Trying to execute something that is not a string: " + instr);else stack.push("@" + instr);
  },
  "@": "@execute",

  "@let": function _let(_ref4) {
    var stack = _ref4.stack,
        context = _ref4.context;
    return context.let(stack.pop(), stack.pop());
  },
  "@set": function set(_ref5) {
    var stack = _ref5.stack,
        context = _ref5.context;
    return context.set(stack.pop(), stack.pop());
  },
  "@get": function get(_ref6) {
    var stack = _ref6.stack,
        context = _ref6.context;
    return stack.push(context.get(stack.pop()));
  },

  "@wait": function wait(proc) {
    return proc.wait(Math.abs(Number(proc.stack.pop())));
  },

  "@stop-all": function stopAll(proc, _ref7) {
    var stop = _ref7.stop;
    return stop();
  },

  "@fork": function fork(proc, _ref8) {
    var error = _ref8.error,
        _fork = _ref8.fork;
    var instructions = proc.instructions;

    var pattern = instructions.pop();

    if (!isPattern(pattern)) error("Fork error - not valid pattern: " + pattern);else _fork(proc, pattern);
  }
};

var repetition = {
  "@repeat": function repeat(_ref9) {
    var stack = _ref9.stack,
        instructions = _ref9.instructions;

    var repetitions = stack.pop();
    var pattern = peek(instructions);
    if (!isPattern(pattern)) throw Error("Can't repeat: " + pattern);
    for (var i = 1; i < repetitions; i++) {
      instructions.push(pattern);
    }
  },
  "@forever": function forever(_ref10) {
    var instructions = _ref10.instructions;

    var pattern = peek(instructions);
    if (!isPattern(pattern)) throw Error("Can't forover: " + pattern);
    if (pattern.length) {
      instructions.push("@forever");
      instructions.push(pattern);
    }
  },
  "@loop": function loop(proc) {
    var instructions = proc.instructions,
        scheduler = proc.scheduler;

    var pattern = instructions.pop();
    if (!scheduler) throw Error("Can't loop without an scheduler");
    if (!isPattern(pattern)) throw Error("Can't loop something is not a pattern: " + pattern);
    scheduler.fork(proc, ["@forever", pattern]);
  }
};

// ## Iteration and lists
// | Name | Description | Example |
// |------|-------------|---------|
// | **@iter** | Iterate a pattern | `[["@iter", [0.3, 1]], "@set-amp"]` |
var lists = {
  "@iter": function iter(_ref11) {
    var instructions = _ref11.instructions;

    var pattern = instructions.pop();
    if (!isPattern(pattern) || !pattern.length) error("Can't iterate:", pattern);else {
      // Rotates the pattern and plays the first item only each time
      // remove '1st' item, schedule, then push to back:
      var first = pattern.splice(0, 1);
      instructions.push(first);
      pattern.push(first);
    }
  }
};

// ## Arithmetic

// A generic operation that pops one value and pushes on result
var op1 = function op1(fn) {
  return function (_ref12) {
    var stack = _ref12.stack;

    stack.push(fn(stack.pop()));
  };
};

// A generic operation that pops two values and pushes one result
var op2 = function op2(fn) {
  return function (_ref13) {
    var stack = _ref13.stack;

    stack.push(fn(stack.pop(), stack.pop()));
  };
};

// a modulo operation that handles negative n more appropriately
// e.g. wrap(-1, 3) returns 2
// see http://en.wikipedia.org/wiki/Modulo_operation
// see also http://jsperf.com/modulo-for-negative-numbers
var wrap = function wrap(a, b) {
  return (a % b + b) % b;
};

var arithmetic = {
  "@+": op2(function (a, b) {
    return a + b;
  }),
  add: "@+",
  "@-": op2(function (a, b) {
    return a - b;
  }),
  "@sub": "@-",
  "@*": op2(function (a, b) {
    return a * b;
  }),
  "@mul": "@*",
  "@/": op2(function (a, b) {
    return b === 0 ? 0 : a / b;
  }),
  "@div": "@/",
  "@%": op2(function (a, b) {
    return b === 0 ? 0 : wrap(a, b);
  }),
  "@wrap": "@%",
  "@mod": op2(function (a, b) {
    return b === 0 ? 0 : a % b;
  }),
  "@neg": op1(function (a) {
    return -a;
  })
};

// ## Conditionals
// _should they return 1 and 0 instead of bools?_

var logic = {
  "@cond": function cond(_ref14) {
    var stack = _ref14.stack,
        instructions = _ref14.instructions;

    var test = stack.pop();
    // this is the pattern to execute if the test passes
    var success = instructions.pop();
    // the next pattern is the "else" part
    if (test) {
      // remove the "else" part
      instructions.pop();
      instructions.push(success);
    }
  },
  "@>": op2(function (a, b) {
    return a > b;
  }),
  "@>=": op2(function (a, b) {
    return a >= b;
  }),
  "@<": op2(function (a, b) {
    return a < b;
  }),
  "@<=": op2(function (a, b) {
    return a <= b;
  }),
  "@==": op2(function (a, b) {
    return a === b;
  }),
  "@!=": op2(function (a, b) {
    return a !== b;
  }),
  "@!": op1(function (a) {
    return !a;
  }),
  "@not": "@!",
  "@&&": op2(function (a, b) {
    return a && b;
  }),
  "@and": "@&&",
  "@||": op2(function (a, b) {
    return a || b;
  }),
  "@or": "@||"
};

// ## Debug operations

// | Name | Description | Example |
// |------|-------------|---------|
// | **@print** | Print the last value of the stack | `10,@print` |
var debug = {
  "@print": function print(proc, _ref15) {
    var log = _ref15.log;

    var stack = proc.stack;
    var last = stack.length ? stack.pop() : "<Empty Stack>";
    log("@print", last, "(id, time)", proc.id, proc.time);
  }
};

var all = Object.assign({}, core, repetition, lists, arithmetic, logic, debug);

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



























var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

// # Process

var isCommand = function isCommand(o) {
  return typeof o === "string" && o[0] === "@";
};
var isProgram = Array.isArray;
var procId = 1;

// Processes are the principal computation unit. It departures from typical
// processes in that it model the concept of time
var Process = function () {
  function Process(program, context, time, rate) {
    classCallCheck(this, Process);

    this.id = "proc-" + procId++;
    // a stack of values
    this.stack = [];
    // the instructions are stored in a stack (in reverse order)
    this.instructions = program ? [program] : [];
    // the context is used to store variables with scope
    this.context = context ? context : new Context();
    // the current time
    this.time = typeof time === "number" ? time : 0;
    // how fast time passes
    this.rate = typeof rate === "number" ? rate : 1;
  }

  // wait an amount of time


  createClass(Process, [{
    key: "wait",
    value: function wait(time) {
      this.time += this.rate * time;
    }

    // To run an instruction, the process uses a _commands_ object (a map from
    // a instruction to a function) and an actions object (that will be exposed
    // to that function an uses as communication mechanism with the outside world)
    // The `step` function runs the next instruction of the process

  }, {
    key: "step",
    value: function step(commands, actions) {
      var instructions = this.instructions;

      if (instructions.length) {
        var instr = instructions.pop();
        if (instr === null || instr === undefined) {
          // ignore
        } else if (isProgram(instr)) {
          // if it's program, and since the instructions are stored into an stack,
          // we need add to the program instructions in reverse order
          for (var i = instr.length - 1; i >= 0; i--) {
            instructions.push(instr[i]);
          }
        } else if (isCommand(instr)) {
          var operation = commands[instr];
          if (typeof operation === "function") operation(this, actions);else actions.error("Instruction '" + instr + "' not recognized.");
        } else {
          // if it's a value, push it into the stack
          this.stack.push(instr);
        }
      }
    }

    // the `resume` function run all the instructions until time is reached

  }, {
    key: "resume",
    value: function resume(commands, actions) {
      var time = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;
      var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10000;
      var instructions = this.instructions;

      while (--limit > 0 && this.time < time && instructions.length) {
        this.step(commands, actions);
      }
      if (limit === 0) actions.error("Run limit reached. Probably an infinite loop.");
      return instructions.length > 0;
    }
  }]);
  return Process;
}();

// ## Context

// A context is a hierarchical structure to store values with scope
var Context = function () {
  function Context(parent, local) {
    classCallCheck(this, Context);

    this.parent = parent;
    this.local = local ? Object.assign({}, local) : undefined;
  }
  // get a value from a context


  createClass(Context, [{
    key: "get",
    value: function get$$1(id) {
      var target = this;
      while (target.value(id) === undefined && target.parent) {
        target = target.parent;
      }
      return target.value(id);
    }

    // set a value from a context

  }, {
    key: "set",
    value: function set$$1(id, value) {
      var target = this;
      while (target.value(id) === undefined && target.parent) {
        target = target.parent;
      }
      target.let(id, value);
    }
    // get a value from the local scope of a context

  }, {
    key: "value",
    value: function value(id) {
      return this.local ? this.local[id] : undefined;
    }

    // set a value into the local scope of a context

  }, {
    key: "let",
    value: function _let(id, value) {
      if (!this.local) this.local = {};
      this.local[id] = value;
    }
  }]);
  return Context;
}();

// # Scheduler
var Scheduler = function () {
  function Scheduler() {
    classCallCheck(this, Scheduler);

    this.procs = []; // the procs are inverse ordered by time
    this.time = 0;
    // the action are exposed to be used in commands
    this.actions = {
      schedule: this.schedule.bind(this),
      fork: this.fork.bind(this),
      stop: this.stop.bind(this)
    };
  }

  createClass(Scheduler, [{
    key: 'schedule',
    value: function schedule(ctxData, program) {
      var delay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var rate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;

      var time = this.time + delay;
      // Create a context with the given data
      var context = new Context(null, ctxData);
      this.add(new Process(program, context, time, rate));
    }
  }, {
    key: 'fork',
    value: function fork(proc, program) {
      var delay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var rate = arguments[3];

      var time = this.time + delay;
      if (!rate) rate = proc.rate;
      // Create a child context
      var context = new Context(proc.context);
      return this.add(new Process(program, proc.context, time, rate));
    }

    // run the scheduler for the given time (Infinity if not specified)

  }, {
    key: 'resume',
    value: function resume(commands, actions) {
      var dur = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;
      var limit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10000;
      var procs = this.procs;

      if (procs.length === 0) return false;
      var time = this.time + dur;
      while (--limit > 0 && this.nextTime() < time) {
        var proc = procs.pop();
        if (proc.resume(commands, actions, time)) {
          // the proc has more operations, re-schedule
          this.add(proc);
        }
      }
      this.time = time;
      return procs.length > 0;
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.procs.clear();
    }

    // add a process to the scheduler

  }, {
    key: 'add',
    value: function add(proc) {
      var procs = this.procs;


      if (procs.length === 0) {
        // no need to sort: just push it
        procs.push(proc);
      } else {
        // procs are sorted on insertion
        var i = procs.length - 1;
        var p = procs[i];
        while (p && p.time <= proc.time) {
          i--;
          p = procs[i];
        }
        procs.splice(i + 1, 0, proc);
      }
      return proc;
    }

    // get time of the next process

  }, {
    key: 'nextTime',
    value: function nextTime() {
      var len = this.procs.length;
      return len ? this.procs[len - 1].time : Infinity;
    }
  }]);
  return Scheduler;
}();

// # Virtual Machine

var defaultActions = {
  log: console.log.bind(console),
  error: console.error.bind(console)
};

var VM = function () {
  // plugins is an array of plugins: objects with `{ commands, actions }`
  function VM() {
    var _this = this;

    var plugins = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    classCallCheck(this, VM);

    this.scheduler = new Scheduler();
    this.initialContext = { amp: 0.8, freq: 440 };

    // commands are a map of instructions to commands with the form:
    // `{ '@instruction': (proc, actions) => ... }`
    this.commands = {};
    // actions are available to the commands
    this.actions = Object.assign({}, defaultActions);
    // the scheduler itself is a plugin (has commands and actions)
    this.usePlugin(this.scheduler);
    plugins.forEach(function (plugin) {
      return _this.usePlugin(plugin);
    });
  }

  createClass(VM, [{
    key: "run",
    value: function run(program, delay, rate) {
      this.scheduler.schedule(this.initialContext, program, delay, rate);
    }

    // advance the virtual machine by a time ammount

  }, {
    key: "tick",
    value: function tick(duration) {
      this.scheduler.resume(this.commands, this.actions, duration);
    }

    // A plugin is an object with two properties:
    // - commands: a map of instructions to commands
    // - actions: a map of actions names to actions

  }, {
    key: "usePlugin",
    value: function usePlugin(plugin) {
      Object.assign(this.commands, plugin.commands);
      Object.assign(this.actions, plugin.actions);
    }
  }]);
  return VM;
}();

var bpm = 100;
var sampleRate = null;
var bpm2bpa = null;
var vms = [];
var instruments = null;
var commands = null;

function gibberish(Gibberish, vm) {
  if (arguments.length === 1) return function (vm) {
    return gibberish(Gibberish, vm);
  };

  if (sampleRate === null) {
    Gibberish.init();
    sampleRate = Gibberish.context.sampleRate;
    bpm2bpa = 1 / (60 * sampleRate);
    instruments = createInstruments(Gibberish, instConfig);
    commands = createCommands(instruments, cmdConfig);
    Gibberish.sequencers.push(sequencer);
  }

  vms.push(vm);
  vm.usePlugin({ actions: instruments, commands: commands });
  return Gibberish;
}

// The Gibberish sequencer that controlls all
var sequencer = {
  tick: function tick() {
    var len = vms.length;
    if (len === 0) return;
    var dur = bpm * bpm2bpa;
    for (var i = 0; i < len; i++) {
      vms[i].tick(dur);
    }
  }
};

// This is the instruments configuration
var instConfig = [["kick", "Kick", { decay: 0.2 }], ["snare", "Snare", { snappy: 1.5 }], ["hat", "Hat", { amp: 1.5 }], ["conga", "Conga", { amp: 0.25, freq: 400 }], ["tom", "Tom", { amp: 0.25, freq: 400 }], ["pluck", "PolyKarplusStrong", { maxVoices: 32 }], ["bass", "MonoSynth", {
  attack: 44,
  decay: 0.25, // FIXME(danigb) -- it was: Gibberish.Time.beats(0.25),
  filterMult: 0.25,
  octave2: 0,
  octave3: 0
}]];
// Given a instruments configuration, create the Giberish instruments
function createInstruments(G, config) {
  return config.reduce(function (insts, _ref3) {
    var _ref4 = slicedToArray(_ref3, 3),
        name = _ref4[0],
        type = _ref4[1],
        params = _ref4[2];

    insts[name] = new G[type](params).connect();
    return insts;
  }, {});
}

// ## Commands

// A trigger function receives the instrument and the parameters
var tr1 = function tr1(inst, amp) {
  inst.amp = amp;
  inst.note();
};
// trigger an instrument with 2 params
var tr2 = function tr2(inst, amp, freq) {
  inst.amp = amp;
  inst.freq = freq;
  inst.note();
};
// the bass is only triggered if the frequency is positive
// the bass is only triggered if the frequency is positive
var trBass = function trBass(bass, amp, freq) {
  if (freq > 0) bass.note(amp, freq);
};
// trigger the pluck requires adjust dump and compensate volume
var trPluck = function trPluck(strings, amp, freq) {
  console.log("PLUCK", amp, freq, sampleRate);
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
var cmdConfig = {
  pluck: ["amp", "freq", trPluck],
  bass: ["amp", "freq", trBass],
  kick: ["amp", null, tr1],
  snare: ["amp", null, tr1],
  hat: ["amp", null, tr1],
  conga: ["amp", "freq", tr2],
  tom: ["amp", "freq", tr2]
};

function createCommands(instruments, config) {
  return Object.keys(config).reduce(function (cmds, name) {
    var cmdConfig = config[name];
    var inst = instruments[name];
    cmds["@" + name] = fromScope(inst, cmdConfig);
    cmds["@" + name + "-note"] = fromStack(inst, cmdConfig);
    return cmds;
  }, {});
}

// Create an instrument command that get the parameters from context
// example: `['@pluck']`
function fromScope(inst, _ref5) {
  var _ref6 = slicedToArray(_ref5, 3),
      name1 = _ref6[0],
      name2 = _ref6[1],
      trigger = _ref6[2];

  return function (_ref7) {
    var context = _ref7.context;
    return trigger(inst, context.get(name1), context.get(name2));
  };
}

// Create an instrument command that get the parameters from the stack
// example: `[0.2, 05, '@pluck-note']`
function fromStack(inst, _ref8) {
  var _ref9 = slicedToArray(_ref8, 3),
      name1 = _ref9[0],
      name2 = _ref9[1],
      trigger = _ref9[2];

  return function (_ref10) {
    var stack = _ref10.stack;
    return trigger(inst, stack.pop(), name2 ? stack.pop() : undefined);
  };
}

// # Audio Virtual Machine

// The main purpose of the virtual machine is to run processes concurrently

// ## Architecture Overview

// A **scheduler** is a collection of processes. Each **process** mantains
// an internal time value that can be modified.

// ## API

function init(Gibberish) {
  for (var _len = arguments.length, plugins = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    plugins[_key - 1] = arguments[_key];
  }

  plugins = [{ commands: all }].concat(plugins);
  // Create the virtual machine
  var vm = new VM(plugins);
  // Init the audio driver
  gibberish(Gibberish, vm);
  // Return vm's run function
  return vm.run.bind(vm);
}

exports.init = init;

}((this.TimeVM = this.TimeVM || {})));
//# sourceMappingURL=TimeVM.js.map
