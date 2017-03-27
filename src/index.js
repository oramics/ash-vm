// # Audio Scheduler Virtual Machine
import { VM } from './vm'
import { gibberish } from './gibberish'
import random from './ext/random'
import debug from './ext/debug'

// ## Architecture Overview

// The main purpose of the virtual machine is to run processes concurrently.
// It holds a `commands` object (that maps instruction names to functions)
// and schedules a collection of `processes`. Each **process** has an values `stack`
// and `operations` stack (to be executed).

// ## API

// the init function creates a vm controlled by Gibberish
export function init (Gibberish, ...plugins) {
  // Create the virtual machine and setup commands
  const vm = new VM({ amp: 0.5, freq: 440 })
  vm.addCommands(random())
  vm.addCommands(debug())
  plugins.forEach(cmds => vm.addCommands(cmds))

  // Init the audio driver
  gibberish(Gibberish, vm)
  return vm
}
