// # Compatibility plugin

import { isArray } from "../utils"
import { ERR_EXPECT_PATTERN } from "../vm"

// This plugin adds language compatibility to the previous version

// Given an instrument name, returns a command that play that instrument
const voice = name => ({ operations }) => {
  operations.push([name, "voice", "@let", "@play"])
}
const voiceNote = (name, p1, p2) => ({ stack, operations }) => {
  operations.push(p2
    ? [stack.pop(), p2, "@let", stack.pop(), p1, "@let",
      name, "voice", "@let", "@play"]
    : [stack.pop(), p1, "@let",
      name, "voice", "@let", "@play"])
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
    "@pluck": voice("pluck"),
    "@pluck-note": voiceNote("pluck", "freq", "amp"),
    "@bass": voice("bass"),
    "@bass-note": voiceNote("bass", "freq", "amp"),
    "@hat": voice("hat"),
    "@hat-note": voiceNote("hat", "amp"),
    "@kick": voice("kick"),
    "@kick-note": voiceNote("kick", "amp"),
    "@snare": voice("snare"),
    "@snare-note": voiceNote("snare", "amp"),
    "@conga": voice("conga"),
    "@conga-note": voiceNote("conga", "amp"),
    "@clave": voice("clave"),
    "@clave-note": voiceNote("clave", "amp"),
    "@tom": voice("tom"),
    "@tom-note": voiceNote("tom", "amp"),
  }
}
