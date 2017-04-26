// ## Random
import { isArray } from "../utils"
import { ERR_EXPECT_PATTERN } from "./errors"
const { floor } = Math

// A collection of commands related to randomness

// #### Commands
export default function random ({ random } = {}) {
  // allow to use a custom random function
  const rnd = random || Math.random
  // a function that generates integer random from 0 to n
  const irnd = n => floor(rnd() * n)

  const shuffle = a => {
    var j, x, i
    for (i = a.length; i; i--) {
      j = floor(random() * i)
      x = a[i - 1]
      a[i - 1] = a[j]
      a[j] = x
    }
  }

  return {
    // **@random**: Generate a random number between 0 and 1
    // `["@random", "amp", "@set"]`
    "@random": ({ stack }) => stack.push(rnd()),

    // **@rand**: Alias for @random
    "@rand": "@random",

    // **@srandom**: Generate a random number between -1 and 1
    // `["@srandom", "phase", "@set"]`
    "@srandom": ({ stack }) => stack.push(rnd() * 2 - 1),

    // **@srand**: Alias for @srandom
    "@srand": "@srandom",

    // **@randi**: Generate a random integer between 0 and n
    // `[40, "@randi", 20, "@+", "@mtof", "freq", "@set"]`
    "@randi": ({ stack }) => stack.push(irnd(stack.pop())),

    // **@pick**: pick a random element from a list
    // `["@list", [1, 2, 3, 4], "@pick", "amp", "@set"]`
    "@pick": ({ stack, error }) => {
      const list = stack.pop()
      if (!isArray(list)) {
        error("Can't pick an element if is not an array", list)
      } else {
        const i = irnd(list.length)
        stack.push(list[i])
      }
    },

    // **@chance* *: Probabilistic execution
    // [probability, "@chance", executed-if-true, executed-if-false]
    // `[0.5, "@chance", [440, "freq", "@set"], ["@rand", "amp", "@set"]]`
    "@chance": ({ stack, operations }) => {
      const prob = stack.pop()
      const ifTrue = operations.pop()
      if (rnd() < prob) {
        // Skip the 'false branch'
        operations.pop()
        // Set the 'true branch' as the next operation
        operations.push(ifTrue)
      } else {
        // The 'false branch' is currenty the next operation
        // so there's no need to do anything
      }
    },

    // **@shuffle**: Shuffle a list
    // `["@list", [1, 2, 3], "@shuffle", "@iter"]`
    "@shuffle": ({ stack, error }) => {
      const pattern = stack.pop()
      if (!isArray(pattern)) error("@shuffle", ERR_EXPECT_PATTERN, pattern)
      else stack.push(shuffle(pattern))
    }
  }
}
