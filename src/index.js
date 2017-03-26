// # Audio Virtual Machine

// The main purpose of the virtual machine is to run processes concurrently

// ## Architecture Overview

// A **scheduler** is a collection of processes. Each **process** mantains
// an internal time value that can be modified.

import { VM } from "./vm";
import { all } from "./commands";
import { gibberish } from "./gibberish";
import * as builders from "./builders";

// ## API

export function init(Gibberish, ...plugins) {
  plugins = [{ commands: all }].concat(plugins);
  // Create the virtual machine
  const vm = new VM(plugins);
  // Init the audio driver
  gibberish(Gibberish, vm);
  // Return vm's run function
  return (prog, sync = true) => {
    vm.run(sync ? ['@sync', prog] : prog)
  }
}

export function live() {
  const fns = Object.keys(builders);
  fns.forEach(fn => {
    window[fn] = builders[fn];
  });
  console.log('LIVE!', fns)
}
