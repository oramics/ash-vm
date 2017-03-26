(function (exports) {
'use strict';

// # TimeVM utilities

// test if an object is an array
var isArray = Array.isArray;

// test if an object is a string
var isString = function isString(o) {
  return typeof o === "string";
};

// get last element from an array
var last = function last(a) {
  return a[a.length - 1];
};

// A modulo operation that handles negative n more appropriately
// e.g. wrap(-1, 3) returns 2
// see http://en.wikipedia.org/wiki/Modulo_operation
// see also http://jsperf.com/modulo-for-negative-numbers
var wrap = function wrap(a, b) {
  return (a % b + b) % b;
};

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
var ERR_INSTR_NOT_FOUND = "Instruction not recognized.";

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
    // bind error to allow destructuring in commands
    this.error = this.error.bind(this);
  }

  // wait an amount of time


  createClass(Process, [{
    key: "wait",
    value: function wait(time) {
      this.time += this.rate * time;
    }

    // The process is agnostic about the commands to be use

  }, {
    key: "step",
    value: function step(commands) {
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
          if (typeof operation === "function") operation(this);else this.error("", ERR_INSTR_NOT_FOUND, instr);
        } else {
          // if it's a value, push it into the stack
          this.stack.push(instr);
        }
      }
    }

    // the `resume` function run all the instructions until time is reached

  }, {
    key: "resume",
    value: function resume(commands) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Infinity;
      var limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10000;
      var instructions = this.instructions;

      while (--limit > 0 && this.time < time && instructions.length) {
        this.step(commands);
      }
      if (limit === 0) this.error("Resume", ERR_LIMIT_REACHED);
      return instructions.length > 0;
    }

    // an utility function to write errors

  }, {
    key: "error",
    value: function error(instr, msg, obj) {
      console.error(instr, msg, obj, "id", this.id, "time", this.time);
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

// # Commands
// **Error messages**
var ERR_BAD_PATTERN$1 = "Expected a pattern, but found:";
// **Utilities**

// A generic stack operation that pops one value and pushes on result
var op1 = function op1(fn) {
  return function (_ref) {
    var stack = _ref.stack;

    stack.push(fn(stack.pop()));
  };
};

// A generic stack operation that pops two values and pushes one result
var op2 = function op2(fn) {
  return function (_ref2) {
    var stack = _ref2.stack;

    stack.push(fn(stack.pop(), stack.pop()));
  };
};

// A commands object is a map from instrunction name to functions
var stdlib = {
  // ## Arithmetic
  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@+**, **@add** | Add two values | `[1, 2, "@+"]` |
  // | **@-**, **@sub** | Subtract two values | `[2, 1, "@-"]` |
  // | **@\***, **@mul** | Multiply two values | `[2, 4, "@*"]` |
  // | **@/**, **@div** | Divide two values | `[4, 2, "@*"]` |
  // | **@%**, **@wrap** | Modulo for positive and negative numbers | `[4, -2, "@%"]` |
  // | **@mod* | Standard modulo operation | `[4, 2, "@mod"]` |
  // | **@neg* | The negative of a value | `[4, "@neg"]` |
  // [1, 2, "@+"]
  "@+": op2(function (b, a) {
    return a + b;
  }),
  // [1, 2, "@add"]
  "@add": "@+",
  // [2, 1, "@-"]
  "@-": op2(function (b, a) {
    return a - b;
  }),
  // [2, 1, "@sub"]
  "@sub": "@-",
  "@*": op2(function (b, a) {
    return a * b;
  }),
  "@mul": "@*",
  "@/": op2(function (b, a) {
    return b === 0 ? 0 : a / b;
  }),
  "@div": "@/",
  "@%": op2(function (b, a) {
    return b === 0 ? 0 : wrap(a, b);
  }),
  "@wrap": "@%",
  "@mod": op2(function (b, a) {
    return b === 0 ? 0 : a % b;
  }),
  "@neg": op1(function (a) {
    return -a;
  }),

  // ## Logic

  "@cond": function cond(_ref3) {
    var stack = _ref3.stack,
        instructions = _ref3.instructions;

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
  "@>": op2(function (b, a) {
    return a > b;
  }),
  "@>=": op2(function (b, a) {
    return a >= b;
  }),
  "@<": op2(function (b, a) {
    return a < b;
  }),
  "@<=": op2(function (b, a) {
    return a <= b;
  }),
  "@==": op2(function (b, a) {
    return a === b;
  }),
  "@!=": op2(function (b, a) {
    return a !== b;
  }),
  "@!": op1(function (a) {
    return !a;
  }),
  "@not": "@!",
  "@&&": op2(function (b, a) {
    return a && b;
  }),
  "@and": "@&&",
  "@||": op2(function (b, a) {
    return a || b;
  }),
  "@or": "@||",

  // ## Core

  // This are the core operations: execute instructions, modify
  // process time and context variables

  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@** | Alias of @execute | `10,'dup','@'` |
  // | **@let** | Assign a value to the local context | `10,'repetitions',@let` |
  // | **@set** | Assign a value to the global context | `10,'parts',@set` |
  // | **@get** | Push the value of a variable into the stack | `'repetitions',@get` |
  // | **@wait** | Wait an amount of time | `1,@wait` |
  // | **@sync** | Wait until next beat | `@sync` |

  // ## Process

  // Operation related to interact with the current process

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

  // ## Execute and repeat

  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@dup** | Duplicate item (so you can use it twice) | `10,@dup` |
  // | **@execute** | Execute an instruction | `10,'dup','@execute'` |
  // | **@repeat** | Repeat | `4, "@repeat", ["@kick", 0.5, "@wait"]` |
  // | **@forever** | Repeat forever | `"@forever", ["@kick", 0.5, "@wait"]` |
  "@dup": function dup(_ref7) {
    var stack = _ref7.stack;
    return stack.push(last(stack));
  },
  "@execute": function execute(_ref8) {
    var instructions = _ref8.instructions,
        error = _ref8.error;

    var instr = instructions.pop();
    if (isString(instr)) instructions.push("@instr");else error("@execute", ERR_EXPECT_STRING, instr);
  },
  "@": "@execute",
  "@repeat": function repeat(_ref9) {
    var stack = _ref9.stack,
        instructions = _ref9.instructions;

    var repetitions = stack.pop();
    var pattern = last(instructions);
    if (!isArray(pattern)) throw Error("Can't repeat: " + pattern);
    for (var i = 1; i < repetitions; i++) {
      instructions.push(pattern);
    }
  },
  "@forever": function forever(_ref10) {
    var instructions = _ref10.instructions;

    var pattern = last(instructions);
    if (!isArray(pattern)) throw Error("Can't forover: " + pattern);
    if (pattern.length) {
      instructions.push("@forever");
      instructions.push(pattern);
    }
  },

  // ## Iteration and lists
  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@iter** | Iterate a pattern | `[["@iter", [0.3, 1]], "amp", "@set"]` |
  "@iter": function iter(_ref11) {
    var instructions = _ref11.instructions,
        error = _ref11.error;

    var pattern = instructions.pop();
    if (!isArray(pattern) || !pattern.length) error("@iter", ERR_BAD_PATTERN$1, pattern);else {
      // Rotates the pattern and plays the first item only each time
      // remove '1st' item, schedule, then push to back:
      var first = pattern.splice(0, 1);
      instructions.push(first);
      pattern.push(first);
    }
  }

};

// Given a commands object, expand the aliases
function expandAliases(commands) {
  Object.keys(commands).forEach(function (name) {
    var op = commands[name];
    if (isString(op)) commands[name] = commands[op];
  });
  return commands;
}

// # VM

var assign = Object.assign;

// The purpose of the VM is to run processes concurrently. It also
// mantains an extensible object of commands (instructions mapped to functions)
// that allows to add instructions to the vm

// TODO: probably is better to have functions and object instead of classes
// will change in the future
var VM = function () {
  function VM() {
    classCallCheck(this, VM);

    this.procs = []; // the procs are inverse ordered by time
    this.procsByName = {}; // a map of names to procs
    this.time = 0;
    this.commands = createCommands(this);
    this.addCommands(stdlib);
  }

  // Add more commands


  createClass(VM, [{
    key: "addCommands",
    value: function addCommands(commands) {
      assign(this.commands, expandAliases(commands));
    }

    // Create a new process

  }, {
    key: "fork",
    value: function fork(name, parent, program) {
      var delay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var rate = arguments[4];

      var time = this.time + delay;
      // if has parent and no rate, try to use it's rate
      if (!rate && parent) rate = parent.rate;
      // if has parent try to use it's context
      var context = parent ? parent.context || parent : undefined;
      // create the new process and insert into the process stack
      var proc = new Process(program, context, time, rate);
      insert(proc, this.procs);
      // if has name, register it
      if (name) this.procsByName[name] = proc;
      return proc;
    }

    // run the vm for the given amount of time (Infinity if not specified)

  }, {
    key: "resume",
    value: function resume() {
      var dur = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Infinity;
      var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10000;
      var procs = this.procs;

      if (procs.length === 0) return false;
      var time = this.time + dur;
      while (--limit > 0 && at(procs) < time) {
        var proc = procs.pop();
        if (proc.resume(this.commands, time)) {
          // the proc has more operations, re-schedule
          insert(proc, this.procs);
        }
      }
      this.time = time;
      return procs.length > 0;
    }
  }, {
    key: "stopAll",
    value: function stopAll() {
      this.procs.length = 0;
    }

    // The stop function can stop a proccess by name or by object

  }, {
    key: "stop",
    value: function stop(proc) {
      if (typeof proc === "string") {
        var name = proc;
        proc = this.procsByName[name];
        this.procsByName[name] = null;
      }
      remove(proc, this.procs);
    }
  }]);
  return VM;
}();

// ## VM commands

// | Name | Description | Example |
// |------|-------------|---------|
// | **@fork** | Fork | `@fork, [0.5, "@wait", "@kick"]` |
// | **@spawn** | Spawn | `"melody", "@spawn", [0.5, "@wait", "@kick"]` |
// | **@stop** | Stop current process | `@stop` |
// | **@stop-all** | Stop all processes | `@stop-all` |
function createCommands(vm) {
  return {
    "@loop": function loop(proc) {
      var instructions = proc.instructions,
          error = proc.error;

      var pattern = instructions.pop();
      if (isArray(pattern)) vm.fork(null, proc, ["@forever", pattern]);else error("@loop", ERR_BAD_PATTERN, pattern);
    },
    "@fork": function fork(proc) {
      var instructions = proc.instructions,
          error = proc.error;

      var pattern = instructions.pop();

      if (isArray(pattern)) {
        vm.fork(null, proc, pattern);
      } else {
        error("@fork", ERR_BAD_PATTERN, pattern);
      }
    },
    "@spawn": function spawn(proc) {
      var stack = proc.stack,
          instructions = proc.instructions,
          error = proc.error;

      var name = stack.pop();
      var pattern = instructions.pop();
      if (!isString(name)) {
        error("@spawn", ERR_NAME, name);
      } else if (!isArray(pattern)) {
        error("@spawn", ERR_BAD_PATTERN, pattern);
      } else {
        vm.stop(name);
        vm.fork(name, proc, ["@forever", pattern]);
      }
    },
    "@stop-all": function stopAll(proc) {
      return vm.stopAll();
    }
  };
}

// ## Internal VM functions

// remove a process process
function remove(proc, procs) {
  var i = procs.length - 1;
  while (i >= 0 && procs[i] !== proc) {
    i--;
  } // if found, remove it
  if (i !== -1) procs.splice(i, 1);
}

// insert a process into a stack ordered by time
// (in fact, is inverse order because it's a stack)
function insert(proc, procs) {
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
  if (sampleRate === null) initAudio();

  vms.push(vm);
  vm.addCommands(commands);
  return Gibberish;
}

function initAudio() {
  Gibberish.init();
  sampleRate = Gibberish.context.sampleRate;
  bpm2bpa = 1 / (60 * sampleRate);
  instruments = createInstruments(Gibberish, instConfig);
  commands = createCommands$1(instruments, cmdConfig);
  Gibberish.sequencers.push(sequencer);
}

// The Gibberish sequencer that controlls all
var sequencer = {
  tick: function tick() {
    var len = vms.length;
    if (len === 0) return;
    var dur = bpm * bpm2bpa;
    for (var i = 0; i < len; i++) {
      vms[i].resume(dur);
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

function createCommands$1(instruments, config) {
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

// ## Randomness
var floor = Math.floor;

// | Name | Description | Example |
// |------|-------------|---------|
// | **@random** | Generate a random number between 0 and 1 | `["@random", "amp", "@set"]` |
// | **@rand** | Alias for @random | |
// | **@srandom** | Generate a random number between -1 and 1 | `["@srandom", "phase", "@set"]` |
// | **@srand** | Alias for @srandom | |
// | **@randi** | Generate a random integer between 0 and n | `[60, "@randi", "midi", "@set"]` |
// | **@pick** | Pick a random element from a list | `["@pick", [1, 2, 3, 4]]` |
// | **@chance** | Probabilistic execution | `probability, "@chance", executed-if-true, executed-if-false` |

function random(random) {
  // allow to use a custom random function
  var rnd = random || Math.random;
  // a function that generates integer random from 0 to n
  var irnd = function irnd(n) {
    return floor(rnd() * n);
  };

  return {
    "@random": function random(_ref) {
      var stack = _ref.stack;
      return stack.push(rnd());
    },
    "@rand": "@random",
    "@srandom": function srandom(_ref2) {
      var stack = _ref2.stack;
      return stack.push(rnd() * 2 - 1);
    },
    "@srand": "@srandom",
    "@randi": function randi(_ref3) {
      var stack = _ref3.stack;
      return stack.push(irnd(stack.pop()));
    },
    "@pick": function pick(proc) {
      var stack = proc.stack,
          instructions = proc.instructions,
          error = proc.error;

      var pattern = instructions.pop();
      if (!isArray(pattern)) {
        instructions.push(pattern);
        error("Can't pick an element if is not an array", pattern);
      } else {
        var i = irnd(pattern.length);
        instructions.push(pattern[i]);
      }
    },
    "@chance": function chance(_ref4) {
      var stack = _ref4.stack,
          instructions = _ref4.instructions;

      var prob = stack.pop();
      var pattern = instructions.pop();
      if (rnd() < prob) {
        // Skip item after
        instructions.pop();
        // Push the pattern
        instructions.push(pattern);
      }
    }
  };
}

// # Debug operations

// | Name | Description | Example |
// |------|-------------|---------|
// | **@print** | Print the last value of the stack | `10,"@print"` |
// | **@log** | Log the name with the last value of the stack | `"@random", "amp", "@log"` |
function debug(_log) {
  _log = _log || console.log.bind(console);

  return {
    "@print": function print(proc) {
      var stack = proc.stack;

      var last = stack.length ? last(stack) : "<Empty Stack>";
      _log("@print", last, "(id, time)", proc.id, proc.time);
    },
    "@log": function log(proc) {
      var stack = proc.stack;

      var name = stack.pop();
      var last = stack.length ? last(stack) : "<Empty Stack>";
      _log("@log", name, last, "(id, time)", proc.id, proc.time);
    },
    "@debug": function debug(proc) {
      var stack = proc.stack;

      _log("@debug", stack, proc.id, proc.time);
    }
  };
}

// # Audio Virtual Machine

// The main purpose of the virtual machine is to run processes concurrently

// ## Architecture Overview

// A **scheduler** is a collection of processes. Each **process** mantains
// an internal time value that can be modified.

var INITIAL_CTX = { amp: 0.5, freq: 440 };
var newCtx = function newCtx() {
  return Object.assign({}, INITIAL_CTX);
};

// ## API

function init(Gibberish) {
  // Create the virtual machine and setup commands
  var vm = new VM();
  vm.addCommands(random());
  vm.addCommands(debug());

  for (var _len = arguments.length, plugins = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    plugins[_key - 1] = arguments[_key];
  }

  plugins.forEach(function (cmds) {
    return vm.addCommands(cmds);
  });

  // Init the audio driver
  gibberish(Gibberish, vm);

  // Return a `run(program)` function
  // this is the simplest API I can think. Probably will change.
  return function (prog) {
    var sync = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    vm.fork(null, newCtx(), sync ? ["@sync", prog] : prog);
  };
}

exports.init = init;

}((this.TimeVM = this.TimeVM || {})));
//# sourceMappingURL=TimeVM.js.map
