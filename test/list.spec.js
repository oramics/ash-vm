import initVM from "./testVM"
import list from "../src/ext/list"
import stdlib from "../src/ext/stdlib"

const VM = () => initVM(stdlib, list)

describe("List commands", () => {
  test("@list", () => {
    const vm = VM()
    vm.run(["@list", [1, 2, 3], "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [1, 2, 3] ])
  })

  test("@iter", () => {
    const vm = VM()
    vm.run([4, "@repeat", ["@list", [1, 2, 3], "@iter", "@print"]])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([1, 2, 3, 1])
  })

  test("@reverse", () => {
    const vm = VM()
    vm.run(["@list", [1, 2, 3], "@reverse", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [3, 2, 1] ])
  })

  test("@rotate", () => {
    const vm = VM()
    vm.run(["@list", [1, 2, 3, 4], 2, "@rotate", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [3, 4, 1, 2] ])
  })
})
