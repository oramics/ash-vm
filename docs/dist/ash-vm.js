(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.AshVM = global.AshVM || {})));
}(this, (function (exports) { 'use strict';

// # TimeVM utilities

// copy values from one or more sources to a target
// see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign


// test if an object is an array
var isArray = Array.isArray;

// test if  is a string
var isString = function isString(x) {
  return typeof x === 'string';
};

// test if  is a function
var isFn = function isFn(x) {
  return typeof x === 'function';
};

// test if  is defined
var isDef = function isDef(x) {
  return typeof x !== 'undefined';
};

// get last element from an array
var last = function last(a) {
  return a[a.length - 1];
};
// take the next element of stack without remove it
var peek = last;

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

// defer a function
function defer(fn, data) {
  setTimeout(function () {
    fn(data);
  }, 0);
}

var isCommand = function isCommand(o) {
  return typeof o === "string" && o[0] === "@";
};
var isProgram = Array.isArray;
var procId = 1;
var ERR_INSTR_NOT_FOUND = "Instruction not recognized.";
var ERR_LIMIT_REACHED = "Limit reached. Probably an infinity loop.";

// Processes are the principal computation unit. It departures from typical
// processes in that it model the concept of time
var Process = function () {
  function Process(program, context, time, rate) {
    classCallCheck(this, Process);

    this.id = "proc-" + procId++;
    // a stack of values
    this.stack = [];
    // the operations are stored in a stack (in reverse order)
    this.operations = program ? [program] : [];
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
      var operations = this.operations;

      if (operations.length) {
        var instr = operations.pop();
        if (instr === null || instr === undefined) {
          // ignore
        } else if (typeof instr === "function") {
          // it runs the functions but outside the loop
          defer(instr, this.time);
        } else if (isProgram(instr)) {
          // if it"s program, and since the operations are stored into an stack,
          // we need add to the program operations in reverse order
          for (var i = instr.length - 1; i >= 0; i--) {
            operations.push(instr[i]);
          }
        } else if (isCommand(instr)) {
          var cmd = commands[instr];
          if (typeof cmd === "function") cmd(this);else this.error("step > ", ERR_INSTR_NOT_FOUND, instr);
        } else {
          // if it"s a value, push it into the stack
          this.stack.push(instr);
        }
      }
    }

    // the `resume` function run all the operations until time is reached

  }, {
    key: "resume",
    value: function resume(commands) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Infinity;
      var limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10000;
      var operations = this.operations;

      while (--limit > 0 && this.time < time && operations.length) {
        this.step(commands);
      }
      if (limit === 0) throw Error(ERR_LIMIT_REACHED);
      return operations.length > 0;
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

  // Create a child


  createClass(Context, [{
    key: "child",
    value: function child(local) {
      var c = new Context(this);
      c.local = Object.assign({}, local);
      return c;
    }
    // get a value from a context

  }, {
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
var ERR_EXPECT_PATTERN = "Expected a pattern, but found:";
var ERR_EXPECT_STRING = "Expected a string, but found:";

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
  // **cond**: Conditional execution
  // `[true, "@cond", [<success pattern>], [<fail pattern>]]`
  "@cond": function cond(_ref3) {
    var stack = _ref3.stack,
        operations = _ref3.operations;

    var test = stack.pop();
    // this is the pattern to execute if the test passes
    var success = operations.pop();
    // the next pattern is the "else" part
    if (test) {
      // remove the "else" part
      operations.pop();
      operations.push(success);
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

  // ## Processes

  // Operation related to interact with the current process

  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@** | Alias of @execute | `10,"dup","@"` |
  // | **@let** | Assign a value to the local context | `10,"repetitions","@let"` |
  // | **@set** | Assign a value to the global context | `10,"parts","@set"` |
  // | **@get** | Push the value of a variable into the stack | `"repetitions","@get"` |
  // | **@wait** | Wait an amount of time | `1,"@wait"` |
  // | **@sync** | Wait until next beat | `"@sync"` |
  // | **@scale-rate** | Change the current rate by a factor | `1.5, "@scale-rate"` |

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

  "@scale-rate": function scaleRate(proc) {
    var factor = parseFloat(proc.stack.pop(), 10);
    if (factor > 0) proc.rate *= factor;
  },
  "@with-rate": function withRate(_ref7) {
    var stack = _ref7.stack,
        operations = _ref7.operations,
        error = _ref7.error;

    var factor = parseFloat(stack.pop(), 10);
    var pattern = operations.pop();
    if (!isArray(pattern)) error("@with-rate", ERR_EXPECT_PATTERN, pattern);
    operations.push([factor, "@scale-rate", pattern, 1 / factor, "@scale-rate"]);
  },

  // ## Execute and repeat

  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@dup** | Duplicate item (so you can use it twice) | `10,"@dup"` |
  // | **@execute** | Execute an instruction | `10,"dup","@execute"` |
  // | **@repeat** | Repeat | `4, "@repeat", ["@kick", 0.5, "@wait"]` |
  // | **@forever** | Repeat forever | `"@forever", ["@kick", 0.5, "@wait"]` |
  "@dup": function dup(_ref8) {
    var stack = _ref8.stack;
    return stack.push(last(stack));
  },
  "@execute": function execute(_ref9) {
    var operations = _ref9.operations,
        error = _ref9.error;

    var instr = operations.pop();
    if (isString(instr)) operations.push("@instr");else error("@execute", ERR_EXPECT_STRING, instr);
  },
  "@": "@execute",
  "@repeat": function repeat(_ref10) {
    var stack = _ref10.stack,
        operations = _ref10.operations,
        error = _ref10.error;

    var repetitions = stack.pop();
    var pattern = last(operations);
    if (!isArray(pattern)) error("@repeat", ERR_EXPECT_PATTERN, pattern);else {
      for (var i = 1; i < repetitions; i++) {
        operations.push(pattern);
      }
    }
  },
  "@forever": function forever(_ref11) {
    var operations = _ref11.operations,
        error = _ref11.error;

    var pattern = last(operations);
    if (isArray(pattern) && pattern.length) {
      operations.push("@forever");
      operations.push(pattern);
    } else error("@forever", ERR_EXPECT_PATTERN, pattern);
  },

  // ## Iteration and lists
  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@iter** | Iterate a pattern | `[["@iter", [0.3, 1]], "amp", "@set"]` |
  // | **@rotate** | Rotate a pattern | `[]` |
  "@iter": function iter(_ref12) {
    var operations = _ref12.operations,
        error = _ref12.error;

    var pattern = operations.pop();
    if (!isArray(pattern) || !pattern.length) {
      error("@iter", ERR_EXPECT_PATTERN, pattern);
    } else {
      // Rotates the pattern and plays the first item only each time
      // remove "1st" item, schedule, then push to back:
      var first = pattern.splice(0, 1);
      operations.push(first);
      pattern.push(first);
    }
  },
  "@rotate": function rotate(_ref13) {
    var stack = _ref13.stack,
        operations = _ref13.operations,
        error = _ref13.error;

    var pattern = operations.pop();
    var rot = stack.pop();
    if (isArray(pattern) && pattern.length > 0) {
      // ensure rot is valid between -args.length to +args.length
      rot = rot % pattern.length;
      var copy = pattern.splice(0);
      // rotate in-place
      pattern.push.apply(pattern, copy.slice(rot));
      pattern.push.apply(pattern, copy.slice(0, rot));
      // schedule a shallow copy:
      operations.push(copy);
    } else {
      error("@rotate", ERR_EXPECT_PATTERN, pattern);
    }
  },

  // ## Utilities

  // midi to frequency
  // [60, '@mtof']
  "@mtof": function mtof(_ref14) {
    var stack = _ref14.stack;

    var midi = stack.pop();
    var freq = 440 * Math.pow(2, (+midi - 69) / 12);
    stack.push(freq);
  },

  // scale a value
  // [value, fromLow, fromHi, toLow, toHi, "@linear"]
  "@linear": function linear(_ref15) {
    var stack = _ref15.stack;

    var ohi = stack.pop();
    var olo = stack.pop();
    var ihi = stack.pop();
    var ilo = stack.pop();
    var v = stack.pop();

    if (ihi === ilo) {
      stack.push(olo);
    } else {
      stack.push(olo + (ohi - olo) * ((v - ilo) / (ihi - ilo)));
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

var assign$$1 = Object.assign;

// The purpose of the VM is to run processes concurrently. It also
// mantains an extensible object of commands (operations mapped to functions)
// that allows to add operations to the vm

// TODO: probably is better to have functions and object instead of classes
// will change in the future.
var VM = function () {
  function VM(initialContext) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, VM);

    this.context = initialContext;
    this.procs = []; // the procs are inverse ordered by time
    this.procsByName = {}; // a map of names to procs
    this.time = 0;
    this.commands = createCommands(this);
    this.addCommands(stdlib);
    this.onfork = options.onfork;
    this.onstop = options.onstop;
    this.onended = options.onended;
  }

  // Run a program


  createClass(VM, [{
    key: "run",
    value: function run(program) {
      var sync = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      // if there are no processes, no need to sync
      if (sync && this.procs.length) program = ["@sync", program];
      return this.fork(null, this.context, program);
    }

    // Add more commands

  }, {
    key: "addCommands",
    value: function addCommands(commands) {
      if (isFn(commands)) commands = commands(this);
      if (commands) assign$$1(this.commands, expandAliases(commands));
    }

    // Create a new process

  }, {
    key: "fork",
    value: function fork(name, parent, program) {
      var delay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var rate = arguments[4];

      var time = this.time + delay;
      // if has parent and no rate, try to use it"s rate
      if (!rate && parent) rate = parent.rate;
      // if has parent try to use it"s context
      var context = parent ? parent.context || parent : undefined;
      // create the new process and insert into the process stack
      var proc = new Process(program, context, time, rate);
      insert(proc, this.procs);
      // if has name, register it
      if (name) this.procsByName[name] = proc;
      if (this.onfork) this.onfork({ proc: proc, name: name, parent: parent, program: program, delay: delay, rate: rate });
      return proc;
    }

    // run the vm for the given amount of time (Infinity if not specified)

  }, {
    key: "resume",
    value: function resume() {
      var dur = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Infinity;
      var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10000;
      var procs = this.procs;

      if (procs.length > 0) {
        var nextTime = this.time + dur;
        while (--limit > 0 && at(procs) < nextTime) {
          var proc = procs.pop();
          if (proc.resume(this.commands, nextTime)) {
            // the proc has more operations, re-schedule
            insert(proc, this.procs);
          } else {
            if (this.onended) this.onended({ proc: proc, time: this.time });
          }
        }
        this.time = nextTime;
      } else {
        this.time += dur;
      }
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
    value: function stop(name) {
      var proc = void 0;
      if (typeof proc === "string") {
        proc = this.procsByName[name];
        this.procsByName[name] = null;
      } else {
        proc = name;
        name = null;
      }
      if (this.onstop) this.onstop({ name: name, proc: proc });

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
      var operations = proc.operations,
          error = proc.error;

      var pattern = operations.pop();
      if (isArray(pattern)) vm.fork(null, proc, ["@forever", pattern]);else error("@loop", ERR_EXPECT_PATTERN, pattern);
    },
    "@fork": function fork(proc) {
      var operations = proc.operations,
          error = proc.error;

      var pattern = operations.pop();

      if (isArray(pattern)) {
        vm.fork(null, proc, pattern);
      } else {
        error("@fork", ERR_EXPECT_PATTERN, pattern);
      }
    },
    "@spawn": function spawn(proc) {
      var stack = proc.stack,
          operations = proc.operations,
          error = proc.error;

      var name = stack.pop();
      var pattern = operations.pop();
      if (!isString(name)) {
        error("@spawn", ERR_EXPECT_STRING, name);
      } else if (!isArray(pattern)) {
        error("@spawn", ERR_EXPECT_PATTERN, pattern);
      } else {
        vm.stop(name);
        vm.fork(name, proc, ["@forever", pattern]);
      }
    },
    "@stop-all": function stopAll(proc) {
      return vm.stopAll();
    },
    "@stop": function stop(_ref) {
      var stack = _ref.stack;
      return vm.stop(stack.pop());
    }
  };
}

// ## Internal VM functions

// remove a process process
function remove(proc, procs) {
  var i = procs.length - 1;
  while (i >= 0 && procs[i] !== proc) {
    i--;
  }
  // if found, remove it
  if (i !== -1) procs.splice(i, 1);
  return i !== -1;
}

// insert a process into a stack ordered by time
// (in fact, is inverse order because it"s a stack)
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

// # Gibberish audio audio
var ERR_INST_MISSING = function ERR_INST_MISSING(name) {
  return "Instrument \"" + name + "\" not found.";
};

// Create an object with instrument definitions.
// The instruments are created lazy
var instruments = function instruments(Gibberish) {
  return {
    kick: {
      params: ["amp", "pitch", "decay", "tone"],
      init: function init() {
        return new Gibberish.Kick({ decay: 0.2 }).connect();
      }
    },
    snare: {
      params: ["amp", "tune", "cutoff", "snappy"],
      init: function init() {
        return new Gibberish.Snare({ snappy: 1.5 }).connect();
      }
    },
    hat: {
      params: ["amp", "pitch"],
      init: function init() {
        return new Gibberish.Hat({ amp: 1.5 }).connect();
      }
    },
    conga: {
      params: ["amp", "pitch"],
      init: function init() {
        return new Gibberish.Conga({ amp: 0.25, freq: 400 }).connect();
      }
    },
    clave: {
      params: ["amp", "pitch"],
      init: function init() {
        return new Gibberish.Clave({ amp: 1 }).connect();
      }
    },
    tom: {
      params: ["amp", "pitch"],
      init: function init() {
        return new Gibberish.Tom({ amp: 0.25, freq: 400 }).connect();
      }
    },
    clap: {
      params: ["amp"],
      init: function init() {
        return new Gibberish.Clap({ amp: 0.5 }).connect();
      }
    },
    cowbell: {
      params: ["amp", "pitch"],
      init: function init() {
        return new Gibberish.Cowbell({ amp: 0.5 }).connect();
      }
    },
    pluck: {
      params: ["freq", "amp", "blend", "damping", "velocity"],
      init: function init() {
        return new Gibberish.PolyKarplusStrong({ maxVoices: 32 }).connect();
      },
      prepare: function prepare(inst, context) {
        var freq = context.get("freq");
        if (freq > 0) {
          inst.freq = freq;
          inst.damping = 1 - -6 / Math.log(freq / Gibberish.sampleRate);
        }
        var amp = context.get("amp");
        if (amp) inst.amp = amp * amp * 0.5;
        var blend = context.get("blend");
        if (blend) inst.blend = blend;
      }
    },
    bass: {
      params: ["freq", "amp", "resonance"],
      init: function init() {
        return new Gibberish.MonoSynth({
          attack: 44,
          decay: Gibberish.Time.beats(0.25),
          filterMult: 0.25,
          octave2: 0,
          octave3: 0
        }).connect();
      }
    }
  };
};

// ## Audio commands

// | Name | Description | Example |
// |------|-------------|---------|
// | **@get-bpm** | Get the global tempo value | `"@pick", [1.25, 1.5, 0.75], "@get-bpm", "@*", "@set-bpm"` |
// | **@set-bpm** | Change the global tempo | `120, "@set-bpm"` |
// | **@play-note** | Trigger a note with params | `{ inst: "pluck", amp: 0.5}, "@note-params"` |
// | **@play** | Trigger a note | `"@note"` |
var initCommands = function initCommands(audio) {
  return {
    "@play": function play(_ref) {
      var context = _ref.context,
          error = _ref.error;

      var err = _play(context, audio);
      if (err) error("@play", err);
    },
    "@play-note": function playNote(_ref2) {
      var stack = _ref2.stack,
          context = _ref2.context,
          error = _ref2.error;

      var props = stack.pop();
      var err = _play(context.child(props), audio);
      if (err) error("@play-note", err);
    },
    "@set-bpm": function setBpm(_ref3) {
      var stack = _ref3.stack;

      var bpm = parseFloat(stack.pop(), 10);
      if (bpm > 0) audio.bpm = bpm;
    },
    "@scale-tempo": function scaleTempo(_ref4) {
      var stack = _ref4.stack;

      var factor = parseFloat(stack.pop(), 10);
      if (factor) audio.bpm *= factor;
    }
  };
};

function init$1(Gibberish) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var audio = initAudioDriver(Gibberish, options);
  audio.instruments = initInstruments(instruments(Gibberish));
  audio.commands = initCommands(audio);
  Gibberish.sequencers.push(sequencer(audio));

  return function (vm) {
    // Add the vm to the list of VMs
    audio.vms.push(vm);
    // Set the audio property to the audio driver
    vm.audio = audio;
    return audio.commands;
  };
}

// Prepare the instruments object. Replace the params with prepare
function initInstruments(instruments) {
  Object.keys(instruments).forEach(function (name) {
    var inst = instruments[name];
    if (!inst.prepare) {
      var params = inst.params || [];
      inst.prepare = function (inst, context) {
        params.forEach(function (param) {
          var value = context.get(param);
          if (isDef(value)) {
            inst[param] = value;
          }
        });
      };
    }
  });
  return instruments;
}

function sequencer(audio) {
  var vms = audio.vms,
      bpm2bpa = audio.bpm2bpa;

  return {
    tick: function tick() {
      var len = audio.vms.length;
      var dur = audio.bpm * bpm2bpa;
      if (len === 1) {
        vms[0].resume(dur);
      } else if (len > 1) {
        for (var i = 0; i < len; i++) {
          vms[i].resume(dur);
        }
      }
    }
  };
}

// Trigger an instrument
var _play = function _play(context, audio) {
  var instruments = audio.instruments;

  var instName = context.get("inst");
  var instrument = instruments[instName];
  if (!instrument) return ERR_INST_MISSING(instName);
  if (!instrument.instance) instrument.instance = instrument.init();

  var inst = instrument.instance;
  instrument.prepare(inst, context);
  inst.freq ? inst.note(inst.freq) : inst.note();
};

// Init the audio driver
function initAudioDriver(Gibberish, _ref5) {
  var _ref5$bpm = _ref5.bpm,
      bpm = _ref5$bpm === undefined ? 100 : _ref5$bpm;

  if (!Gibberish.context) Gibberish.init();
  return {
    Gibberish: Gibberish,
    bpm: bpm,
    sampleRate: Gibberish.context.sampleRate,
    bpm2bpa: 1 / (60 * Gibberish.context.sampleRate),
    vms: []
  };
}

var isString$1 = function isString(o) {
  return typeof o === "string";
};
var exp = Math.exp;
var E = Math.E;


function ampToGain(amp) {
  return (exp(amp) - 1) / (E - 1);
}

function plug(node, name, value) {
  var target = node[name];
  if (!target) throw Error("plug -- Can't find " + name + " of " + node);
  if (value === undefined || value === null) {
    // ignore
  } else if (target.value !== undefined) {
    target.setValueAtTime(value, 0);
  } else if (typeof target === "function") {
    target.call(node, value);
  }
}

function trigger(time, param, envelope) {
  param.cancelScheduledValues(0);
  param.setValueAtTime(0, 0);
  envelope.forEach(function (_ref) {
    var _ref2 = slicedToArray(_ref, 3),
        type = _ref2[0],
        value = _ref2[1],
        duration = _ref2[2];

    var when = time + duration;
    if (type === "lin") {
      param.linearRampToValueAtTime(value, when);
    } else if (type === "set") {
      param.setValueAtTime(value, when);
    } else if (type === "exp") {
      if (value === 0) value = 0.0000001;
      param.exponentialRampToValueAtTime(value, when);
    }
  });
}

function envelope(ac, envelope) {
  var env = gain(ac, { gain: 0 });
  env.trigger = function (time) {
    return trigger(time, env.gain, envelope);
  };
  return env;
}

function adsr(ac) {
  var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      attack = _ref3.attack,
      decay = _ref3.decay,
      sustain = _ref3.sustain,
      release = _ref3.release;

  attack = attack || 0.01;
  decay = decay || 0.1;
  sustain = sustain || 0.8;
  release = release || 0.2;
  return envelope(ac, [["set", 0, 0], ["lin", 1, attack || 0.01], ["exp", sustain, decay], ["exp", 0, release]]);
}

function audioNode(ac, name) {
  var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var n = ac["create" + name]();
  Object.keys(config).forEach(function (key) {
    return plug(n, key, config[key]);
  });
  return n;
}

var osc = function osc(ac, config) {
  return audioNode(ac, "Oscillator", config);
};
var gain = function gain(ac, config) {
  return audioNode(ac, "Gain", config);
};

function polyphony(init) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var max = options.maxVoices || 16;
  var voices = [];
  for (var i = 0; i < max; i++) {
    voices[i] = init();
  }var current = -1;

  return function next() {
    current = (current + 1) % max;
    return voices[current];
  };
}

function connected(object, connections) {
  connections.reduce(function (src, next) {
    if (isString$1(src)) src = object[src];
    if (isString$1(next)) next = object[next];
    src.connect(next);
    return next;
  });
  return object;
}

/* global AudioContext */
var timeToBeats = function timeToBeats(time, bpm) {
  return time * bpm / 60;
};
var beatsToTime = function beatsToTime(beats, bpm) {
  return beats * 60 / bpm;
};
var ERR_INSTRUMENT_NOT_FOUND = "Instrument not found: ";

function initContext(ac) {
  // Shim to make connect chainable (soon to be implemented native)
  if (ac && ac.createGain) {
    var proto = Object.getPrototypeOf(Object.getPrototypeOf(ac.createGain()));
    var _connect = proto.connect;
    proto.connect = function () {
      _connect.apply(this, arguments);
      return this;
    };
  }
  return ac;
}

function waa() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var ac = initContext(options.context || new AudioContext());
  var driver = {
    paused: false,
    bpm: options.bpm || 120,
    instruments: {
      pluck: initPluck(ac)
    }
  };

  driver.stop = function () {
    return clearInterval(driver.seq);
  };

  var step = 0.1;
  var dur = timeToBeats(step, driver.bpm);
  return function (vm) {
    var zero = ac.currentTime;
    clock(ac, function (time) {
      vm.resume(dur);
    }, step);
    vm.audio = driver;
    return {
      "@play": function play(_ref) {
        var time = _ref.time,
            context = _ref.context,
            error = _ref.error;

        var when = beatsToTime(time, driver.bpm) + zero;
        var inst = context.get("inst");
        var trigger$$1 = driver.instruments[inst];
        if (!trigger$$1) error("@play", ERR_INSTRUMENT_NOT_FOUND, inst);else trigger$$1(when, context);
      }
    };
  };
}

function clock(ac, callback, time) {
  var lookAhead = time || 0.1;
  var updateInterval = lookAhead / 3;
  var next = ac.currentTime + lookAhead;
  var tick = function tick() {
    if (ac.currentTime + lookAhead >= next) {
      callback(next);
      next += lookAhead;
    }
  };
  tick();
  return setInterval(tick, updateInterval);
}

function initPluck(ac) {
  var synth = polyphony(function () {
    return connected({
      osc: osc(ac, { start: 0 }),
      envelope: adsr(ac),
      amp: gain(ac, { gain: 0 })
    }, ["osc", "envelope", "amp", ac.destination]);
  });

  return function (time, ctx) {
    var freq = ctx.get("freq");
    var amp = ampToGain(+ctx.get("amp"));
    console.log("pluck", freq, amp);
    var s = synth();
    plug(s.osc, "frequency", freq);
    plug(s.amp, "gain", amp);
    s.envelope.trigger(time);
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
// | **@shuffle** | Shuffle a list | `"@shuffle", [1, 2, 3]` |
// | **@chance** | Probabilistic execution | `probability, "@chance", executed-if-true, executed-if-false` |

function random() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      random = _ref.random;

  // allow to use a custom random function
  var rnd = random || Math.random;
  // a function that generates integer random from 0 to n
  var irnd = function irnd(n) {
    return floor(rnd() * n);
  };

  var _shuffle = function _shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
      j = floor(random() * i);
      x = a[i - 1];
      a[i - 1] = a[j];
      a[j] = x;
    }
  };

  return {
    "@random": function random(_ref2) {
      var stack = _ref2.stack;
      return stack.push(rnd());
    },
    "@rand": "@random",
    "@srandom": function srandom(_ref3) {
      var stack = _ref3.stack;
      return stack.push(rnd() * 2 - 1);
    },
    "@srand": "@srandom",
    "@randi": function randi(_ref4) {
      var stack = _ref4.stack;
      return stack.push(irnd(stack.pop()));
    },
    "@pick": function pick(proc) {
      var operations = proc.operations,
          error = proc.error;

      var pattern = operations.pop();
      if (!isArray(pattern)) {
        operations.push(pattern);
        error("Can't pick an element if is not an array", pattern);
      } else {
        var i = irnd(pattern.length);
        operations.push(pattern[i]);
      }
    },
    "@chance": function chance(_ref5) {
      var stack = _ref5.stack,
          operations = _ref5.operations;

      var prob = stack.pop();
      var pattern = operations.pop();
      if (rnd() < prob) {
        // Skip item after
        operations.pop();
        // Push the pattern
        operations.push(pattern);
      }
    },
    "@shuffle": function shuffle(_ref6) {
      var stack = _ref6.stack,
          operations = _ref6.operations,
          error = _ref6.error;

      var pattern = operations.pop();
      if (!isArray(pattern)) error("@shuffle", ERR_EXPECT_PATTERN, pattern);else operations.push(_shuffle(pattern));
    }
  };
}

function debug() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _log = _ref.log;

  _log = _log || console.log.bind(console);

  return {
    "@print": function print(proc) {
      var stack = proc.stack;

      var last$$1 = stack.length ? peek(stack) : "<Empty Stack>";
      _log("@print", last$$1, "(id, time)", proc.id, proc.time);
    },
    "@log": function log(proc) {
      var stack = proc.stack;

      var name = stack.pop();
      var last$$1 = stack.length ? peek(stack) : "<Empty Stack>";
      _log("@log", name, last$$1, "(id, time)", proc.id, proc.time);
    },
    "@debug": function debug(proc) {
      var stack = proc.stack;

      _log("@debug", stack, proc.id, proc.time);
    }
  };
}

// # Compatibility plugin

var inst = function inst(name) {
  return function (_ref) {
    var operations = _ref.operations;

    operations.push([name, "inst", "@let", "@play"]);
  };
};
var instNote = function instNote(name, p1, p2) {
  return function (_ref2) {
    var stack = _ref2.stack,
        operations = _ref2.operations;

    operations.push(p2 ? [stack.pop(), p2, "@let", stack.pop(), p1, "@let", name, "inst", "@let", "@play"] : [stack.pop(), p1, "@let", name, "inst", "@let", "@play"]);
  };
};

function init$2() {
  return {
    // get and set for freq and amp
    "@set-freq": function setFreq(_ref3) {
      var context = _ref3.context,
          stack = _ref3.stack;
      return context.set("freq", stack.pop());
    },
    "@set-amp": function setAmp(_ref4) {
      var context = _ref4.context,
          stack = _ref4.stack;
      return context.set("amp", stack.pop());
    },
    "@get-freq": function getFreq(_ref5) {
      var stack = _ref5.stack,
          context = _ref5.context;
      return stack.push(context.get("freq"));
    },
    "@get-amp": function getAmp(_ref6) {
      var stack = _ref6.stack,
          context = _ref6.context;
      return stack.push(context.get("amp"));
    },

    // I think reverse is not very useful in this context
    // because: ["@iter", ["@reverse", [1, 2, 3]]] doesn"t work, for example
    "@reverse": function reverse(_ref7) {
      var operations = _ref7.operations,
          error = _ref7.error;

      var pattern = operations.pop();
      if (!isArray(pattern)) error("@reverse", ERR_EXPECT_PATTERN, pattern);else operations.push(pattern.slice().reverse());
    },
    // I think @map is not a good name
    "@map": "@linear",

    // Instrument names
    "@pluck": inst("pluck"),
    "@pluck-note": instNote("pluck", "freq", "amp"),
    "@bass": inst("bass"),
    "@bass-note": instNote("bass", "freq", "amp"),
    "@hat": inst("hat"),
    "@hat-note": instNote("hat", "amp"),
    "@kick": inst("kick"),
    "@kick-note": instNote("kick", "amp"),
    "@snare": inst("snare"),
    "@snare-note": instNote("snare", "amp"),
    "@conga": inst("conga"),
    "@conga-note": instNote("conga", "amp"),
    "@clave": inst("clave"),
    "@clave-note": instNote("clave", "amp"),
    "@tom": inst("tom"),
    "@tom-note": instNote("tom", "amp")
  };
}

// # Audio Scheduler Virtual Machine
function initGibberish(Gibberish) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return init(init$1(Gibberish, options), options);
}

function initWebAudio(Tone) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return init(waa(Tone, options), options);
}

// the init function creates a vm controlled by Gibberish
function init(driver) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var plugins = options.plugins;
  // Create the virtual machine

  var vm = new VM({ amp: 0.5, freq: 440 }, options);
  // Use the audio driver
  vm.addCommands(driver);
  // Include all the command extensions
  vm.addCommands(random(options));
  vm.addCommands(debug(options));
  vm.addCommands(init$2(options));
  // Add the plugins if any
  if (plugins) plugins.forEach(function (cmds) {
    return vm.addCommands(cmds);
  });

  return vm;
}

exports.initGibberish = initGibberish;
exports.initWebAudio = initWebAudio;
exports.init = init;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ash-vm.js.map
