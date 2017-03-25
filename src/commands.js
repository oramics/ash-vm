// # Commands
const isPattern = Array.isArray
const peek = (stack) => stack[stack.length - 1]

// Given a commands object, expand the aliases
export function expandAliases(commands) {
  Object.keys(commands).forEach(cmd => {
    const op = commands[op];
    if (typeof op === "string") {
      commands[cmd] = commands[op];
    }
  });
}

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
export const core = {
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

  "@stop-all": (proc, { stop }) => stop(),

  "@fork": (proc, { error, fork }) => {
    const { instructions } = proc;
    const pattern = instructions.pop();

    if (!isPattern(pattern))
      error("Fork error - not valid pattern: " + pattern);
    else
      fork(proc, pattern);
  }
};

// ## Repeat and loop

// | Name | Description | Example |
// |------|-------------|---------|
// | **@repeat** | Repeat a pattern | `4, @repeat, ['@kick', 0.5, '@wait']` |
export const repetition = {
  "@repeat": ({ stack, instructions }) => {
    const repetitions = stack.pop();
    const pattern = peek(instructions);
    if (!isPattern(pattern)) throw Error("Can't repeat: " + pattern);
    for (let i = 1; i < repetitions; i++) {
      instructions.push(pattern);
    }
  },
  "@forever": ({ instructions }) => {
    const pattern = peek(instructions);
    if (!isPattern(pattern)) throw Error("Can't forover: " + pattern);
    if (pattern.length) {
      instructions.push("@forever");
      instructions.push(pattern);
    }
  },
  "@loop": proc => {
    const { instructions, scheduler } = proc;
    const pattern = instructions.pop();
    if (!scheduler) throw Error("Can't loop without an scheduler");
    if (!isPattern(pattern))
      throw Error("Can't loop something is not a pattern: " + pattern);
    scheduler.fork(proc, ["@forever", pattern]);
  }
};

// ## Iteration and lists
// | Name | Description | Example |
// |------|-------------|---------|
// | **@iter** | Iterate a pattern | `[["@iter", [0.3, 1]], "@set-amp"]` |
const lists = {
  "@iter": ({ instructions }) => {
    const pattern = instructions.pop()
    if (!isPattern(pattern) || !pattern.length) error("Can't iterate:", pattern)
    else {
      // Rotates the pattern and plays the first item only each time
      // remove '1st' item, schedule, then push to back:
      const first = pattern.splice(0, 1)
      instructions.push(first)
      pattern.push(first)
    }
  }
}

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

export const arithmetic = {
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
// | **@print** | Print the last value of the stack | `10,@print` |
export const debug = {
  "@print": (proc, { log }) => {
    const stack = proc.stack;
    const last = stack.length ? stack.pop() : "<Empty Stack>";
    log("@print", last, "(id, time)", proc.id, proc.time);
  }
};

export const all = Object.assign({},
  core, repetition, lists, arithmetic, logic, debug
)
