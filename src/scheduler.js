// # Scheduler
import { Process, Context } from './process'

export class Scheduler {
  constructor() {
    this.procs = []; // the procs are inverse ordered by time
    this.time = 0;
    // the action are exposed to be used in commands
    this.actions = {
      schedule: this.schedule.bind(this),
      fork: this.fork.bind(this),
      stop: this.stop.bind(this)
    }
  }

  schedule(ctxData, program, delay = 0, rate = 1) {
    const time = this.time + delay;
    // Create a context with the given data
    const context = new Context(null, ctxData)
    this.add(new Process(program, context, time, rate));
  }

  fork(proc, program, delay = 0, rate) {
    const time = this.time + delay;
    if (!rate) rate = proc.rate;
    // Create a child context
    const context = new Context(proc.context)
    return this.add(new Process(program, proc.context, time, rate));
  }

  // run the scheduler for the given time (Infinity if not specified)
  resume(commands, actions, dur = Infinity, limit = 10000) {
    const { procs } = this
    if (procs.length === 0) return false
    const time = this.time + dur
    while (--limit > 0 && this.nextTime() < time) {
      const proc = procs.pop();
      if (proc.resume(commands, actions, time)) {
        // the proc has more operations, re-schedule
        this.add(proc);
      }
    }
    this.time = time;
    return procs.length > 0;
  }

  stop () {
    this.procs.clear()
  }

  // add a process to the scheduler
  add(proc) {
    const { procs } = this

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
  nextTime() {
    const len = this.procs.length
    return len ? this.procs[len - 1].time : Infinity;
  }
}
