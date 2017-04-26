import initVM from "./testVM"

describe("Arithmetic commands", () => {
  test("@+", () => {
    const vm = initVM()
    vm.run([1, 2, "@+", 5, "@add", "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([8])
  })
})
