// ## The Operator

// An operator uses a collection of commands to execute an instruction
// The process uses the operator to run its operations
export class Operator {
  constructor (...libraries) {
    this.commands = {}
    libraries.forEach(lib => add(this.commands, lib))
  }

  // Create a new operator with the given commands
  use (library) {
    return new Operator(this.commands, library)
  }

  execute (op, process) {
    const fn = this.commands[op]
    if (!fn) throw Error('Operation not valid: ' + op)
    return fn(process)
  }
}

// (private) Add libraries to a library
function add (dest, src) {
  Object.keys(src).forEach(key => {
    let fn = src[key]
    // if is not a function, should be an alias
    while (typeof fn !== 'function') fn = src[fn]
    if (!fn) throw Error('The given key is not an operator: ' + key)
    // add the function to the destination library
    dest[key] = fn
  })
}

import * as cmds from './commands'
// The default operator includes all commands
export const defaultOperator = new Operator(
  cmds.process,
  cmds.schedule,
  cmds.repeat,
  cmds.debug
)
