import initVM from "./testVM"

describe("Iterator stdlib commands", () => {
  test("@quote", () => {
    const vm = initVM()
    vm.run(["@quote", [1, 2, 3], "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [1, 2, 3] ])
  })

  test("@iter", () => {
    const vm = initVM()
    vm.run([4, "@repeat", ["@quote", [1, 2, 3], "@iter", "@print"]])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([1, 2, 3, 1])
  })

  test("@reverse", () => {
    const vm = initVM()
    vm.run(["@quote", [1, 2, 3], "@reverse", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [3, 2, 1] ])
  })

  test("@rotate", () => {
    const vm = initVM()
    vm.run(["@quote", [1, 2, 3, 4], 2, "@rotate", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([ [3, 4, 1, 2] ])
  })
})
