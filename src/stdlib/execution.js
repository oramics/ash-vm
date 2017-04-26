// # Execution
import { last, isString, isArray } from "../utils"
import { ERR_EXPECT_PATTERN, ERR_EXPECT_STRING } from "./errors"

// Basic execution operations
export default {
  //  **@dup**: Duplicate item (so you can use it twice)
  // `10,"@dup"`
  "@dup": ({ stack }) => stack.push(last(stack)),

  //  **@execute**: Execute an instruction
  // `10, 20, "add", "@execute"`
  "@execute": ({ operations, error }) => {
    const instr = operations.pop()
    if (isString(instr)) operations.push("@" + instr)
    else error("@execute", ERR_EXPECT_STRING, instr)
  },
  //  **@**: Alias of @execute
  // `10,"dup","@"`
  "@": "@execute",

  //  **@repeat**: Repeat
  // `4, "@repeat", ["@kick", 0.5, "@wait"]`
  "@repeat": ({ stack, operations, error }) => {
    const repetitions = stack.pop()
    const pattern = last(operations)
    if (!isArray(pattern)) error("@repeat", ERR_EXPECT_PATTERN, pattern)
    else {
      for (let i = 1; i < repetitions; i++) {
        operations.push(pattern)
      }
    }
  },

  //  **@forever**: Repeat forever
  // `"@forever", ["@kick", 0.5, "@wait"]`
  "@forever": ({ operations, error }) => {
    const pattern = last(operations)
    if (isArray(pattern) && pattern.length) {
      operations.push("@forever")
      operations.push(pattern)
    } else error("@forever", ERR_EXPECT_PATTERN, pattern)
  },
}
