// # VM
import Scheduler from "./scheduler"
import stdlib from "./stdlib"
import { compile } from "./commands"

// ## VM
export default class VM {
  constructor (driver, options = {}) {
    this.context = {}
    this.driver = driver
    this.scheduler = new Scheduler(options)
    this.commands = stdlib(this.driver, this.scheduler, options)

    if (options.commands) this.addCommands(options.commands)
    if (this.driver) {
      this.addToContext(this.driver.defaultContext())
      this.addInstruments(this.driver.getInstruments())
      this.driver.start(this)
    }
  }

  addInstruments (instruments, params = []) {
    this.driver.addInstruments(instruments)
    const commands = Object.keys(instruments).reduce((commands, name) => {
      commands["@" + name] = ({ context }) => instruments[name](context)
      return instruments
    }, {})
    this.commands.add(commands)
  }

  // Run a program
  run (program, sync = true) {
    const { scheduler } = this
    // if there are no processes, no need to sync
    if (sync && scheduler.procs.length) program = ["@sync", program]
    // improve performance? I think so, but should benchmark
    const compiled = compile(program, this.commands, true)
    return scheduler.fork(null, this.context, compiled)
  }

  resume (dur, limit) {
    const { scheduler, commands } = this
    return scheduler.resume(commands, dur, limit)
  }

  addCommands (commands) {
    this.commands.add(commands)
    return this
  }

  // Add to the initial context
  addToContext (context) {
    Object.assign(this.context, context)
    return this.context
  }
}
