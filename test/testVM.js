import { VM } from '../src/vm'

// Setup a VM for testing
export default function initVM (ext) {
  const vm = new VM()
  vm.printed = []
  if (ext) vm.addCommands(ext)

  vm.addCommands({
    '@print': ({ stack }) => vm.printed.push(stack.pop()),
    '@ptime': proc => vm.printed.push(proc.time.toFixed(2))
  })

  vm.run = (prog, dur = Infinity) => {
    vm.fork(null, null, prog)
    if (dur) vm.resume(dur)
  }
  return vm
}
