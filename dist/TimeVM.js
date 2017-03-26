(function (exports) {
'use strict';

// # Commands

// **Utilities**
var isArray = Array.isArray;
var isString = function isString(o) {
  return typeof o === "string";
};

// get last element of the stack
var peek = function peek(stack) {
  return stack[stack.length - 1];
};
// Given a commands object, expand the aliases
var expandAliases = function expandAliases(commands) {
  return Object.keys(commands).reduce(function (commands, cmd) {
    var op = commands[cmd];
    if (typeof op === "string") {
      commands[cmd] = commands[op];
    }
    return commands;
  }, commands);
};

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
// | **@sync** | Wait until next beat | `@sync` |
// | **@fork** | Fork | `@fork, [0.5, '@wait', '@kick']` |
// | **@spawn** | Spawn | `"part-A", @spawn, [0.5, '@wait', '@kick']` |
// | **@stop** | Stop current process | `@stop` |
// | **@stop-all** | Stop all processes )| `@stop-all` |
var core = expandAliases({
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
  "@sync": function sync(proc) {
    return proc.wait(Math.floor(proc.time) + 1 - proc.time);
  },

  "@stop": function stop(_ref7, _ref8) {
    var stack = _ref7.stack;
    var _stop = _ref8.stop;

    var name = stack.pop();
    _stop(name);
  },
  "@stop-all": function stopAll(proc, _ref9) {
    var _stopAll = _ref9.stopAll;
    return _stopAll();
  },

  "@fork": function fork(proc, _ref10) {
    var error = _ref10.error,
        _fork = _ref10.fork;
    var instructions = proc.instructions;

    var pattern = instructions.pop();

    if (isArray(pattern)) {
      _fork(null, proc, pattern);
    } else {
      error("@fork", ERR_BAD_PATTERN, pattern);
    }
  },
  "@spawn": function spawn(proc, _ref11) {
    var stop = _ref11.stop,
        fork = _ref11.fork,
        error = _ref11.error;
    var stack = proc.stack,
        instructions = proc.instructions;

    var name = stack.pop();
    var pattern = instructions.pop();
    if (!isString(name)) error("@spawn", ERR_NAME, name);else if (!isArray(pattern)) error("@spawn", ERR_BAD_PATTERN, pattern);else {
      stop(name);
      fork(name, proc, ["@forever", pattern]);
    }
  }
});

var repetition = {
  "@repeat": function repeat(_ref12) {
    var stack = _ref12.stack,
        instructions = _ref12.instructions;

    var repetitions = stack.pop();
    var pattern = peek(instructions);
    if (!isArray(pattern)) throw Error("Can't repeat: " + pattern);
    for (var i = 1; i < repetitions; i++) {
      instructions.push(pattern);
    }
  },
  "@forever": function forever(_ref13) {
    var instructions = _ref13.instructions;

    var pattern = peek(instructions);
    if (!isArray(pattern)) throw Error("Can't forover: " + pattern);
    if (pattern.length) {
      instructions.push("@forever");
      instructions.push(pattern);
    }
  },
  "@loop": function loop(proc, _ref14) {
    var error = _ref14.error,
        fork = _ref14.fork;
    var instructions = proc.instructions;

    var pattern = instructions.pop();
    if (isArray(pattern)) fork(null, proc, ["@forever", pattern]);else error("@loop", ERR_BAD_PATTERN, pattern);
  }
};

// ## Iteration and lists
// | Name | Description | Example |
// |------|-------------|---------|
// | **@iter** | Iterate a pattern | `[["@iter", [0.3, 1]], "@set-amp"]` |
var lists = {
  "@iter": function iter(_ref15) {
    var instructions = _ref15.instructions;

    var pattern = instructions.pop();
    if (!isArray(pattern) || !pattern.length) error("Can't iterate:", pattern);else {
      // Rotates the pattern and plays the first item only each time
      // remove '1st' item, schedule, then push to back:
      var first = pattern.splice(0, 1);
      instructions.push(first);
      pattern.push(first);
    }
  }
};

// ## Randomness

// generate a random number between 0 and n
var rnd = function rnd(n) {
  return Math.floor(Math.random() * n);
};

// | Name | Description | Example |
// |------|-------------|---------|
// | **@random** | Generate a random number between 0 and 1 | `["@random", "amp", "@set"]` |
// | **@rand** | Alias for @random | |
// | **@srandom** | Generate a random number between -1 and 1 | `["@srandom", "phase", "@set"]` |
// | **@srand** | Alias for @srandom | |
// | **@randi** | Generate a random integer between 0 and n | `[60, "@randi", "midi", "@set"]` |
// | **@pick** | Pick a random element from a list | `["@pick", [1, 2, 3, 4]]` |
// | **@chance** | Probabilistic execution | `probability, "@chance", executed-if-true, executed-if-false` |
var random = expandAliases({
  "@random": function random(_ref16) {
    var stack = _ref16.stack;
    return stack.push(Math.random());
  },
  "@rand": "@random",
  "@srandom": function srandom(_ref17) {
    var stack = _ref17.stack;
    return stack.push(Math.random * 2 - 1);
  },
  "@srand": "@srandom",
  "@randi": function randi(_ref18) {
    var stack = _ref18.stack;
    return stack.push(rnd(stack.pop()));
  },
  "@pick": function pick(_ref19, _ref20) {
    var stack = _ref19.stack,
        instructions = _ref19.instructions;
    var error = _ref20.error;

    var pattern = instructions.pop();
    if (!isArray(pattern)) {
      instructions.push(pattern);
      error("Can't pick an element if is not an array", pattern);
    } else {
      var i = rnd(pattern.length);
      instructions.push(pattern[i]);
    }
  },
  "@chance": function chance(_ref21) {
    var stack = _ref21.stack,
        instructions = _ref21.instructions;

    var prob = stack.pop();
    var pattern = instructions.pop();
    if (Math.random() < prob) {
      // Skip item after
      instructions.pop();
      // Push the pattern
      instructions.push(pattern);
    }
  }
});

// ## Arithmetic

// A generic operation that pops one value and pushes on result
var op1 = function op1(fn) {
  return function (_ref22) {
    var stack = _ref22.stack;

    stack.push(fn(stack.pop()));
  };
};

// A generic operation that pops two values and pushes one result
var op2 = function op2(fn) {
  return function (_ref23) {
    var stack = _ref23.stack;

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

var arithmetic = expandAliases({
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
    return b === 0 ? 0 : b / a;
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
});

// ## Conditionals
// _should they return 1 and 0 instead of bools?_

var logic = {
  "@cond": function cond(_ref24) {
    var stack = _ref24.stack,
        instructions = _ref24.instructions;

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
// | **@print** | Print the last value of the stack | `10,"@print"` |
// | **@log** | Log the name with the last value of the stack | `"@random", "amp", "@log"` |
var debug = {
  "@print": function print(proc, _ref25) {
    var log = _ref25.log;
    var stack = proc.stack;

    var last = stack.length ? peek(stack) : "<Empty Stack>";
    log("@print", last, "(id, time)", proc.id, proc.time);
  },
  "@log": function log(proc, _ref26) {
    var _log = _ref26.log;
    var stack = proc.stack;

    var name = stack.pop();
    var last = stack.length ? peek(stack) : "<Empty Stack>";
    _log("@log", name, last, "(id, time)", proc.id, proc.time);
  },
  "@debug": function debug(proc, _ref27) {
    var log = _ref27.log;
    var stack = proc.stack;

    log('@debug', stack, proc.id, proc.time);
  }
};

var all = Object.assign({}, core, repetition, lists, arithmetic, random, logic, debug);

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
    this.context = new Context(context);
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
        } else if (typeof instruction === "function") {
          instruction();
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
  function Context(parent) {
    classCallCheck(this, Context);

    if (parent instanceof Context) this.parent = parent;else if (parent) this.local = Object.assign({}, parent);
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
// TODO: probably is better to have functions and object instead of classes
// will change in the future
var Scheduler = function () {
  function Scheduler() {
    classCallCheck(this, Scheduler);

    this.procs = []; // the procs are inverse ordered by time
    this.procsByName = {}; // a map of names to procs
    this.time = 0;
    // the action are exposed to be used in commands
    this.actions = {
      fork: this.fork.bind(this),
      stop: this.stop.bind(this),
      stopAll: this.stopAll.bind(this)
    };
  }

  // Create a new process


  createClass(Scheduler, [{
    key: 'fork',
    value: function fork(name, parent, program) {
      var delay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var rate = arguments[4];

      var time = this.time + delay;
      if (!rate && parent) rate = parent.rate;
      var context = parent ? parent.context || parent : undefined;
      // Create a child context
      var proc = new Process(program, context, time, rate);
      push(proc, this.procs);
      if (name) this.procsByName[name] = proc;
      return proc;
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
      while (--limit > 0 && at(procs) < time) {
        var proc = procs.pop();
        if (proc.resume(commands, actions, time)) {
          // the proc has more operations, re-schedule
          push(proc, this.procs);
        }
      }
      this.time = time;
      return procs.length > 0;
    }
  }, {
    key: 'stopAll',
    value: function stopAll() {
      this.procs.length = 0;
    }

    // The stop function can stop a proccess by name or by object

  }, {
    key: 'stop',
    value: function stop(proc) {
      if (typeof proc === 'string') {
        var name = proc;
        proc = this.procsByName[name];
        this.procsByName[name] = null;
      }
      remove(proc, this.procs);
    }
  }]);
  return Scheduler;
}();

// remove the process
function remove(proc, procs) {
  var i = procs.length - 1;
  while (i >= 0 && procs[i] !== proc) {
    i--;
  } // if found, remove it
  if (i !== -1) procs.splice(i, 1);
}

// **Private functions**

// insert a process into a stack ordered by time
// (in fact, is in inverse order because is a stack)
function push(proc, procs) {
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
function at(procs) {
  var len = procs.length;
  return len ? procs[len - 1].time : Infinity;
}

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
    this.initialContext = { amp: 0.5, freq: 440 };

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
      this.scheduler.fork(null, this.initialContext, program, delay, rate);
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

// # Builders

// Create a new named sequence
var def = function def(name, patt) {
  return [name, "@spawn", patt];
};

// Set a value into the context
var set$1 = function set(name, value) {
  return [value, name, "@set"];
};

// Set a value into the local the context
var lset = function lset(name, value) {
  return [value, name, "@let"];
};

// Wait for an amount of time
var wait = function wait(t) {
  return [t, "@wait"];
};

// Stop the named sequence
var stop = function stop(n) {
  return n ? [n, "@stop"] : ["@stop-all"];
};

// Loop a pattern a number of times
var loop = function loop(p, n) {
  return n ? [n, "@repeat", p] : ["@loop", p];
};

// Print a value/message (and remove it from the stack)
var print = function print(msg) {
  return [msg, "@print"];
};

// Log a value (it prints the name and the value, but keeps the value into stack)
var log = function log(name) {
  return [name, "@log"];
};

// Reverse an array
var reverse = function reverse(p) {
  return ["@reverse", p];
};

// Schuffle an array
var shuffle = function shuffle(p) {
  return ["@shuffle", p];
};

// Rotate an array n times
var rotate = function rotate(p, n) {
  return [n !== undefined ? n : 1, "@rotate", p];
};

// Pick a random value from a list
var pick = function pick(l) {
  return ["@pick", l];
};

// Iterate a list
var iter = function iter(l) {
  return ["@iter", l];
};

// Conditional
var cond = function cond(f, pt, pf) {
  return [f, "@cond", pt, pf];
};

// Conditional operation based on a random
var chance = function chance(f, pt, pf) {
  return [f, "@chance", pt, pf];
};

// Subtract two values
var sub = function sub(a, b) {
  return [a, b, "@sub"];
};

// Execute arguments
var execute = function execute(l, args) {
  return args !== undefined ? [l, "@execute", args] : [l, "@execute"];
};

// Just a convenience
// every(3, p) actually creates cond(iter([0,0,1]),p)
// neat eh?
var every = function every(n, p) {
  var l = [];
  for (var i = 0; i < n - 1; i++) {
    l.push(0);
  }
  l.push(1);
  return cond(iter(l), p);
};

var builders = Object.freeze({
	def: def,
	set: set$1,
	lset: lset,
	wait: wait,
	stop: stop,
	loop: loop,
	print: print,
	log: log,
	reverse: reverse,
	shuffle: shuffle,
	rotate: rotate,
	pick: pick,
	iter: iter,
	cond: cond,
	chance: chance,
	sub: sub,
	execute: execute,
	every: every
});

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
  return function (prog) {
    var sync = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    vm.run(sync ? ['@sync', prog] : prog);
  };
}

function live() {
  var fns = Object.keys(builders);
  fns.forEach(function (fn) {
    window[fn] = builders[fn];
  });
  console.log('LIVE!', fns);
}

exports.init = init;
exports.live = live;

}((this.TimeVM = this.TimeVM || {})));
//# sourceMappingURL=TimeVM.js.map
