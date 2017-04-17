// # Builders

// Create a new named sequence
export const def = (name, patt) => [name, "@spawn", patt]

// Set a value into the context
export const set = (name, value) => [value, name, "@set"]

// Set a value into the local the context
export const lset = (name, value) => [value, name, "@let"]

// Wait for an amount of time
export const wait = t => [t, "@wait"]

// Stop the named sequence
export const stop = n => n ? [n, "@stop"] : ["@stop-all"]

// Loop a pattern a number of times
export const loop = (p, n) => n ? [n, "@repeat", p] : ["@loop", p]

// Print a value/message (and remove it from the stack)
export const print = msg => [msg, "@print"]

// Log a value (it prints the name and the value, but keeps the value into stack)
export const log = name => [name, "@log"]

// Quote a pattern
export const quote = (ptn, cmd) => {
  const arr = ptn[0] === "@quote" ? ptn.slice() : ["@quote", ptn]
  if (cmd) arr.push(cmd)
  return arr
}

// Iterate a list
export const iter = ptn => quote(ptn, "@iter")
// Reverse a list
export const reverse = ptn => quote(ptn, "@reverse")

// Schuffle a list
export const shuffle = ptn => quote(ptn, "@shuffle")

// Rotate a list n times
export const rotate = (ptn, times) => quote(ptn, [times !== undefined ? times : 1, "@rotate"])

// Pick a random value from a list
export const pick = ptn => quote(ptn, "@pick")

// Conditional
export const cond = (f, pt, pf) => [f, "@cond", pt, pf]

// Conditional operation based on a random
export const chance = (f, pt, pf) => [f, "@chance", pt, pf]

// Subtract two values
export const sub = (a, b) => [a, b, "@sub"]

// Execute arguments
export const execute = (l, args) =>
  args !== undefined ? [l, "@execute", args] : [l, "@execute"]

// Just a convenience
// every(3, p) actually creates cond(iter([0,0,1]),p)
// neat eh?
export const every = (n, p) => {
  const l = []
  for (let i = 0; i < n - 1; i++) {
    l.push(0)
  }
  l.push(1)
  return cond(iter(l), p)
}
