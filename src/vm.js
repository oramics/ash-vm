// # VM

import { isArray, isString, isFn } from "./utils"
import { Process } from "./process"

// **Error messages**
export const ERR_EXPECT_PATTERN = "Expected a pattern, but found:"
export const ERR_EXPECT_STRING = "Expected a string, but found:"

const assign = Object.assign

// The purpose of the VM is to run processes concurrently. It also
// mantains an extensible object of commands (operations mapped to functions)
// that allows to add operations to the vm

// TODO: probably is better to have functions and object instead of classes
// will change in the future.
export class VM {
  constructor (options = {}) {
    this.context = Object.assign({}, options.context)
    this.procs = [] // the procs are inverse ordered by time
    this.procsByName = {} // a map of names to procs
    this.time = 0
    this.commands = createCommands(this)
    this.onfork = options.onfork
    this.onstop = options.onstop
    this.onended = options.onended
  }

  // Run a program
  run (program, sync = true) {
    // if there are no processes, no need to sync
    if (sync && this.procs.length) program = ["@sync", program]
    return this.fork(null, this.context, program)
  }

  // Add to the initial context
  addContext (context) {
    Object.assign(this.context, context)
    return this.context
  }

  // Add more commands
  addCommands (commands) {
    if (isFn(commands)) commands = commands(this)
    if (commands) assign(this.commands, expandAliases(commands))
  }

  // Create a new process
  fork (name, parent, program, delay = 0, rate) {
    const time = this.time + delay
    // if has parent and no rate, try to use it"s rate
    if (!rate && parent) rate = parent.rate
    // if has parent try to use it"s context
    const context = parent ? parent.context || parent : undefined
    // create the new process and insert into the process stack
    const proc = new Process(program, context, time, rate)
    insert(proc, this.procs)
    // if has name, register it
    if (name) this.procsByName[name] = proc
    if (this.onfork) this.onfork({ proc, name, parent, program, delay, rate })
    return proc
  }

  // run the vm for the given amount of time (Infinity if not specified)
  resume (dur = Infinity, limit = 10000) {
    const { procs } = this
    if (procs.length > 0) {
      const nextTime = this.time + dur
      while (--limit > 0 && at(procs) < nextTime) {
        const proc = procs.pop()
        if (proc.resume(this.commands, nextTime)) {
          // the proc has more operations, re-schedule
          insert(proc, this.procs)
        } else {
          if (this.onended) this.onended({ proc, time: this.time })
        }
      }
      this.time = nextTime
    } else {
      this.time += dur
    }
    return procs.length > 0
  }

  stopAll () {
    this.procs.length = 0
  }

  // The stop function can stop a proccess by name or by object
  stop (name) {
    let proc
    if (typeof proc === "string") {
      proc = this.procsByName[name]
      this.procsByName[name] = null
    } else {
      proc = name
      name = null
    }
    if (this.onstop) this.onstop({ name, proc })

    remove(proc, this.procs)
  }
}

// ## VM commands

// | Name | Description | Example |
// |------|-------------|---------|
// | **@fork** | Fork | `@fork, [0.5, "@wait", "@kick"]` |
// | **@spawn** | Spawn | `"melody", "@spawn", [0.5, "@wait", "@kick"]` |
// | **@stop** | Stop current process | `@stop` |
// | **@stop-all** | Stop all processes | `@stop-all` |
function createCommands (vm) {
  return {
    "@loop": proc => {
      const { operations, error } = proc
      const pattern = operations.pop()
      if (isArray(pattern)) vm.fork(null, proc, ["@forever", pattern])
      else error("@loop", ERR_EXPECT_PATTERN, pattern)
    },
    "@fork": proc => {
      const { operations, error } = proc
      let pattern = operations.pop()

      if (isArray(pattern)) {
        vm.fork(null, proc, pattern)
      } else {
        error("@fork", ERR_EXPECT_PATTERN, pattern)
      }
    },
    "@spawn": proc => {
      const { stack, operations, error } = proc
      const name = stack.pop()
      let pattern = operations.pop()
      if (!isString(name)) {
        error("@spawn", ERR_EXPECT_STRING, name)
      } else if (!isArray(pattern)) {
        error("@spawn", ERR_EXPECT_PATTERN, pattern)
      } else {
        vm.stop(name)
        vm.fork(name, proc, ["@forever", pattern])
      }
    },
    "@stop-all": proc => vm.stopAll(),
    "@stop": ({ stack }) => vm.stop(stack.pop())
  }
}

// ## Internal VM functions

// remove a process process
function remove (proc, procs) {
  let i = procs.length - 1
  while (i >= 0 && procs[i] !== proc) {
    i--
  }
  // if found, remove it
  if (i !== -1) procs.splice(i, 1)
  return i !== -1
}

// insert a process into a stack ordered by time
// (in fact, is inverse order because it"s a stack)
function insert (proc, procs) {
  if (procs.length === 0) {
    // no need to sort: just push it
    procs.push(proc)
  } else {
    // procs are sorted on insertion
    let i = procs.length - 1
    let p = procs[i]
    while (p && p.time <= proc.time) {
      i--
      p = procs[i]
    }
    procs.splice(i + 1, 0, proc)
  }
  return proc
}

// get time of the next process
function at (procs) {
  const len = procs.length
  return len ? procs[len - 1].time : Infinity
}

// Given a commands object, expand the aliases
function expandAliases (commands) {
  Object.keys(commands).forEach(name => {
    const op = commands[name]
    if (isString(op)) commands[name] = commands[op]
  })
  return commands
}
