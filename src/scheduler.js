import { Scope } from './scope'
import { Process } from './process'

// The scheduler is capable of run several processes at the same time
export class Scheduler {
  constructor (operator, name = 'default') {
    this.name = name
    this.nextId = 0
    this.scope = new Scope()
    this.operator = operator
    // procs are stored inverse ordered by time
    // where the next element (smaller time) is always the last
    this.procs = []
    this.time = 0
  }

  tick (length) {
    this.resume(this.time + length)
  }

  // will run the processes interleaved until the given time
  resume (time = Infinity, limit = 1000) {
    const { procs } = this
    while (--limit > 0 && this.at() < time) {
      const proc = procs.pop()
      if (proc.resume(this.operator, time)) {
        // the proc has more operations, re-schedule
        this.schedule(proc)
      }
    }
    this.time = time
  }

  // return the time of the next proc
  at () {
    const len = this.procs.length
    return len ? this.procs[len - 1].time : Infinity
  }

  // this creates a new process with the given program
  run (program, time) {
    return this.schedule(new Process(this.scope, program, time, 1))
  }
  // create a child process with the given program
  fork (parent, program, delay = 0) {
    return this.schedule(new Process(parent.scope, program, parent.time + delay, 1))
  }
  // schedule a process
  schedule (process) {
    // Add the scheduler to the process
    process.scheduler = this
    if (!process.id) process.id = this.name + '-' + this.nextId++

    if (this.procs.length === 0) {
      // no need to sort: just push it
      this.procs.push(process)
    } else {
      // procs are sorted on insertion
      let i = this.procs.length - 1
      let p = this.procs[i]
      while (p && p.time <= process.time) {
        i--
        p = this.procs[i]
      }
      this.procs.splice(i + 1, 0, process)
    }
    return process
  }
}
