// # Utilities
// Utility commands

export default {
  // **@mtof**: midi to frequency
  // [60, '@mtof']
  "@mtof": ({ stack }) => {
    const midi = stack.pop()
    const freq = 440 * Math.pow(2, (+midi - 69) / 12)
    stack.push(freq)
  },

  // **@linear**: convert a value between two linear scales
  // [value, fromLow, fromHi, toLow, toHi, "@linear"]
  "@linear": ({ stack }) => {
    const ohi = stack.pop()
    const olo = stack.pop()
    const ihi = stack.pop()
    const ilo = stack.pop()
    const v = stack.pop()

    if (ihi === ilo) {
      stack.push(olo)
    } else {
      stack.push(olo + (ohi - olo) * ((v - ilo) / (ihi - ilo)))
    }
  },
}
