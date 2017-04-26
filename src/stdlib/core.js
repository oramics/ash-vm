// # Core

// **wrap**: A modulo operation that handles negative n more appropriately
// e.g. wrap(-1, 3) returns 2
// see http://en.wikipedia.org/wiki/Modulo_operation
// see also http://jsperf.com/modulo-for-negative-numbers
export const wrap = (a, b) => (a % b + b) % b

// **op1**: A generic stack operation that pops one value and pushes on result
export const op1 = fn => ({ stack }) => {
  stack.push(fn(stack.pop()))
}

// **op2**: A generic stack operation that pops two values and pushes one result
export const op2 = fn => ({ stack }) => {
  stack.push(fn(stack.pop(), stack.pop()))
}

// The core of stdlib commands. It include arithmetic, logic,
// execution and repetition

export default {
  // ## Arithmetic
  // Arithmetic operation commands

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

  // ## Logic
  // Logic commands, including conditional execution

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
}
