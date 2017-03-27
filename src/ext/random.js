// ## Randomness
import { isArray } from '../utils'
const { floor } = Math

// | Name | Description | Example |
// |------|-------------|---------|
// | **@random** | Generate a random number between 0 and 1 | `["@random", "amp", "@set"]` |
// | **@rand** | Alias for @random | |
// | **@srandom** | Generate a random number between -1 and 1 | `["@srandom", "phase", "@set"]` |
// | **@srand** | Alias for @srandom | |
// | **@randi** | Generate a random integer between 0 and n | `[60, "@randi", "midi", "@set"]` |
// | **@pick** | Pick a random element from a list | `["@pick", [1, 2, 3, 4]]` |
// | **@chance** | Probabilistic execution | `probability, "@chance", executed-if-true, executed-if-false` |
export default function random (random) {
  // allow to use a custom random function
  const rnd = random || Math.random
  // a function that generates integer random from 0 to n
  const irnd = n => floor(rnd() * n)

  return {
    '@random': ({ stack }) => stack.push(rnd()),
    '@rand': '@random',
    '@srandom': ({ stack }) => stack.push(rnd() * 2 - 1),
    '@srand': '@srandom',
    '@randi': ({ stack }) => stack.push(irnd(stack.pop())),
    '@pick': proc => {
      const { instructions, error } = proc
      const pattern = instructions.pop()
      if (!isArray(pattern)) {
        instructions.push(pattern)
        error("Can't pick an element if is not an array", pattern)
      } else {
        const i = irnd(pattern.length)
        instructions.push(pattern[i])
      }
    },
    '@chance': ({ stack, instructions }) => {
      const prob = stack.pop()
      const pattern = instructions.pop()
      if (rnd() < prob) {
        // Skip item after
        instructions.pop()
        // Push the pattern
        instructions.push(pattern)
      }
    }
  }
}
