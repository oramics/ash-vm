// # Compatibility plugin

import { isArray } from "../utils"
import { ERR_EXPECT_PATTERN } from "../commands"

// This plugin adds language compatibility to the previous version

// Given an instrument name, returns a command that play that instrument
const inst = name => ({ operations }) => {
  operations.push([name, "inst", "@let", "@play"])
}
const instNote = (name, p1, p2) => ({ stack, operations }) => {
  operations.push(p2
    ? [stack.pop(), p2, "@let", stack.pop(), p1, "@let",
      name, "inst", "@let", "@play"]
    : [stack.pop(), p1, "@let",
      name, "inst", "@let", "@play"])
}

export default function init () {
  return {
    // get and set for freq and amp
    "@set-freq": ({ context, stack }) => context.set("freq", stack.pop()),
    "@set-amp": ({ context, stack }) => context.set("amp", stack.pop()),
    "@get-freq": ({ stack, context }) => stack.push(context.get("freq")),
    "@get-amp": ({ stack, context }) => stack.push(context.get("amp")),

    // I think reverse is not very useful in this context
    // because: ["@iter", ["@reverse", [1, 2, 3]]] doesn"t work, for example
    "@reverse": ({ operations, error }) => {
      const pattern = operations.pop()
      if (!isArray(pattern)) error("@reverse", ERR_EXPECT_PATTERN, pattern)
      else operations.push(pattern.slice().reverse())
    },
    // I think @map is not a good name
    "@map": "@linear",

    // Instrument names
    "@pluck": inst("pluck"),
    "@pluck-note": instNote("pluck", "freq", "amp"),
    "@bass": inst("bass"),
    "@bass-note": instNote("bass", "freq", "amp"),
    "@hat": inst("hat"),
    "@hat-note": instNote("hat", "amp"),
    "@kick": inst("kick"),
    "@kick-note": instNote("kick", "amp"),
    "@snare": inst("snare"),
    "@snare-note": instNote("snare", "amp"),
    "@conga": inst("conga"),
    "@conga-note": instNote("conga", "amp"),
    "@clave": inst("clave"),
    "@clave-note": instNote("clave", "amp"),
    "@tom": inst("tom"),
    "@tom-note": instNote("tom", "amp"),
  }
}
