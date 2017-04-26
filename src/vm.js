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

    if (driver) {
      this.addToContext(driver.defaultContext())
      this.commands.add(createCommands(driver.getInstruments()))
      driver.start(this)
    }
    if (options.commands) this.addCommands(options.commands)
  }

  addInstruments (instruments) {
    console.log("ADDDDDIIII", instruments)
    this.driver.addInstruments(instruments)
    this.commands.add(createCommands(instruments))
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
    return this.scheduler.resume(this.commands, dur, limit)
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

function createCommands (instruments) {
  return Object.keys(instruments).reduce((commands, name) => {
    commands["@" + name] = ({ context }) => instruments[name](context)
    return commands
  }, {})
}
