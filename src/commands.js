// # Commands
const isArray = Array.isArray

// Commands are functions that receives a `process` object and performs an operation

// ## Basic commands

// This are the core operations: execute instructions, modify
// process time and scope variables

// | Name | Description | Example |
// |------|-------------|---------|
// | **@dup** | Duplicate item (so you can use it twice) | `10,@dup` |
// | **@execute** | Execute an instruction | `10,'dup','@execute'` |
// | **@** | Alias of @execute | `10,'dup','@'` |
// | **@let** | Assign a value to the local scope | `10,'repetitions',@let` |
// | **@set** | Assign a value to the global scope | `10,'parts',@set` |
// | **@get** | Push the value of a variable into the stack | `'repetitions',@get` |
// | **@wait** | Wait an amount of time | `1,@wait` |
export const process = {
  '@dup': ({ stack }) => stack.push(stack.pop(stack.length - 1)),
  '@execute': ({ stack }) => {
    const instr = stack.pop()
    if (typeof instr !== 'string') throw Error('Trying to execute something that is not a string: ' + instr)
    stack.push('@' + instr)
  },
  '@': '@execute',

  '@let': ({ stack, scope }) => scope.let(stack.pop(), stack.pop()),
  '@set': ({ stack, scope }) => scope.set(stack.pop(), stack.pop()),
  '@get': ({ stack, scope }) => stack.push(scope.get(stack.pop())),

  '@wait': (process) => process.wait(Math.abs(Number(process.stack.pop())))
}

// ## Schedule commands

// | Name | Description | Example |
// |------|-------------|---------|
// | **@fork** | Fork | `@fork, [0.5, '@wait', '@kick']` |
export const schedule = {
  '@fork': (proc) => {
    const { operations, scheduler } = proc
    const pattern = operations.pop()

    if (!scheduler) throw Error("Fork error - Can't fork a process without scheduler.")
    if (!isArray(pattern)) throw Error('Fork error - not valid pattern: ' + pattern)
    scheduler.fork(proc, pattern)
  }
}

// ## Repeat and loop

// | Name | Description | Example |
// |------|-------------|---------|
// | **@repeat** | Repeat a pattern | `4, @repeat, ['@kick', 0.5, '@wait']` |
export const repeat = {
  '@repeat': ({ stack, operations }) => {
    const repetitions = stack.pop()
    const pattern = operations[operations.length - 1]
    if (!isArray(pattern)) throw Error("Can't repeat: " + pattern)
    for (let i = 1; i < repetitions; i++) {
      operations.push(pattern)
    }
  }
}

// ## Debug operations

// | Name | Description | Example |
// |------|-------------|---------|
// | **@print** | Print the last value of the stack | `10,@print` |
export const debug = {
  '@print': (proc) => {
    const stack = proc.stack
    const last = stack.length ? stack.pop() : '<Empty Stack>'
    console.log('@print', last, '(id, time)', proc.id, proc.time)
  }
}
