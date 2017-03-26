// # Scheduler
import { Process, Context } from './process'

// TODO: probably is better to have functions and object instead of classes
// will change in the future
export class Scheduler {
  constructor() {
    this.procs = []; // the procs are inverse ordered by time
    this.procsByName = {}; // a map of names to procs
    this.time = 0;
    // the action are exposed to be used in commands
    this.actions = {
      fork: this.fork.bind(this),
      stop: this.stop.bind(this),
      stopAll: this.stopAll.bind(this)
    }
  }

  // Create a new process
  fork(name, parent, program, delay = 0, rate) {
    const time = this.time + delay;
    if (!rate && parent) rate = parent.rate
    const context = parent ? parent.context || parent : undefined
    // Create a child context
    const proc = new Process(program, context, time, rate)
    push(proc, this.procs)
    if (name) this.procsByName[name] = proc
    return proc
  }

  // run the scheduler for the given time (Infinity if not specified)
  resume(commands, actions, dur = Infinity, limit = 10000) {
    const { procs } = this
    if (procs.length === 0) return false
    const time = this.time + dur
    while (--limit > 0 && at(procs) < time) {
      const proc = procs.pop();
      if (proc.resume(commands, actions, time)) {
        // the proc has more operations, re-schedule
        push(proc, this.procs);
      }
    }
    this.time = time;
    return procs.length > 0;
  }

  stopAll () {
    this.procs.length = 0
  }

  // The stop function can stop a proccess by name or by object
  stop (proc) {
    if (typeof proc === 'string') {
      const name = proc
      proc = this.procsByName[name]
      this.procsByName[name] = null
    }
    remove(proc, this.procs)
  }
}

// remove the process
function remove(proc, procs) {
  let i = procs.length - 1
  while (i >= 0 && procs[i] !== proc) i--
  // if found, remove it
  if (i !== -1) procs.splice(i, 1)
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
    let i = procs.length - 1;
    let p = procs[i];
    while (p && p.time <= proc.time) {
      i--;
      p = procs[i];
    }
    procs.splice(i + 1, 0, proc);
  }
  return proc;
}

// get time of the next process
function at (procs) {
  const len = procs.length
  return len ? procs[len - 1].time : Infinity;
}
