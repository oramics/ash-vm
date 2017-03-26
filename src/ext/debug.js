// # Debug operations

// | Name | Description | Example |
// |------|-------------|---------|
// | **@print** | Print the last value of the stack | `10,"@print"` |
// | **@log** | Log the name with the last value of the stack | `"@random", "amp", "@log"` |
export default function debug(log) {
  log = log || console.log.bind(console)

  return {
    "@print": (proc) => {
      const { stack } = proc;
      const last = stack.length ? last(stack) : "<Empty Stack>";
      log("@print", last, "(id, time)", proc.id, proc.time);
    },
    "@log": (proc) => {
      const { stack } = proc;
      const name = stack.pop();
      const last = stack.length ? last(stack) : "<Empty Stack>";
      log("@log", name, last, "(id, time)", proc.id, proc.time);
    },
    "@debug": (proc) => {
      const { stack } = proc;
      log("@debug", stack, proc.id, proc.time);
    }
  };
}
