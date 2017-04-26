// # Context
// Commands to use the context

// **@let**: Assign a value to the local context
// `[440, "freq", "@let"]`
const letFn = ({ stack, context }) => context.let(stack.pop(), stack.pop())

// **@set**: Assign a value to the global context
// `[0.8, "amp", "@set"]
const setFn = ({ stack, context }) => context.set(stack.pop(), stack.pop())

// **@get**: Get a value from the context and push it into the stack
// `["freq", "@get", 2, "@*"]`
const getFn = ({ stack, context }) => stack.push(context.get(stack.pop()))

// **@let-_name_**: Asign a value to the local context with the given _name_
// `[440, "@let-freq"]
const letName = (name) => ({ stack, context }) => context.let(name, stack.pop())

// **@set-_name_**: Asign a value to the global context with the given _name_
// `[440, "@set-freq"]
const setName = (name) => ({ stack, context }) => context.set(name, stack.pop())

// **@get-_name_**: Get the _name_ value from the context and push into the stack
// `["@get-freq", 2, "@*"]
const getName = (name) => ({ stack, context }) => stack.push(context.get(name))

export default (cmd) =>
  cmd === "@let" ? letFn
  : cmd === "@set" ? setFn
  : cmd === "@get" ? getFn
  : /^@let-.+/.exec(cmd) ? letName(cmd.slice(5))
  : /^@set-.+/.exec(cmd) ? setName(cmd.slice(5))
  : /^@get-.+/.exec(cmd) ? getName(cmd.slice(5))
  : undefined
