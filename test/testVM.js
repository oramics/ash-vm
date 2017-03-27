import { VM } from '../lib/vm'

// Setup a VM for testing
export default function initVM (ext) {
  const vm = new VM()
  vm.printed = []
  if (ext) vm.addCommands(ext)

  vm.addCommands({
    '@print': ({ stack }) => vm.printed.push(stack.pop()),
    '@ptime': proc => vm.printed.push(proc.time.toFixed(2))
  })

  return vm
}
