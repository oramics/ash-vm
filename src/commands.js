// # Commands

// **Utilities**
const isArray = Array.isArray;
const isString = o => typeof o === "string";

// get last element of the stack
const peek = stack => stack[stack.length - 1];
// midi to frequency
const mtof = pitch => 440 * Math.pow(2, (+pitch - 69) / 12);
// Given a commands object, expand the aliases
const expandAliases = commands =>
  Object.keys(commands).reduce(
    (commands, cmd) => {
      const op = commands[cmd];
      if (typeof op === "string") {
        commands[cmd] = commands[op];
      }
      return commands;
    },
    commands
  );

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
export const core = expandAliases({
  "@dup": ({ stack }) => stack.push(peek(stack)),
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

  "@wait": proc => proc.wait(Math.abs(Number(proc.stack.pop()))),
  "@sync": proc => proc.wait(Math.floor(proc.time) + 1 - proc.time),

  "@stop": ({ stack }, { stop }) => {
    const name = stack.pop();
    stop(name);
  },
  "@stop-all": (proc, { stopAll }) => stopAll(),

  "@fork": (proc, { error, fork }) => {
    const { instructions } = proc;
    let pattern = instructions.pop();

    if (isArray(pattern)) {
      fork(null, proc, pattern);
    } else {
      error("@fork", ERR_BAD_PATTERN, pattern);
    }
  },
  "@spawn": (proc, { stop, fork, error }) => {
    const { stack, instructions } = proc;
    const name = stack.pop();
    let pattern = instructions.pop();
    if (!isString(name))
      error("@spawn", ERR_NAME, name);
    else if (!isArray(pattern))
      error("@spawn", ERR_BAD_PATTERN, pattern);
    else {
      stop(name);
      fork(name, proc, ["@forever", pattern]);
    }
  }
});

// ## Repeat and loop

// | Name | Description | Example |
// |------|-------------|---------|
// | **@repeat** | Repeat a pattern | `4, @repeat, ['@kick', 0.5, '@wait']` |
export const repetition = {
  "@repeat": ({ stack, instructions }) => {
    const repetitions = stack.pop();
    const pattern = peek(instructions);
    if (!isArray(pattern)) throw Error("Can't repeat: " + pattern);
    for (let i = 1; i < repetitions; i++) {
      instructions.push(pattern);
    }
  },
  "@forever": ({ instructions }) => {
    const pattern = peek(instructions);
    if (!isArray(pattern)) throw Error("Can't forover: " + pattern);
    if (pattern.length) {
      instructions.push("@forever");
      instructions.push(pattern);
    }
  },
  "@loop": (proc, { error, fork }) => {
    const { instructions } = proc;
    const pattern = instructions.pop();
    if (isArray(pattern)) fork(null, proc, ["@forever", pattern]);
    else error("@loop", ERR_BAD_PATTERN, pattern);
  }
};

// ## Iteration and lists
// | Name | Description | Example |
// |------|-------------|---------|
// | **@iter** | Iterate a pattern | `[["@iter", [0.3, 1]], "@set-amp"]` |
const lists = {
  "@iter": ({ instructions }) => {
    const pattern = instructions.pop();
    if (!isArray(pattern) || !pattern.length)
      error("Can't iterate:", pattern);
    else {
      // Rotates the pattern and plays the first item only each time
      // remove '1st' item, schedule, then push to back:
      const first = pattern.splice(0, 1);
      instructions.push(first);
      pattern.push(first);
    }
  }
};

// ## Randomness

// generate a random number between 0 and n
const rnd = n => Math.floor(Math.random() * n);

// | Name | Description | Example |
// |------|-------------|---------|
// | **@random** | Generate a random number between 0 and 1 | `["@random", "amp", "@set"]` |
// | **@rand** | Alias for @random | |
// | **@srandom** | Generate a random number between -1 and 1 | `["@srandom", "phase", "@set"]` |
// | **@srand** | Alias for @srandom | |
// | **@randi** | Generate a random integer between 0 and n | `[60, "@randi", "midi", "@set"]` |
// | **@pick** | Pick a random element from a list | `["@pick", [1, 2, 3, 4]]` |
// | **@chance** | Probabilistic execution | `probability, "@chance", executed-if-true, executed-if-false` |
const random = expandAliases({
  "@random": ({ stack }) => stack.push(Math.random()),
  "@rand": "@random",
  "@srandom": ({ stack }) => stack.push(Math.random * 2 - 1),
  "@srand": "@srandom",
  "@randi": ({ stack }) => stack.push(rnd(stack.pop())),
  "@pick": ({ stack, instructions }, { error }) => {
    const pattern = instructions.pop();
    if (!isArray(pattern)) {
      instructions.push(pattern);
      error("Can't pick an element if is not an array", pattern);
    } else {
      const i = rnd(pattern.length);
      instructions.push(pattern[i]);
    }
  },
  "@chance": ({ stack, instructions }) => {
    const prob = stack.pop();
    const pattern = instructions.pop();
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

export const arithmetic = expandAliases({
  "@+": op2((a, b) => a + b),
  add: "@+",
  "@-": op2((a, b) => a - b),
  "@sub": "@-",
  "@*": op2((a, b) => a * b),
  "@mul": "@*",
  "@/": op2((a, b) => b === 0 ? 0 : b / a),
  "@div": "@/",
  "@%": op2((a, b) => b === 0 ? 0 : wrap(a, b)),
  "@wrap": "@%",
  "@mod": op2((a, b) => b === 0 ? 0 : a % b),
  "@neg": op1(a => -a)
});

// ## Conditionals
// _should they return 1 and 0 instead of bools?_

export const logic = {
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
// | **@print** | Print the last value of the stack | `10,"@print"` |
// | **@log** | Log the name with the last value of the stack | `"@random", "amp", "@log"` |
export const debug = {
  "@print": (proc, { log }) => {
    const { stack } = proc;
    const last = stack.length ? peek(stack) : "<Empty Stack>";
    log("@print", last, "(id, time)", proc.id, proc.time);
  },
  "@log": (proc, { log }) => {
    const { stack } = proc;
    const name = stack.pop();
    const last = stack.length ? peek(stack) : "<Empty Stack>";
    log("@log", name, last, "(id, time)", proc.id, proc.time);
  },
  "@debug": (proc, { log }) => {
    const { stack } = proc
    log('@debug', stack, proc.id, proc.time)
  }
};

export const all = Object.assign(
  {},
  core,
  repetition,
  lists,
  arithmetic,
  random,
  logic,
  debug
);
