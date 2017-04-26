import initVM from "./testVM"

describe("Process controll commands", () => {
  test("@with-rate", () => {
    const vm = initVM()
    vm.run([0.5, "@wait", "@ptime",
      2, "@with-rate", [0.5, "@wait", "@ptime"],
      0.5, "@wait", "@ptime"
    ])
    vm.resume(Infinity)
    expect(vm.printed).toEqual(["0.50", "1.50", "2.00"])
  })
})
