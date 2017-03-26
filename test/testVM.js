import { VM } from "../src/vm";

// Setup a VM for testing
export default function initVM () {
  const vm = new VM()
  vm.printed = [];
  vm.addCommands({
    "@print": ({ stack }) => vm.printed.push(stack.pop())
  });
  vm.run = prog => {
    vm.fork(null, null, prog);
    vm.resume(Infinity);
  };
  return vm;
}
