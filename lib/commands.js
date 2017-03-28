// # Commands
import { isArray, isString, last, wrap } from './utils'

// **Error messages**
export const ERR_EXPECT_PATTERN = 'Expected a pattern, but found:'
export const ERR_EXPECT_STRING = 'Expected a string, but found:'

// **Utilities**

// A generic stack operation that pops one value and pushes on result
const op1 = fn => ({ stack }) => {
  stack.push(fn(stack.pop()))
}

// A generic stack operation that pops two values and pushes one result
const op2 = fn => ({ stack }) => {
  stack.push(fn(stack.pop(), stack.pop()))
}

// A commands object is a map from instrunction name to functions
export default {
  // ## Arithmetic
  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@+**, **@add** | Add two values | `[1, 2, "@+"]` |
  // | **@-**, **@sub** | Subtract two values | `[2, 1, "@-"]` |
  // | **@\***, **@mul** | Multiply two values | `[2, 4, "@*"]` |
  // | **@/**, **@div** | Divide two values | `[4, 2, "@*"]` |
  // | **@%**, **@wrap** | Modulo for positive and negative numbers | `[4, -2, "@%"]` |
  // | **@mod* | Standard modulo operation | `[4, 2, "@mod"]` |
  // | **@neg* | The negative of a value | `[4, "@neg"]` |
  // [1, 2, "@+"]
  '@+': op2((b, a) => a + b),
  // [1, 2, "@add"]
  '@add': '@+',
  // [2, 1, "@-"]
  '@-': op2((b, a) => a - b),
  // [2, 1, "@sub"]
  '@sub': '@-',
  '@*': op2((b, a) => a * b),
  '@mul': '@*',
  '@/': op2((b, a) => b === 0 ? 0 : a / b),
  '@div': '@/',
  '@%': op2((b, a) => b === 0 ? 0 : wrap(a, b)),
  '@wrap': '@%',
  '@mod': op2((b, a) => b === 0 ? 0 : a % b),
  '@neg': op1(a => -a),

  // ## Logic
  // **cond**: Conditional execution
  // `[true, "@cond", [<success pattern>], [<fail pattern>]]`
  '@cond': ({ stack, operations }) => {
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
  '@>': op2((b, a) => a > b),
  '@>=': op2((b, a) => a >= b),
  '@<': op2((b, a) => a < b),
  '@<=': op2((b, a) => a <= b),
  '@==': op2((b, a) => a === b),
  '@!=': op2((b, a) => a !== b),
  '@!': op1(a => !a),
  '@not': '@!',
  '@&&': op2((b, a) => a && b),
  '@and': '@&&',
  '@||': op2((b, a) => a || b),
  '@or': '@||',

  // ## Processes

  // Operation related to interact with the current process

  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@** | Alias of @execute | `10,'dup','@'` |
  // | **@let** | Assign a value to the local context | `10,'repetitions','@let'` |
  // | **@set** | Assign a value to the global context | `10,'parts','@set'` |
  // | **@get** | Push the value of a variable into the stack | `'repetitions','@get'` |
  // | **@wait** | Wait an amount of time | `1,'@wait'` |
  // | **@sync** | Wait until next beat | `'@sync'` |
  // | **@scale-rate** | Change the current rate by a factor | `1.5, '@scale-rate'` |

  '@let': ({ stack, context }) => context.let(stack.pop(), stack.pop()),
  '@set': ({ stack, context }) => context.set(stack.pop(), stack.pop()),
  '@get': ({ stack, context }) => stack.push(context.get(stack.pop())),

  '@wait': proc => proc.wait(Math.abs(Number(proc.stack.pop()))),
  '@sync': proc => proc.wait(Math.floor(proc.time) + 1 - proc.time),

  '@scale-rate': (proc) => {
    const factor = parseFloat(proc.stack.pop(), 10)
    if (factor > 0) proc.rate *= factor
  },
  '@with-rate': ({ stack, operations, error }) => {
    const factor = parseFloat(stack.pop(), 10)
    const pattern = operations.pop()
    if (!isArray(pattern)) error('@with-rate', ERR_EXPECT_PATTERN, pattern)
    operations.push([factor, '@scale-rate', pattern, 1 / factor, '@scale-rate'])
  },

  // ## Execute and repeat

  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@dup** | Duplicate item (so you can use it twice) | `10,'@dup'` |
  // | **@execute** | Execute an instruction | `10,'dup','@execute'` |
  // | **@repeat** | Repeat | `4, "@repeat", ["@kick", 0.5, "@wait"]` |
  // | **@forever** | Repeat forever | `"@forever", ["@kick", 0.5, "@wait"]` |
  '@dup': ({ stack }) => stack.push(last(stack)),
  '@execute': ({ operations, error }) => {
    const instr = operations.pop()
    if (isString(instr)) operations.push('@instr')
    else error('@execute', ERR_EXPECT_STRING, instr)
  },
  '@': '@execute',
  '@repeat': ({ stack, operations }) => {
    const repetitions = stack.pop()
    const pattern = last(operations)
    if (!isArray(pattern)) throw Error("Can't repeat: " + pattern)
    for (let i = 1; i < repetitions; i++) {
      operations.push(pattern)
    }
  },
  '@forever': ({ operations }) => {
    const pattern = last(operations)
    if (!isArray(pattern)) throw Error("Can't forover: " + pattern)
    if (pattern.length) {
      operations.push('@forever')
      operations.push(pattern)
    }
  },

  // ## Iteration and lists
  // | Name | Description | Example |
  // |------|-------------|---------|
  // | **@iter** | Iterate a pattern | `[["@iter", [0.3, 1]], "amp", "@set"]` |
  '@iter': ({ operations, error }) => {
    const pattern = operations.pop()
    if (!isArray(pattern) || !pattern.length) {
      error('@iter', ERR_EXPECT_PATTERN, pattern)
    } else {
      // Rotates the pattern and plays the first item only each time
      // remove '1st' item, schedule, then push to back:
      const first = pattern.splice(0, 1)
      operations.push(first)
      pattern.push(first)
    }
  },
  '@reverse': ({ operations }) => {}
}

// Given a commands object, expand the aliases
export function expandAliases (commands) {
  Object.keys(commands).forEach(name => {
    const op = commands[name]
    if (isString(op)) commands[name] = commands[op]
  })
  return commands
}
