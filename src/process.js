// # Process
import Context from "./context"

// #### Utilities
// test if the given operation is an instruction name
const isCommand = o => typeof o === "string" && o[0] === "@"
// test if the given operation is a program
const isProgram = Array.isArray
// Give unique ids to process
let procId = 1

// #### Error messages

// The given instruction name is not in the commands object
const ERR_INSTR_NOT_FOUND = "Instruction not recognized."
// The max loop cycles tests
const ERR_LIMIT_REACHED = "Limit reached. Probably an infinity loop."

// ## Process

// Processes are the principal computation unit. The main characteristic of
// processes in this VM is that it models the concept of time
export default class Process {
  constructor (program, context, time, rate) {
    this.id = "proc-" + procId++
    // a stack of values
    this.stack = []
    // the operations are also stored in a stack (reverse order)
    this.operations = program ? [program] : []
    // the context is used to store variables with scope
    this.context = new Context(context)
    // the current time
    this.time = typeof time === "number" ? time : 0
    // how fast time passes
    this.rate = typeof rate === "number" ? rate : 1
    // bind error to this, to allow destructuring it in commands
    this.error = this.error.bind(this)
  }

  // wait an amount of time
  wait (time) {
    this.time += this.rate * time
  }

  // The process is agnostic about the commands to interpret
  step (commands) {
    const { operations } = this
    if (operations.length) {
      const instr = operations.pop()
      if (instr === null || instr === undefined) {
        // ignore
      } else if (typeof instr === "function") {
        instr(this)
      } else if (isProgram(instr)) {
        // if it"s program, and since the operations are stored into an stack,
        // we need add to the program operations in reverse order
        for (let i = instr.length - 1; i >= 0; i--) {
          operations.push(instr[i])
        }
      } else if (isCommand(instr)) {
        const cmd = commands.resolve(instr)
        if (typeof cmd === "function") cmd(this)
        else this.error("step > ", ERR_INSTR_NOT_FOUND, instr)
      } else {
        // if it"s a value, push it into the stack
        this.stack.push(instr)
      }
    }
  }

  // the `resume` function run all the operations until time is reached
  resume (commands, time = Infinity, limit = 10000) {
    const { operations } = this
    while (--limit > 0 && this.time < time && operations.length) {
      this.step(commands)
    }
    if (limit === 0) throw Error(ERR_LIMIT_REACHED)
    return operations.length > 0
  }

  // an utility function to write errors
  error (instr, msg, obj) {
    console.error(instr, msg, obj, "id", this.id, "time", this.time)
  }
}
