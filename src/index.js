// # Audio Scheduler Virtual Machine
import { VM } from "./vm"
import gibberish from "./audio/gibberish"
import waa from "./audio/waa"
import stdlib from "./cmds/stdlib"
import random from "./cmds/random"
import debug from "./cmds/debug"
import compatibility from "./cmds/compatibility"

// ## Architecture Overview

// The main purpose of the virtual machine is to run processes concurrently.
// It holds a `commands` object (that maps instruction names to functions)
// and schedules a collection of `processes`. Each **process** has an values `stack`
// and `operations` stack (to be executed).

// ## API
export function initGibberish (Gibberish, options) {
  return init(gibberish, Gibberish, options)
}

export function initWebAudio (context, options) {
  return init(waa, context, options)
}

// the init function creates a vm controlled by Gibberish
export function init (driver, audio, options = {}) {
  const { plugins } = options
  // Create the virtual machine
  const vm = new VM(options)
  // Install the audio driver
  driver(audio, options).start(vm)

  // Include all the commands
  vm.addCommands(stdlib)
  vm.addCommands(random(options))
  vm.addCommands(debug(options))
  vm.addCommands(compatibility(options))
  // Add the plugins if any
  if (plugins) plugins.forEach(cmds => vm.addCommands(cmds))

  return vm
}
