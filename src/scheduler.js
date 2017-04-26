// # Scheduler
import { Process } from "./process"

// The purpose of the Scheduler is to run processes concurrently.
export default class Scheduler {
  constructor ({ events = {} } = {}) {
    this.procs = [] // the procs are inverse ordered by time
    this.procsByName = {} // a map of names to procs
    this.time = 0
    this.events = events
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
    const onfork = this.events.fork
    if (onfork) onfork({ proc, time, name, parent, program, delay, rate })
    return proc
  }

  // run the vm for the given amount of time (Infinity if not specified)
  resume (commands, dur = Infinity, limit = 10000) {
    const { procs } = this
    if (procs.length > 0) {
      const nextTime = this.time + dur
      while (--limit > 0 && at(procs) < nextTime) {
        const proc = procs.pop()
        if (proc.resume(commands, nextTime)) {
          // the proc has more operations, re-schedule
          insert(proc, this.procs)
        } else {
          const onended = this.events.ended
          if (onended) onended({ proc, time: this.time })
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

    const onstop = this.events.stop
    if (onstop) onstop({ name, proc })

    remove(proc, this.procs)
  }
}

// ## Internal Scheduler functions

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
