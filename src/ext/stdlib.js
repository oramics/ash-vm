// # Standard library
import { isArray, isString, last } from "../utils"
import { ERR_EXPECT_PATTERN, ERR_EXPECT_STRING } from "../vm"

// The standard library include basic (arithmetic, logic, etc.) commands

// **wrap**
// A modulo operation that handles negative n more appropriately
// e.g. wrap(-1, 3) returns 2
// see http://en.wikipedia.org/wiki/Modulo_operation
// see also http://jsperf.com/modulo-for-negative-numbers
const wrap = (a, b) => (a % b + b) % b

// **op1**
// A generic stack operation that pops one value and pushes on result
const op1 = fn => ({ stack }) => {
  stack.push(fn(stack.pop()))
}

// **op2**
// A generic stack operation that pops two values and pushes one result
const op2 = fn => ({ stack }) => {
  stack.push(fn(stack.pop(), stack.pop()))
}

// ## Commands
// A commands object is a map from instrunction name to functions
export default {
  // ### Arithmetic

  // **@+**, **@add**: Add two values
  // `[1, 2, "@+"]`
  "@+": op2((b, a) => a + b),
  "@add": "@+",

  // **@-**, **@sub**: Subtract two values
  // `[2, 1, "@-"]`
  "@-": op2((b, a) => a - b),
  "@sub": "@-",

  // **@\***, **@mul**: Multiply two values
  // `[2, 4, "@*"]`
  "@*": op2((b, a) => a * b),
  "@mul": "@*",

  // **@/**, **@div**: Divide two values
  // `[4, 2, "@/"]`
  "@/": op2((b, a) => b === 0 ? 0 : a / b),
  "@div": "@/",

  // **@%**, **@wrap**: Modulo for positive and negative numbers
  // `[4, -2, "@%"]`
  "@%": op2((b, a) => b === 0 ? 0 : wrap(a, b)),
  "@wrap": "@%",

  // **@mod**: Standard modulo operation
  // `[4, 2, "@mod"]`
  "@mod": op2((b, a) => b === 0 ? 0 : a % b),

  // **@neg**: The negative of a value
  // `[4, "@neg"]`
  "@neg": op1(a => -a),

  // ### Logic

  // **@cond**: Conditional execution
  // `[true, "@cond", [<success pattern>], [<fail pattern>]]`
  "@cond": ({ stack, operations }) => {
    const test = stack.pop()
    // this is the pattern to execute if the test passes
    const success = operations.pop()
    // the next pattern is the "else" part
    if (test) {
      // remove the "else" part
      operations.pop()
      operations.push(success)
    }
  },

  // **@>**: Greater than
  "@>": op2((b, a) => a > b),
  // **@>=**: Greater or equal than
  "@>=": op2((b, a) => a >= b),
  // **@<**: Less than
  "@<": op2((b, a) => a < b),
  // **@<=**: Less or equal than
  "@<=": op2((b, a) => a <= b),
  // **@==**: Is equal
  "@==": op2((b, a) => a === b),
  // **@!=**: Is not equal
  "@!=": op2((b, a) => a !== b),
  "@!": op1(a => !a),
  // **@!**: Logic not
  "@not": "@!",
  // **@&&**, **@and**: Logic and
  "@&&": op2((b, a) => a && b),
  "@and": "@&&",
  // **@||**, **@or**: Logic or
  "@||": op2((b, a) => a || b),
  "@or": "@||",

  // ### Processes

  // Operations related to interact with the current process

  // **@let**: Assign a value to the local context
  // `440,"freq","@let"` |
  "@let": ({ stack, context }) => context.let(stack.pop(), stack.pop()),

  // **@set**: Assign a value to the global context
  "@set": ({ stack, context }) => context.set(stack.pop(), stack.pop()),

  // **@get**: Push the value of a variable into the stack
  "@get": ({ stack, context }) => stack.push(context.get(stack.pop())),

  // **@wait**: Wait an amount of time (in beats)
  // `1,"@wait"`
  "@wait": proc => proc.wait(Math.abs(Number(proc.stack.pop()))),

  // **@sync**: Wait until next beat
  "@sync": proc => proc.wait(Math.floor(proc.time) + 1 - proc.time),

  // **@scale-rate**: Change the current rate by a factor
  // `1.5, "@scale-rate"`
  "@scale-rate": proc => {
    const factor = parseFloat(proc.stack.pop(), 10)
    if (factor > 0) proc.rate *= factor
  },
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

  // ### Execute and repeat

  //  **@dup**: Duplicate item (so you can use it twice)
  // `10,"@dup"`
  "@dup": ({ stack }) => stack.push(last(stack)),

  //  **@execute**: Execute an instruction
  // `10,"dup","@execute"`
  "@execute": ({ operations, error }) => {
    const instr = operations.pop()
    if (isString(instr)) operations.push("@instr")
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

  // ### Utilities

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
  }
}
