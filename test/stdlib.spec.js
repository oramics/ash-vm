/* global describe test expect */
import initVM from "./testVM"
import stdlib from "../src/cmds/stdlib"

describe("Execute and repetition", () => {
  test("@dup", () => {
    const vm = initVM(stdlib)
    vm.run([1, "@dup", "@print", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([1, 1])
  })
  test("@repeat", () => {
    const vm = initVM(stdlib)
    vm.run([4, "@repeat", ["r", "@print"]])
    vm.resume(Infinity)
    expect(vm.printed).toEqual(["r", "r", "r", "r"])
  })
})

describe("Process controll commands", () => {
  test("@with-rate", () => {
    const vm = initVM(stdlib)
    vm.run([0.5, "@wait", "@ptime",
      2, "@with-rate", [0.5, "@wait", "@ptime"],
      0.5, "@wait", "@ptime"
    ])
    vm.resume(Infinity)
    expect(vm.printed).toEqual(["0.50", "1.50", "2.00"])
  })
})

describe("Arithmetic commands", () => {
  test("@+", () => {
    const vm = initVM(stdlib)
    vm.run([1, 2, "@+", 5, "@add", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([8])
  })
})
