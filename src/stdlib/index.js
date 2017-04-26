// # Standard library
import Commands from "../commands"
import core from "./core"
import audio from "./audio"
import iterables from "./iterables"
import execution from "./execution"
import process from "./process"
import schedule from "./schedule"
import context from "./context"
import random from "./random"
import debug from "./debug"
import utilities from "./utilities"

// The standard lib include all the modules
export default function stdlib (driver, scheduler, options = {}) {
  return new Commands([
    core,
    iterables,
    execution,
    process,
    context,
    audio(driver),
    schedule(scheduler),
    random(options),
    debug(options),
    utilities,
  ])
}
