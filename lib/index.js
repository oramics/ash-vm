// # Audio Scheduler Virtual Machine
import { VM } from './vm'
import gibberish from './audio/gibberish'
import waa from './audio/waa'
import random from './ext/random'
import debug from './ext/debug'
import compatibility from './ext/compatibility'

// ## Architecture Overview

// The main purpose of the virtual machine is to run processes concurrently.
// It holds a `commands` object (that maps instruction names to functions)
// and schedules a collection of `processes`. Each **process** has an values `stack`
// and `operations` stack (to be executed).

// ## API
export function initGibberish (Gibberish, options = {}) {
  return init(gibberish(Gibberish, options), options)
}

export function initWebAudio (Tone, options = {}) {
  return init(waa(Tone, options), options)
}

// the init function creates a vm controlled by Gibberish
export function init (driver, options = {}) {
  const { plugins } = options
  // Create the virtual machine
  const vm = new VM({ amp: 0.5, freq: 440 }, options)
  // Use the audio driver
  vm.addCommands(driver)
  // Include all the command extensions
  vm.addCommands(random(options))
  vm.addCommands(debug(options))
  vm.addCommands(compatibility(options))
  // Add the plugins if any
  if (plugins) plugins.forEach(cmds => vm.addCommands(cmds))

  return vm
}
