// ## Schedule
import { isArray, isString } from "../utils"
import { ERR_EXPECT_PATTERN, ERR_EXPECT_STRING } from "./errors"

// Commands related to process scheduling
export default (scheduler) => ({
  // **@loop**: a special fork that repeats a pattern forever
  // `['@loop', [...]]`
  "@loop": proc => {
    const { operations, error } = proc
    const pattern = operations.pop()
    if (isArray(pattern)) scheduler.fork(null, proc, ["@forever", pattern])
    else error("@loop", ERR_EXPECT_PATTERN, pattern)
  },

  // **fork**: start a new (child) process. The child process uses the context of
  // the parent process
  "@fork": proc => {
    const { operations, error } = proc
    let pattern = operations.pop()

    if (isArray(pattern)) {
      scheduler.fork(null, proc, pattern)
    } else {
      error("@fork", ERR_EXPECT_PATTERN, pattern)
    }
  },

  // **@spawn**: start a new process with a name. Replace the old process with the
  // same name if any.
  "@spawn": proc => {
    const { stack, operations, error } = proc
    const name = stack.pop()
    let pattern = operations.pop()
    if (!isString(name)) {
      error("@spawn", ERR_EXPECT_STRING, name)
    } else if (!isArray(pattern)) {
      error("@spawn", ERR_EXPECT_PATTERN, pattern)
    } else {
      scheduler.stop(name)
      scheduler.fork(name, proc, ["@forever", pattern])
    }
  },

  // **@stop-all**: stop all processes
  "@stop-all": proc => scheduler.stopAll(),

  // **@stop**: stop the current process
  "@stop": ({ stack }) => scheduler.stop(stack.pop())
})
