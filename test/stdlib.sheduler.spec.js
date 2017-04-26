import initVM from "./testVM"

describe("Scheduler commands", () => {
  test("@fork", () => {
    const vm = initVM()
    vm.run(["@fork", [1, "@print"], 2, "@print"])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([2, 1])
  })

  test("@loop", () => {
    const vm = initVM()
    vm.run(["@loop", ["@ptime", 0.2, "@wait"]])
    vm.resume(1)
    expect(vm.printed).toEqual(["0.00", "0.20", "0.40", "0.60", "0.80"])
  })

  test("@stop-all", () => {
    const vm = initVM()
    vm.run([
      "@loop",
      ["A", "@print", "@ptime", 0.5, "@wait"],
      "@loop",
      ["B", "@print", "@ptime", 0.6, "@wait"],
      1,
      "@wait",
      "@stop-all"
    ])
    vm.resume(1)
    vm.resume(2)
    expect(vm.printed).toEqual([
      "A",
      "0.00",
      "A",
      "0.50",
      "B",
      "0.00",
      "B",
      "0.60"
    ])
  })
})
