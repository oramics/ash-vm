import VM from "../src/vm"
import AudioDriver from "../src/audio-driver"

export const log = (name, value) => { console.log(name, value); return value }

// Setup a VM for testing
export default function initVM (options) {
  const driver = new AudioDriver(120, 44100)
  const vm = new VM(driver, options)
  vm.printed = []
  vm.addCommands({
    "@print": ({ stack }) => vm.printed.push(stack.pop()),
    "@ptime": proc => vm.printed.push(proc.time.toFixed(2)),
    "@debug": proc => console.log("@debug", proc)
  })
  return vm
}
