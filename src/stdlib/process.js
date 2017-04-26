// # Process
import { isArray } from "../utils"
import { ERR_EXPECT_PATTERN } from "./errors"

// Commands to control the current process
export default {
  // **@wait**: Wait an amount of time (in beats)
  // `1,"@wait"`
  "@wait": proc => proc.wait(Math.abs(Number(proc.stack.pop()))),

  // **@sync**: Wait until next beat
  "@sync": proc => proc.wait(Math.floor(proc.time) + 1 - proc.time),

  // **@scale-rate**: Change the current rate by a factor
  // `[1.5, "@scale-rate"]`
  "@scale-rate": proc => {
    const factor = parseFloat(proc.stack.pop(), 10)
    if (factor > 0) proc.rate *= factor
  },

  // **@with-rate**:
  "@with-rate": ({ stack, operations, error }) => {
    const factor = parseFloat(stack.pop(), 10)
    const pattern = operations.pop()
    if (!isArray(pattern)) error("@with-rate", ERR_EXPECT_PATTERN, pattern)
    operations.push([
      factor,
      "@scale-rate",
      pattern,
      1 / factor,
      "@scale-rate"
    ])
  },

}
