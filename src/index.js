// # Audio Virtual Machine

// The main purpose of the virtual machine is to run processes concurrently

// ## Architecture Overview

// A **scheduler** is a collection of processes. Each **process** mantains
// an internal time value that can be modified.

import { VM } from "./vm";
import { gibberish } from "./gibberish";
import random from './ext/random'
import debug from './ext/debug'

const INITIAL_CTX = { amp: 0.5, freq: 440 };
const newCtx = () => Object.assign({}, INITIAL_CTX)

// ## API

export function init(Gibberish, ...plugins) {
  // Create the virtual machine and setup commands
  const vm = new VM();
  vm.addCommands(random())
  vm.addCommands(debug())
  plugins.forEach(cmds => vm.addCommands(cmds))

  // Init the audio driver
  gibberish(Gibberish, vm);

  // Return a `run(program)` function
  // this is the simplest API I can think. Probably will change.
  return (prog, sync = true) => {
    vm.fork(null, newCtx(), sync ? ["@sync", prog] : prog);
  };
}
