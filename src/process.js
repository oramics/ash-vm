// # Process

const isCommand = o => typeof o === "string" && o[0] === "@";
const isProgram = Array.isArray;
let procId = 1;
const ERR_INSTR_NOT_FOUND = "Instruction not recognized.";

// Processes are the principal computation unit. It departures from typical
// processes in that it model the concept of time
export class Process {
  constructor(program, context, time, rate) {
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
    this.error = this.error.bind(this)
  }

  // wait an amount of time
  wait(time) {
    this.time += this.rate * time;
  }

  // The process is agnostic about the commands to be use
  step(commands) {
    const { instructions } = this;
    if (instructions.length) {
      const instr = instructions.pop();
      if (instr === null || instr === undefined) {
        // ignore
      } else if (typeof instruction === "function") {
        instruction();
      } else if (isProgram(instr)) {
        // if it's program, and since the instructions are stored into an stack,
        // we need add to the program instructions in reverse order
        for (let i = instr.length - 1; i >= 0; i--) {
          instructions.push(instr[i]);
        }
      } else if (isCommand(instr)) {
        const operation = commands[instr];
        if (typeof operation === "function") operation(this);
        else this.error("", ERR_INSTR_NOT_FOUND, instr);
      } else {
        // if it's a value, push it into the stack
        this.stack.push(instr);
      }
    }
  }

  // the `resume` function run all the instructions until time is reached
  resume(commands, time = Infinity, limit = 10000) {
    const { instructions } = this;
    while (--limit > 0 && this.time < time && instructions.length) {
      this.step(commands);
    }
    if (limit === 0) this.error("Resume", ERR_LIMIT_REACHED);
    return instructions.length > 0;
  }

  // an utility function to write errors
  error(instr, msg, obj) {
    console.error(instr, msg, obj, "id", this.id, "time", this.time);
  }
}

// ## Context

// A context is a hierarchical structure to store values with scope
export class Context {
  constructor(parent) {
    if (parent instanceof Context) this.parent = parent;
    else if (parent) this.local = Object.assign({}, parent);
  }
  // get a value from a context
  get(id) {
    let target = this;
    while (target.value(id) === undefined && target.parent) {
      target = target.parent;
    }
    return target.value(id);
  }

  // set a value from a context
  set(id, value) {
    let target = this;
    while (target.value(id) === undefined && target.parent) {
      target = target.parent;
    }
    target.let(id, value);
  }
  // get a value from the local scope of a context
  value(id) {
    return this.local ? this.local[id] : undefined;
  }

  // set a value into the local scope of a context
  let(id, value) {
    if (!this.local) this.local = {};
    this.local[id] = value;
  }
}
