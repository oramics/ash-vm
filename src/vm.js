// # Virtual Machine

import { all } from "./commands";
import { Scheduler } from "./scheduler";

export const defaultActions = {
  log: console.log.bind(console),
  error: console.error.bind(console)
};

export class VM {
  // plugins is an array of plugins: objects with `{ commands, actions }`
  constructor(plugins = []) {
    this.scheduler = new Scheduler();
    this.initialContext = { amp: 0.8, freq: 440 };

    // commands are a map of instructions to commands with the form:
    // `{ '@instruction': (proc, actions) => ... }`
    this.commands = {};
    // actions are available to the commands
    this.actions = Object.assign({}, defaultActions);
    // the scheduler itself is a plugin (has commands and actions)
    this.usePlugin(this.scheduler);
    plugins.forEach(plugin => this.usePlugin(plugin));
  }

  run(program, delay, rate) {
    this.scheduler.schedule(this.initialContext, program, delay, rate);
  }

  // advance the virtual machine by a time ammount
  tick(duration) {
    this.scheduler.resume(this.commands, this.actions, duration);
  }

  // A plugin is an object with two properties:
  // - commands: a map of instructions to commands
  // - actions: a map of actions names to actions
  usePlugin(plugin) {
    Object.assign(this.commands, plugin.commands);
    Object.assign(this.actions, plugin.actions);
  }
}
