// ## Iterables
import { isArray, isNum } from "../utils"
import { ERR_EXPECT_LIST, ERR_EXPECT_NUM } from "./errors"

// Commands to work with iterables
export default {
  // **@list**: Store a list into the stack to allow other operations
  // use or change the list
  // `["@list", [1, 2, 3]]`
  "@quote": ({ stack, operations, error }) => {
    const list = operations.pop()
    if (!isArray(list)) error("@list", ERR_EXPECT_LIST, list)
    else stack.push(list)
  },
  "@q": "@quote",

  //  **@iter**: Iterate a list
  // `["@list", [1, 2, 3], "@iter", "amp", "@set"]`
  "@iter": ({ stack, error }) => {
    const list = stack.pop()
    if (!isArray(list)) {
      error("@iter", ERR_EXPECT_LIST, list)
    } else {
      // Add the next element into the stack
      const next = list.shift()
      stack.push(next)
      // rotate (and mutate) the pattern
      list.push(next)
    }
  },

  //  **@reverse**: Reverse a list
  // `["@list", [1, 2, 3], "@reverse"]`
  "@reverse": ({ stack, error }) => {
    const list = stack.pop()
    if (!isArray(list)) error("@reverse", ERR_EXPECT_LIST, list)
    else stack.push(list.slice().reverse())
  },

  //  **@rotate**: Rotate a pattern
  // `["@list", [1, 2, 3, 4], 2, "@rotate"]`
  "@rotate": ({ stack, error }) => {
    const rotations = stack.pop()
    const list = stack.pop()

    if (!isArray(list)) {
      error("@rotate", ERR_EXPECT_LIST, list)
    } else if (!isNum(rotations)) {
      error("@rotate", ERR_EXPECT_NUM, rotations)
    } else {
      // ensure rot is valid between -args.length to +args.length
      const rot = rotations % list.length
      // FIXME: find a more performant way to do rotation
      var copy = [].concat(list.slice(rot)).concat(list.slice(0, rot))
      stack.push(copy)
    }
  },
}
