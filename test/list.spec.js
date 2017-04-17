import initVM from "./testVM"
import list from "../src/cmds/list"
import stdlib from "../src/cmds/stdlib"

const VM = () => initVM(stdlib, list)

describe("List commands", () => {
  test("@quote", () => {
    const vm = VM()
    vm.run(["@quote", [1, 2, 3], "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [1, 2, 3] ])
  })

  test("@iter", () => {
    const vm = VM()
    vm.run([4, "@repeat", ["@quote", [1, 2, 3], "@iter", "@print"]])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([1, 2, 3, 1])
  })

  test("@reverse", () => {
    const vm = VM()
    vm.run(["@quote", [1, 2, 3], "@reverse", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [3, 2, 1] ])
  })

  test("@rotate", () => {
    const vm = VM()
    vm.run(["@quote", [1, 2, 3, 4], 2, "@rotate", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [3, 4, 1, 2] ])
  })
})
